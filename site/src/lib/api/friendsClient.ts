import type { FriendScheduleResponse, FriendsSummary, FriendVisibility } from '$lib/friends/types';

interface MutationResult {
	ok: boolean;
	message: string;
}

interface ViewerOptionsResponse {
	selfName: string;
	friends: Array<{
		id: string;
		label: string;
	}>;
}

interface SendFriendRequestInput {
	mode: 'email' | 'code';
	value: string;
}

interface UpdateFriendRequestInput {
	requestId: string;
	action: 'accept' | 'decline' | 'cancel';
}

interface UpdateFriendVisibilityInput {
	friendId: string;
	visibility: FriendVisibility;
}

interface GetFriendScheduleInput {
	friendId: string;
	term?: string;
	year?: number;
}

interface ApiErrorShape {
	error?: string;
	message?: string;
}

function authHeaders(accessToken: string): HeadersInit {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${accessToken}`
	};
}

async function parseApiError(response: Response, fallback: string): Promise<string> {
	try {
		const payload = (await response.json()) as ApiErrorShape;
		if (typeof payload.error === 'string' && payload.error.length > 0) {
			return payload.error;
		}
		if (typeof payload.message === 'string' && payload.message.length > 0) {
			return payload.message;
		}
	} catch {
		// Ignore JSON parse errors and use fallback message.
	}

	return fallback;
}

async function requestJson<T>(
	url: string,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	accessToken: string,
	body?: Record<string, unknown>
): Promise<T> {
	const response = await fetch(url, {
		method,
		headers: authHeaders(accessToken),
		body: body ? JSON.stringify(body) : undefined
	});

	if (!response.ok) {
		const message = await parseApiError(
			response,
			`Friends API request failed (HTTP ${response.status})`
		);
		throw new Error(message);
	}

	return response.json() as Promise<T>;
}

export async function getFriendsSummary(accessToken: string): Promise<FriendsSummary> {
	return requestJson<FriendsSummary>('/api/friends/summary', 'GET', accessToken);
}

export async function getViewerOptions(accessToken: string): Promise<ViewerOptionsResponse> {
	return requestJson<ViewerOptionsResponse>('/api/friends/view-options', 'GET', accessToken);
}

export async function getFriendSchedule(
	accessToken: string,
	input: GetFriendScheduleInput
): Promise<FriendScheduleResponse> {
	const query = new URLSearchParams();
	query.set('friendId', input.friendId);
	if (input.term) {
		query.set('term', input.term);
	}
	if (typeof input.year === 'number') {
		query.set('year', input.year.toString());
	}

	return requestJson<FriendScheduleResponse>(
		`/api/friends/schedule?${query.toString()}`,
		'GET',
		accessToken
	);
}

export async function sendFriendRequest(
	accessToken: string,
	input: SendFriendRequestInput
): Promise<MutationResult> {
	return requestJson<MutationResult>('/api/friends/requests', 'POST', accessToken, {
		mode: input.mode,
		value: input.value.trim()
	});
}

export async function updateFriendRequest(
	accessToken: string,
	input: UpdateFriendRequestInput
): Promise<MutationResult> {
	return requestJson<MutationResult>(
		`/api/friends/requests/${encodeURIComponent(input.requestId)}`,
		'POST',
		accessToken,
		{
			action: input.action
		}
	);
}

export async function removeFriend(accessToken: string, friendId: string): Promise<MutationResult> {
	return requestJson<MutationResult>(
		`/api/friends/${encodeURIComponent(friendId)}`,
		'DELETE',
		accessToken
	);
}

export async function updateFriendVisibility(
	accessToken: string,
	input: UpdateFriendVisibilityInput
): Promise<MutationResult> {
	return requestJson<MutationResult>(
		`/api/friends/${encodeURIComponent(input.friendId)}`,
		'PATCH',
		accessToken,
		{
			visibility: input.visibility
		}
	);
}

export async function updateDefaultVisibility(
	accessToken: string,
	visibility: FriendVisibility
): Promise<MutationResult> {
	return requestJson<MutationResult>('/api/friends/profile/visibility', 'POST', accessToken, {
		visibility
	});
}
