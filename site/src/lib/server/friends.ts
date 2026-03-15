import type { StoredSchedule } from '../../types';
import type {
	FriendProfile,
	FriendRecord,
	FriendsSummary,
	FriendVisibility,
	IncomingFriendRequest,
	OutgoingFriendRequest
} from '$lib/friends/types';

const VALID_VISIBILITY: FriendVisibility[] = ['full', 'busy_free', 'off'];

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

function toProfile(row: ProfileRow): FriendProfile {
	return {
		id: row.id,
		email: row.email,
		displayName: row.display_name,
		friendCode: row.friend_code,
		friendsVisibility: row.friends_visibility
	};
}

function getDisplayName(profile: FriendProfile): string {
	return profile.displayName ?? profile.email ?? profile.friendCode;
}

async function getProfilesByIds(supabase: any, ids: string[]): Promise<Map<string, FriendProfile>> {
	if (ids.length === 0) {
		return new Map();
	}

	const uniqueIds = Array.from(new Set(ids));
	const { data, error } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.in('id', uniqueIds);

	if (error) {
		throw new Error(error.message);
	}

	const rows = (data ?? []) as ProfileRow[];
	const result = new Map<string, FriendProfile>();
	rows.forEach((row) => {
		result.set(row.id, toProfile(row));
	});
	return result;
}

export async function ensureProfile(supabase: any, userId: string, email: string | null) {
	const { data, error } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	if (!data) {
		const insertPayload = {
			id: userId,
			email,
			display_name: email
		};

		const { data: inserted, error: insertError } = await supabase
			.from('profiles')
			.insert(insertPayload)
			.select('id,email,display_name,friend_code,friends_visibility')
			.single();

		if (insertError || !inserted) {
			throw new Error(insertError?.message ?? 'Unable to create profile');
		}

		return toProfile(inserted as ProfileRow);
	}

	const existing = data as ProfileRow;
	if (email && existing.email !== email) {
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ email })
			.eq('id', userId);

		if (updateError) {
			throw new Error(updateError.message);
		}

		existing.email = email;
	}

	return toProfile(existing);
}

export async function getFriendsSummary(supabase: any, userId: string): Promise<FriendsSummary> {
	const { data: userData, error: userError } = await supabase.auth.getUser();
	if (userError || !userData.user) {
		throw new Error('Unable to load authenticated user');
	}

	const selfProfile = await ensureProfile(supabase, userId, userData.user.email ?? null);

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
	const profilesById = await getProfilesByIds(supabase, relatedIds);

	const incoming: IncomingFriendRequest[] = [];
	const outgoing: OutgoingFriendRequest[] = [];
	const friends: FriendRecord[] = [];

	for (const row of rows) {
		if (row.status === 'pending' && row.friend_id === userId) {
			const from = profilesById.get(row.user_id);
			if (!from) {
				continue;
			}
			incoming.push({
				id: row.id,
				from,
				createdAt: row.created_at
			});
		}

		if (row.status === 'pending' && row.user_id === userId) {
			const to = profilesById.get(row.friend_id);
			if (!to) {
				continue;
			}
			outgoing.push({
				id: row.id,
				to,
				createdAt: row.created_at
			});
		}

		if (row.status === 'accepted' && row.user_id === userId) {
			const friend = profilesById.get(row.friend_id);
			if (!friend) {
				continue;
			}
			friends.push({
				id: row.id,
				friend,
				visibility: row.visibility,
				createdAt: row.created_at
			});
		}
	}

	incoming.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	outgoing.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	friends.sort((a, b) => getDisplayName(a.friend).localeCompare(getDisplayName(b.friend)));

	return {
		selfProfile,
		incoming,
		outgoing,
		friends
	};
}

async function findProfileByEmail(supabase: any, email: string): Promise<ProfileRow | null> {
	const normalized = email.trim().toLowerCase();
	const { data, error } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.ilike('email', normalized)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return (data as ProfileRow | null) ?? null;
}

async function findProfileByCode(supabase: any, code: string): Promise<ProfileRow | null> {
	const normalized = code.trim().toUpperCase();
	const { data, error } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.eq('friend_code', normalized)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return (data as ProfileRow | null) ?? null;
}

async function existingRelationship(supabase: any, userId: string, otherId: string) {
	const { data, error } = await supabase
		.from('friends')
		.select('id,user_id,friend_id,status,visibility,created_at')
		.or(
			`and(user_id.eq.${userId},friend_id.eq.${otherId}),and(user_id.eq.${otherId},friend_id.eq.${userId})`
		);

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []) as FriendRow[];
}

export async function sendFriendRequestByEmail(supabase: any, userId: string, email: string) {
	const target = await findProfileByEmail(supabase, email);
	if (!target) {
		return {
			ok: false,
			message: 'No user found with that email'
		};
	}

	return sendFriendRequestToUser(supabase, userId, target.id);
}

export async function sendFriendRequestByCode(supabase: any, userId: string, friendCode: string) {
	const target = await findProfileByCode(supabase, friendCode);
	if (!target) {
		return {
			ok: false,
			message: 'No user found with that friend code'
		};
	}

	return sendFriendRequestToUser(supabase, userId, target.id);
}

async function sendFriendRequestToUser(supabase: any, userId: string, targetId: string) {
	if (userId === targetId) {
		return {
			ok: false,
			message: 'You cannot add yourself'
		};
	}

	const existing = await existingRelationship(supabase, userId, targetId);
	if (existing.some((row) => row.status === 'accepted')) {
		return {
			ok: false,
			message: "You're already friends with this user"
		};
	}

	if (existing.some((row) => row.status === 'pending')) {
		return {
			ok: false,
			message: 'A friend request is already pending'
		};
	}

	const { error } = await supabase.from('friends').insert({
		user_id: userId,
		friend_id: targetId,
		status: 'pending',
		visibility: 'full'
	});

	if (error) {
		throw new Error(error.message);
	}

	return {
		ok: true,
		message: 'Friend request sent'
	};
}

export async function acceptFriendRequest(supabase: any, userId: string, requestId: string) {
	const { data, error } = await supabase
		.from('friends')
		.select('id,user_id,friend_id,status,visibility,created_at')
		.eq('id', requestId)
		.eq('friend_id', userId)
		.eq('status', 'pending')
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	if (!data) {
		return {
			ok: false,
			message: 'Friend request not found'
		};
	}

	const request = data as FriendRow;

	const { error: updateError } = await supabase
		.from('friends')
		.update({ status: 'accepted', visibility: 'full' })
		.eq('id', requestId);

	if (updateError) {
		throw new Error(updateError.message);
	}

	const { data: reverseExisting, error: reverseError } = await supabase
		.from('friends')
		.select('id,user_id,friend_id,status,visibility,created_at')
		.eq('user_id', userId)
		.eq('friend_id', request.user_id)
		.maybeSingle();

	if (reverseError) {
		throw new Error(reverseError.message);
	}

	if (reverseExisting) {
		const { error: reverseUpdateError } = await supabase
			.from('friends')
			.update({ status: 'accepted', visibility: 'full' })
			.eq('id', (reverseExisting as FriendRow).id);
		if (reverseUpdateError) {
			throw new Error(reverseUpdateError.message);
		}
	} else {
		const { error: reverseInsertError } = await supabase.from('friends').insert({
			user_id: userId,
			friend_id: request.user_id,
			status: 'accepted',
			visibility: 'full'
		});

		if (reverseInsertError) {
			throw new Error(reverseInsertError.message);
		}
	}

	return {
		ok: true,
		message: 'Friend request accepted'
	};
}

export async function declineFriendRequest(supabase: any, userId: string, requestId: string) {
	const { error } = await supabase
		.from('friends')
		.delete()
		.eq('id', requestId)
		.eq('friend_id', userId)
		.eq('status', 'pending');

	if (error) {
		throw new Error(error.message);
	}

	return {
		ok: true,
		message: 'Friend request declined'
	};
}

export async function cancelOutgoingFriendRequest(
	supabase: any,
	userId: string,
	requestId: string
) {
	const { error } = await supabase
		.from('friends')
		.delete()
		.eq('id', requestId)
		.eq('user_id', userId)
		.eq('status', 'pending');

	if (error) {
		throw new Error(error.message);
	}

	return {
		ok: true,
		message: 'Friend request canceled'
	};
}

export async function removeFriend(supabase: any, userId: string, friendId: string) {
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

	return {
		ok: true,
		message: 'Friend removed'
	};
}

export async function updateFriendVisibility(
	supabase: any,
	userId: string,
	friendId: string,
	visibility: string
) {
	if (!VALID_VISIBILITY.includes(visibility as FriendVisibility)) {
		return {
			ok: false,
			message: 'Invalid visibility value'
		};
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

	return {
		ok: true,
		message: 'Visibility updated'
	};
}

function findScheduleByTermYear(
	schedules: {
		currentSchedule: StoredSchedule;
		nonselectedSchedules: StoredSchedule[];
	},
	term: string | null,
	year: number | null
): StoredSchedule {
	if (!term || !year) {
		return schedules.currentSchedule;
	}

	const matches = [schedules.currentSchedule, ...schedules.nonselectedSchedules];

	const found = matches.find((schedule) => {
		return schedule.term === term && schedule.year === year;
	});

	return found ?? schedules.currentSchedule;
}

export async function getFriendScheduleForViewer(
	supabase: any,
	viewerId: string,
	friendId: string,
	term: string | null,
	year: number | null
) {
	if (viewerId === friendId) {
		return {
			visibility: 'full' as FriendVisibility,
			friendName: 'You',
			schedule: null,
			message: null
		};
	}

	const { data: relationship, error: relationshipError } = await supabase
		.from('friends')
		.select('id,user_id,friend_id,status,visibility,created_at')
		.eq('user_id', friendId)
		.eq('friend_id', viewerId)
		.eq('status', 'accepted')
		.maybeSingle();

	if (relationshipError) {
		throw new Error(relationshipError.message);
	}

	const { data: friendProfileRaw, error: profileError } = await supabase
		.from('profiles')
		.select('id,email,display_name,friend_code,friends_visibility')
		.eq('id', friendId)
		.maybeSingle();

	if (profileError) {
		throw new Error(profileError.message);
	}

	const friendProfile = friendProfileRaw as ProfileRow | null;
	const friendName = friendProfile?.display_name ?? friendProfile?.email ?? 'Friend';

	if (!relationship) {
		return {
			visibility: 'off' as FriendVisibility,
			friendName,
			schedule: null,
			message: 'You can only view accepted friends schedules'
		};
	}

	const relationshipRow = relationship as FriendRow;
	const profileVisibility = friendProfile?.friends_visibility ?? 'full';
	const effectiveVisibility = profileVisibility === 'off' ? 'off' : relationshipRow.visibility;

	if (effectiveVisibility === 'off') {
		return {
			visibility: 'off' as FriendVisibility,
			friendName,
			schedule: null,
			message: 'This friend has schedule sharing turned off'
		};
	}

	const { data: schedulesRaw, error: schedulesError } = await supabase
		.from('user_schedules')
		.select('schedules')
		.eq('user_id', friendId)
		.maybeSingle();

	if (schedulesError) {
		throw new Error(schedulesError.message);
	}

	const schedules = schedulesRaw?.schedules as
		| {
				currentSchedule: StoredSchedule;
				nonselectedSchedules: StoredSchedule[];
		  }
		| undefined;

	if (!schedules) {
		return {
			visibility: effectiveVisibility,
			friendName,
			schedule: null,
			message: 'No schedule available for this friend yet'
		};
	}

	const selectedSchedule = findScheduleByTermYear(schedules, term, year);

	return {
		visibility: effectiveVisibility,
		friendName,
		schedule: selectedSchedule,
		message: null
	};
}
