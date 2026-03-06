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

interface LegacyEnvelope {
    success?: boolean,
    error?: string,
    message?: string,
    data?: unknown,
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

function getSupabaseAnonKey(): string {
    const value = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    return (value ?? '').trim();
}

function requireFunctionBaseUrl(): string {
    const url = getFunctionBaseUrl();
    if (url.length === 0) {
        throw new Error('Friends API URL is not configured. Set PUBLIC_SUPABASE_FUNCTION_FRIENDS_URL.');
    }
    return url;
}

function requireSupabaseAnonKey(): string {
    const anonKey = getSupabaseAnonKey();
    if (anonKey.length === 0) {
        throw new Error('Supabase anon key is not configured. Set PUBLIC_SUPABASE_ANON_KEY.');
    }
    return anonKey;
}

function normalizePath(base: string, path: string): string {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}

function logFriendsRequestHeaders(method: 'GET' | 'POST', url: string, headers: Record<string, string>): void {
    if (!import.meta.env.DEV) {
        return;
    }

    const hasAuthorization = typeof headers.Authorization === 'string' && headers.Authorization.startsWith('Bearer ');
    const hasApiKey = typeof headers.apikey === 'string' && headers.apikey.length > 0;
    console.debug('[friends-api] request headers', {
        method,
        url,
        hasAuthorization,
        hasApiKey,
    });
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

function extractErrorMessage(payload: LegacyEnvelope | null, fallback: string): string {
    if (!payload) {
        return fallback;
    }

    if (typeof payload.error === 'string' && payload.error.length > 0) {
        return payload.error;
    }

    if (typeof payload.message === 'string' && payload.message.length > 0) {
        return payload.message;
    }

    const normalized = fallback.toLowerCase();
    if (normalized.includes('invalid jwt') || normalized.includes('jwt')) {
        return 'Session expired. Please sign out and sign back in.';
    }

    return fallback;
}

async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    accessToken: string,
    body?: Record<string, unknown>,
): Promise<T> {
    const baseUrl = requireFunctionBaseUrl();
    const anonKey = requireSupabaseAnonKey();
    const url = normalizePath(baseUrl, path);
    const headers = {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
    };

    logFriendsRequestHeaders(method, url, headers);

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const envelope = await parseJsonResponse<T>(response);
    if (!response.ok || !envelope.success || envelope.data === undefined) {
        throw new Error(extractErrorMessage(
            envelope as LegacyEnvelope,
            `Friends API request failed (HTTP ${response.status})`
        ));
    }

    return envelope.data;
}

async function mutate(
    path: string,
    accessToken: string,
    body?: Record<string, unknown>,
): Promise<MutationResult> {
    const baseUrl = requireFunctionBaseUrl();
    const anonKey = requireSupabaseAnonKey();
    const url = normalizePath(baseUrl, path);
    const headers = {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
    };

    logFriendsRequestHeaders('POST', url, headers);

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body ?? {}),
    });

    const envelope = await parseJsonResponse<MutationResult>(response) as LegacyEnvelope;
    if (!response.ok || envelope.success !== true) {
        throw new Error(extractErrorMessage(
            envelope,
            `Friends API request failed (HTTP ${response.status})`
        ));
    }

    if (envelope.data && typeof envelope.data === 'object' && 'message' in (envelope.data as Record<string, unknown>)) {
        const msg = (envelope.data as Record<string, unknown>).message;
        if (typeof msg === 'string') {
            return {
                ok: true,
                message: msg,
            };
        }
    }

    if (typeof envelope.message === 'string' && envelope.message.length > 0) {
        return {
            ok: true,
            message: envelope.message,
        };
    }

    return {
        ok: true,
        message: 'Request completed',
    };
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
    const trimmed = input.value.trim();

    // Use root endpoint for maximum compatibility with Supabase edge function
    // deployments that do not route nested subpaths.
    return mutate('/', accessToken, input.mode === 'email'
        ? {
            mode: 'email',
            email: trimmed,
        }
        : {
            mode: 'code',
            code: trimmed,
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
