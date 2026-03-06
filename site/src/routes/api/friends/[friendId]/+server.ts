import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    removeFriend,
    updateFriendVisibility,
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

interface PatchPayload {
    visibility: 'full' | 'busy_free' | 'off',
}

export const PATCH: RequestHandler = async ({ request, params }) => {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const friendId = params.friendId;
        const payload = await request.json() as PatchPayload;
        if (!friendId) {
            return json({ ok: false, message: 'Missing friend id' }, { status: 400 });
        }

        const supabase = createSupabaseServerClient(accessToken);
        const result = await updateFriendVisibility(
            supabase,
            userId,
            friendId,
            payload.visibility,
        );

        return json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
        console.error('Update friend visibility error:', error);
        const message = toApiError(
            error instanceof Error ? error.message : 'Unable to update friend'
        );
        return json({ ok: false, message }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const friendId = params.friendId;
        if (!friendId) {
            return json({ ok: false, message: 'Missing friend id' }, { status: 400 });
        }

        const supabase = createSupabaseServerClient(accessToken);
        const result = await removeFriend(supabase, userId, friendId);
        return json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
        console.error('Remove friend error:', error);
        const message = toApiError(
            error instanceof Error ? error.message : 'Unable to remove friend'
        );
        return json({ ok: false, message }, { status: 500 });
    }
};
