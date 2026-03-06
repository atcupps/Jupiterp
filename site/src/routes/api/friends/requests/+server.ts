import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    sendFriendRequestByCode,
    sendFriendRequestByEmail,
} from '$lib/server/friends';
import {
    createSupabaseServerClient,
    requireAuthUser,
} from '$lib/server/supabase';

function toApiError(message: string): string {
    const normalized = message.toLowerCase();
    if (
        normalized.includes('schema cache') ||
        normalized.includes('could not find the table') ||
        normalized.includes('relation')
    ) {
        return 'Friends database is not initialized yet.';
    }

    return message;
}

interface RequestPayload {
    mode: 'email' | 'code',
    value: string,
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const payload = await request.json() as RequestPayload;

        if (!payload.value || payload.value.trim().length === 0) {
            return json({ ok: false, message: 'Enter a value first' }, { status: 400 });
        }

        const supabase = createSupabaseServerClient(accessToken);
        const result = payload.mode === 'code'
            ? await sendFriendRequestByCode(supabase, userId, payload.value)
            : await sendFriendRequestByEmail(supabase, userId, payload.value);

        return json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
        console.error('Send friend request error:', error);
        const message = toApiError(
            error instanceof Error ? error.message : 'Unable to send request'
        );
        return json({ ok: false, message }, { status: 500 });
    }
};
