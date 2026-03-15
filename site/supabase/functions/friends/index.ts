import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type FriendVisibility = 'full' | 'busy_free' | 'off';

interface ApiEnvelope<T> {
	success: boolean;
	data?: T;
	error?: string;
}

interface ProfileRow {
	id: string;
	email: string | null;
	display_name: string | null;
	friend_code: string;
	friends_visibility: FriendVisibility;
}

interface FriendRow {
	id: string;
	user_id: string;
	friend_id: string;
	status: 'pending' | 'accepted';
	visibility: FriendVisibility;
	created_at: string;
}

interface StoredSchedule {
	scheduleName: string;
	selections: unknown[];
	term: 'Fall' | 'Spring' | 'Winter' | 'Summer';
	year: number;
}

interface UserSchedulesRow {
	schedules: {
		currentSchedule: StoredSchedule;
		nonselectedSchedules: StoredSchedule[];
	};
}

const corsHeaders: HeadersInit = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, Authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function getAccessTokenFromRequest(request: Request): string | null {
	const authorizationHeader =
		request.headers.get('authorization') ?? request.headers.get('Authorization') ?? '';

	const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
	if (!match) {
		return null;
	}

	const token = match[1]?.trim();
	if (!token) {
		return null;
	}

	return token;
}

function toResponse<T>(body: ApiEnvelope<T>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders
		}
	});
}

function displayName(profile: ProfileRow): string {
	return profile.display_name ?? profile.email ?? profile.friend_code;
}

async function ensureProfile(
	supabase: ReturnType<typeof createClient>,
	userId: string,
	email: string | null
): Promise<ProfileRow> {
	const { data, error } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	if (data) {
		return data as ProfileRow;
	}

	const { data: inserted, error: insertError } = await supabase
		.from('profiles')
		.insert({
			id: userId,
			email,
			display_name: email
		})
		.select('id,email,display_name,friend_code,friends_visibility')
		.single();

	if (insertError || !inserted) {
		throw new Error(insertError?.message ?? 'Unable to create profile');
	}

	return inserted as ProfileRow;
}

async function getProfilesByIds(
	supabase: ReturnType<typeof createClient>,
	ids: string[]
): Promise<Map<string, ProfileRow>> {
	if (ids.length === 0) {
		return new Map();
	}

	const { data, error } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.in('id', Array.from(new Set(ids)));

	if (error) {
		throw new Error(error.message);
	}

	const map = new Map<string, ProfileRow>();
	((data as ProfileRow[]) ?? []).forEach((row) => {
		map.set(row.id, row);
	});
	return map;
}

function sanitizeError(message: string): string {
	const normalized = message.toLowerCase();
	if (
		normalized.includes('schema cache') ||
		normalized.includes('could not find the table') ||
		normalized.includes('relation')
	) {
		return 'Friends database is not initialized yet. Apply the Supabase migration first.';
	}

	return message;
}

Deno.serve(async (request: Request): Promise<Response> => {
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: corsHeaders
		});
	}

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
		if (!supabaseUrl || !supabaseAnonKey) {
			return toResponse(
				{
					success: false,
					error: 'Supabase environment not configured'
				},
				500
			);
		}

		const accessToken = getAccessTokenFromRequest(request);
		if (!accessToken) {
			return toResponse(
				{
					success: false,
					error: 'Missing or invalid Authorization header'
				},
				401
			);
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			global: {
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			},
			auth: {
				persistSession: false,
				autoRefreshToken: false
			}
		});

		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			return toResponse({ success: false, error: 'Unauthorized' }, 401);
		}

		const userId = authData.user.id;
		const selfProfile = await ensureProfile(supabase, userId, authData.user.email ?? null);

		const url = new URL(request.url);
		const pathname = url.pathname.replace(/\/+$/, '');
		const segments = pathname.split('/').filter((segment) => segment.length > 0);
		const endpoint = segments[segments.length - 1] ?? '';
		const parent = segments[segments.length - 2] ?? '';

		if (request.method === 'GET' && endpoint === 'summary') {
			const { data, error } = await supabase
				.from('friends')
				.select('id,user_id,friend_id,status,visibility,created_at')
				.or(`user_id.eq.${userId},friend_id.eq.${userId}`);
			if (error) {
				throw new Error(error.message);
			}

			const rows = (data ?? []) as FriendRow[];
			const relatedIds = rows.map((row) => {
				return row.user_id === userId ? row.friend_id : row.user_id;
			});
			const profiles = await getProfilesByIds(supabase, relatedIds);

			const incoming = rows
				.filter((row) => row.status === 'pending' && row.friend_id === userId)
				.map((row) => {
					const from = profiles.get(row.user_id);
					if (!from) {
						return null;
					}
					return {
						id: row.id,
						from: {
							id: from.id,
							email: from.email,
							displayName: from.display_name,
							friendCode: from.friend_code,
							friendsVisibility: from.friends_visibility
						},
						createdAt: row.created_at
					};
				})
				.filter((row) => row !== null);

			const outgoing = rows
				.filter((row) => row.status === 'pending' && row.user_id === userId)
				.map((row) => {
					const to = profiles.get(row.friend_id);
					if (!to) {
						return null;
					}
					return {
						id: row.id,
						to: {
							id: to.id,
							email: to.email,
							displayName: to.display_name,
							friendCode: to.friend_code,
							friendsVisibility: to.friends_visibility
						},
						createdAt: row.created_at
					};
				})
				.filter((row) => row !== null);

			const friends = rows
				.filter((row) => row.status === 'accepted' && row.user_id === userId)
				.map((row) => {
					const friend = profiles.get(row.friend_id);
					if (!friend) {
						return null;
					}
					return {
						id: row.id,
						friend: {
							id: friend.id,
							email: friend.email,
							displayName: friend.display_name,
							friendCode: friend.friend_code,
							friendsVisibility: friend.friends_visibility
						},
						visibility: row.visibility,
						createdAt: row.created_at
					};
				})
				.filter((row) => row !== null)
				.sort((a, b) => {
					return displayName({
						id: a!.friend.id,
						email: a!.friend.email,
						display_name: a!.friend.displayName,
						friend_code: a!.friend.friendCode,
						friends_visibility: a!.friend.friendsVisibility
					}).localeCompare(
						displayName({
							id: b!.friend.id,
							email: b!.friend.email,
							display_name: b!.friend.displayName,
							friend_code: b!.friend.friendCode,
							friends_visibility: b!.friend.friendsVisibility
						})
					);
				});

			return toResponse({
				success: true,
				data: {
					selfProfile: {
						id: selfProfile.id,
						email: selfProfile.email,
						displayName: selfProfile.display_name,
						friendCode: selfProfile.friend_code,
						friendsVisibility: selfProfile.friends_visibility
					},
					incoming,
					outgoing,
					friends
				}
			});
		}

		if (request.method === 'GET' && endpoint === 'view-options') {
			const { data, error } = await supabase
				.from('friends')
				.select('friend_id,status')
				.eq('user_id', userId)
				.eq('status', 'accepted');
			if (error) {
				throw new Error(error.message);
			}

			const friendIds = (data ?? []).map((row) => row.friend_id as string);
			const profiles = await getProfilesByIds(supabase, friendIds);

			return toResponse({
				success: true,
				data: {
					selfName: displayName(selfProfile),
					friends: friendIds
						.map((id) => {
							const profile = profiles.get(id);
							if (!profile) {
								return null;
							}
							return {
								id: profile.id,
								label: displayName(profile)
							};
						})
						.filter((row) => row !== null)
				}
			});
		}

		if (request.method === 'GET' && endpoint === 'schedule') {
			const friendId = url.searchParams.get('friendId');
			const term = url.searchParams.get('term');
			const yearRaw = url.searchParams.get('year');
			const year = yearRaw ? Number(yearRaw) : null;

			if (!friendId) {
				return toResponse(
					{
						success: false,
						error: 'Missing friend id'
					},
					400
				);
			}

			const { data: friendProfileRaw, error: friendProfileError } = await supabase
				.from('profiles')
				.select('id,email,display_name,friend_code,friends_visibility')
				.eq('id', friendId)
				.maybeSingle();

			if (friendProfileError) {
				throw new Error(friendProfileError.message);
			}

			const friendProfile = friendProfileRaw as ProfileRow | null;
			const friendName = friendProfile ? displayName(friendProfile) : 'Friend';

			const { data: relationRaw, error: relationError } = await supabase
				.from('friends')
				.select('id,user_id,friend_id,status,visibility,created_at')
				.eq('user_id', friendId)
				.eq('friend_id', userId)
				.eq('status', 'accepted')
				.maybeSingle();

			if (relationError) {
				throw new Error(relationError.message);
			}

			if (!relationRaw) {
				return toResponse({
					success: true,
					data: {
						visibility: 'off',
						friendName,
						schedule: null,
						message: 'You can only view accepted friends schedules'
					}
				});
			}

			const relation = relationRaw as FriendRow;
			const profileVisibility = friendProfile?.friends_visibility ?? 'full';
			const effectiveVisibility = profileVisibility === 'off' ? 'off' : relation.visibility;

			if (effectiveVisibility === 'off') {
				return toResponse({
					success: true,
					data: {
						visibility: 'off',
						friendName,
						schedule: null,
						message: 'This friend has schedule sharing turned off'
					}
				});
			}

			const { data: schedulesRaw, error: schedulesError } = await supabase
				.from('user_schedules')
				.select('schedules')
				.eq('user_id', friendId)
				.maybeSingle();

			if (schedulesError) {
				throw new Error(schedulesError.message);
			}

			if (!schedulesRaw) {
				return toResponse({
					success: true,
					data: {
						visibility: effectiveVisibility,
						friendName,
						schedule: null,
						message: 'No schedule available for this friend yet'
					}
				});
			}

			const schedules = (schedulesRaw as UserSchedulesRow).schedules;
			const allSchedules = [schedules.currentSchedule, ...schedules.nonselectedSchedules];

			const selectedSchedule =
				term && Number.isInteger(year)
					? (allSchedules.find((schedule) => {
							return schedule.term === term && schedule.year === year;
						}) ?? schedules.currentSchedule)
					: schedules.currentSchedule;

			return toResponse({
				success: true,
				data: {
					visibility: effectiveVisibility,
					friendName,
					schedule: selectedSchedule,
					message: null
				}
			});
		}

		if (request.method === 'POST' && (endpoint === 'requests' || endpoint === 'friends')) {
			const body = (await request.json()) as {
				mode: 'email' | 'code';
				email?: string;
				code?: string;
				value: string;
			};

			const rawValue =
				body.mode === 'email' ? (body.value ?? body.email ?? '') : (body.value ?? body.code ?? '');
			const value = rawValue.trim();
			if (value.length === 0) {
				return toResponse({ success: false, error: 'Enter a value first' }, 400);
			}

			let targetProfile: ProfileRow | null = null;
			if (body.mode === 'email') {
				const { data, error } = await supabase
					.from('profiles')
					.select('id,email,display_name,friend_code,friends_visibility')
					.ilike('email', value.toLowerCase())
					.maybeSingle();
				if (error) {
					throw new Error(error.message);
				}
				targetProfile = data as ProfileRow | null;
				if (!targetProfile) {
					return toResponse({ success: false, error: 'No user found with that email' }, 404);
				}
			} else {
				const { data, error } = await supabase
					.from('profiles')
					.select('id,email,display_name,friend_code,friends_visibility')
					.eq('friend_code', value.toUpperCase())
					.maybeSingle();
				if (error) {
					throw new Error(error.message);
				}
				targetProfile = data as ProfileRow | null;
				if (!targetProfile) {
					return toResponse({ success: false, error: 'No user found with that friend code' }, 404);
				}
			}

			if (targetProfile.id === userId) {
				return toResponse({ success: false, error: 'You cannot add yourself' }, 400);
			}

			const { data: existing, error: existingError } = await supabase
				.from('friends')
				.select('id,status')
				.or(
					`and(user_id.eq.${userId},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${userId})`
				);

			if (existingError) {
				throw new Error(existingError.message);
			}

			if ((existing ?? []).some((row) => row.status === 'accepted')) {
				return toResponse({ success: false, error: "You're already friends with this user" }, 409);
			}

			if ((existing ?? []).some((row) => row.status === 'pending')) {
				return toResponse({ success: false, error: 'A friend request is already pending' }, 409);
			}

			const { error: insertError } = await supabase.from('friends').insert({
				user_id: userId,
				friend_id: targetProfile.id,
				status: 'pending',
				visibility: 'full'
			});

			if (insertError) {
				throw new Error(insertError.message);
			}

			return toResponse({
				success: true,
				data: {
					ok: true,
					message: 'Friend request sent'
				}
			});
		}

		if (request.method === 'POST' && endpoint === 'visibility' && parent === 'profile') {
			const body = (await request.json()) as { visibility: FriendVisibility };
			const visibility = body.visibility;
			if (!['full', 'busy_free', 'off'].includes(visibility)) {
				return toResponse({ success: false, error: 'Invalid visibility value' }, 400);
			}

			const { error } = await supabase
				.from('profiles')
				.update({ friends_visibility: visibility })
				.eq('id', userId);

			if (error) {
				throw new Error(error.message);
			}

			return toResponse({
				success: true,
				data: {
					ok: true,
					message: 'Default visibility updated'
				}
			});
		}

		if (request.method === 'POST' && endpoint === 'visibility' && parent !== 'profile') {
			const friendId = parent;
			const body = (await request.json()) as { visibility: FriendVisibility };
			const visibility = body.visibility;
			if (!['full', 'busy_free', 'off'].includes(visibility)) {
				return toResponse({ success: false, error: 'Invalid visibility value' }, 400);
			}

			const { error } = await supabase
				.from('friends')
				.update({ visibility })
				.eq('user_id', userId)
				.eq('friend_id', friendId)
				.eq('status', 'accepted');

			if (error) {
				throw new Error(error.message);
			}

			return toResponse({
				success: true,
				data: {
					ok: true,
					message: 'Visibility updated'
				}
			});
		}

		if (request.method === 'POST' && endpoint === 'remove') {
			const friendId = parent;
			const { error } = await supabase
				.from('friends')
				.delete()
				.or(
					`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
				)
				.eq('status', 'accepted');

			if (error) {
				throw new Error(error.message);
			}

			return toResponse({
				success: true,
				data: {
					ok: true,
					message: 'Friend removed'
				}
			});
		}

		if (request.method === 'POST' && endpoint === 'requests' && parent !== 'friends') {
			// no-op fallthrough protection
		}

		if (request.method === 'POST' && parent === 'requests') {
			const requestId = endpoint;
			const body = (await request.json()) as {
				action: 'accept' | 'decline' | 'cancel';
			};

			if (body.action === 'accept') {
				const { data: pending, error: pendingError } = await supabase
					.from('friends')
					.select('id,user_id,friend_id,status,visibility,created_at')
					.eq('id', requestId)
					.eq('friend_id', userId)
					.eq('status', 'pending')
					.maybeSingle();

				if (pendingError) {
					throw new Error(pendingError.message);
				}

				if (!pending) {
					return toResponse({ success: false, error: 'Friend request not found' }, 404);
				}

				const row = pending as FriendRow;

				const { error: updateError } = await supabase
					.from('friends')
					.update({ status: 'accepted', visibility: 'full' })
					.eq('id', requestId);

				if (updateError) {
					throw new Error(updateError.message);
				}

				const { data: reverseExisting, error: reverseLookupError } = await supabase
					.from('friends')
					.select('id')
					.eq('user_id', userId)
					.eq('friend_id', row.user_id)
					.maybeSingle();

				if (reverseLookupError) {
					throw new Error(reverseLookupError.message);
				}

				if (reverseExisting) {
					const { error: reverseUpdateError } = await supabase
						.from('friends')
						.update({ status: 'accepted', visibility: 'full' })
						.eq('id', reverseExisting.id);
					if (reverseUpdateError) {
						throw new Error(reverseUpdateError.message);
					}
				} else {
					const { error: reverseInsertError } = await supabase.from('friends').insert({
						user_id: userId,
						friend_id: row.user_id,
						status: 'accepted',
						visibility: 'full'
					});
					if (reverseInsertError) {
						throw new Error(reverseInsertError.message);
					}
				}

				return toResponse({
					success: true,
					data: {
						ok: true,
						message: 'Friend request accepted'
					}
				});
			}

			if (body.action === 'decline') {
				const { error } = await supabase
					.from('friends')
					.delete()
					.eq('id', requestId)
					.eq('friend_id', userId)
					.eq('status', 'pending');
				if (error) {
					throw new Error(error.message);
				}

				return toResponse({
					success: true,
					data: {
						ok: true,
						message: 'Friend request declined'
					}
				});
			}

			if (body.action === 'cancel') {
				const { error } = await supabase
					.from('friends')
					.delete()
					.eq('id', requestId)
					.eq('user_id', userId)
					.eq('status', 'pending');
				if (error) {
					throw new Error(error.message);
				}

				return toResponse({
					success: true,
					data: {
						ok: true,
						message: 'Friend request canceled'
					}
				});
			}
		}

		return toResponse(
			{
				success: false,
				error: 'Endpoint not found'
			},
			404
		);
	} catch (error) {
		const message = error instanceof Error ? sanitizeError(error.message) : 'Internal server error';
		console.error('friends edge function error', error);
		return toResponse(
			{
				success: false,
				error: message
			},
			500
		);
	}
});
