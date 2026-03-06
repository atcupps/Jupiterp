import type {
    FriendScheduleResponse,
    FriendsSummary,
    FriendVisibility,
} from '$lib/friends/types';

interface ApiEnvelope<T> {
    success: boolean,
    data?: T,
    error?: string,
}

interface MutationResult {
    ok: boolean,
    message: string,
}

interface ViewerOptionsResponse {
    selfName: string,
    friends: Array<{
        id: string,
        label: string,
    }>,
}

interface SendFriendRequestInput {
    mode: 'email' | 'code',
    value: string,
}

interface UpdateFriendRequestInput {
    requestId: string,
    action: 'accept' | 'decline' | 'cancel',
}

interface UpdateFriendVisibilityInput {
    friendId: string,
    visibility: FriendVisibility,
}

interface GetFriendScheduleInput {
    friendId: string,
    term?: string,
    year?: number,
}

function getFunctionBaseUrl(): string {
    const value = (
        import.meta.env.PUBLIC_SUPABASE_FUNCTION_FRIENDS_URL
            ?? 'https://zjhuagbdwgsipprsqxpq.supabase.co/functions/v1/friends'
    ) as string;
    return value.trim();
}

function requireFunctionBaseUrl(): string {
    const url = getFunctionBaseUrl();
    if (url.length === 0) {
        throw new Error('Friends API URL is not configured. Set PUBLIC_SUPABASE_FUNCTION_FRIENDS_URL.');
    }
    return url;
}

function normalizePath(base: string, path: string): string {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}

async function parseJsonResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
    let payload: unknown;

    try {
        payload = await response.json();
    } catch (_error) {
        return {
            success: false,
            error: 'Invalid JSON response from server',
        };
    }

    if (typeof payload !== 'object' || payload === null) {
        return {
            success: false,
            error: 'Malformed response from server',
        };
    }

    return payload as ApiEnvelope<T>;
}

async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    accessToken: string,
    body?: Record<string, unknown>,
): Promise<T> {
    const baseUrl = requireFunctionBaseUrl();
    const url = normalizePath(baseUrl, path);

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const envelope = await parseJsonResponse<T>(response);
    if (!response.ok || !envelope.success || envelope.data === undefined) {
        throw new Error(envelope.error ?? 'Friends API request failed');
    }

    return envelope.data;
}

async function mutate(
    path: string,
    accessToken: string,
    body?: Record<string, unknown>,
): Promise<MutationResult> {
    const baseUrl = requireFunctionBaseUrl();
    const url = normalizePath(baseUrl, path);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body ?? {}),
    });

    const envelope = await parseJsonResponse<MutationResult>(response);
    if (!response.ok || !envelope.success || envelope.data === undefined) {
        throw new Error(envelope.error ?? 'Friends API request failed');
    }

    return envelope.data;
}

export async function getFriendsSummary(
    accessToken: string,
): Promise<FriendsSummary> {
    return request<FriendsSummary>('GET', '/summary', accessToken);
}

export async function getViewerOptions(
    accessToken: string,
): Promise<ViewerOptionsResponse> {
    return request<ViewerOptionsResponse>('GET', '/view-options', accessToken);
}

export async function getFriendSchedule(
    accessToken: string,
    input: GetFriendScheduleInput,
): Promise<FriendScheduleResponse> {
    const query = new URLSearchParams();
    query.set('friendId', input.friendId);
    if (input.term) {
        query.set('term', input.term);
    }
    if (typeof input.year === 'number') {
        query.set('year', input.year.toString());
    }

    return request<FriendScheduleResponse>(
        'GET',
        `/schedule?${query.toString()}`,
        accessToken,
    );
}

export async function sendFriendRequest(
    accessToken: string,
    input: SendFriendRequestInput,
): Promise<MutationResult> {
    return mutate('/requests', accessToken, {
        mode: input.mode,
        value: input.value,
    });
}

export async function updateFriendRequest(
    accessToken: string,
    input: UpdateFriendRequestInput,
): Promise<MutationResult> {
    return mutate(`/requests/${encodeURIComponent(input.requestId)}`, accessToken, {
        action: input.action,
    });
}

export async function removeFriend(
    accessToken: string,
    friendId: string,
): Promise<MutationResult> {
    return mutate(`/friend/${encodeURIComponent(friendId)}/remove`, accessToken);
}

export async function updateFriendVisibility(
    accessToken: string,
    input: UpdateFriendVisibilityInput,
): Promise<MutationResult> {
    return mutate(`/friend/${encodeURIComponent(input.friendId)}/visibility`, accessToken, {
        visibility: input.visibility,
    });
}

export async function updateDefaultVisibility(
    accessToken: string,
    visibility: FriendVisibility,
): Promise<MutationResult> {
    return mutate('/profile/visibility', accessToken, {
        visibility,
    });
}
