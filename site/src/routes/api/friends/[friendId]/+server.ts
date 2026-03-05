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
        const message = error instanceof Error ? error.message : 'Unable to update friend';
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
        const message = error instanceof Error ? error.message : 'Unable to remove friend';
        return json({ ok: false, message }, { status: 500 });
    }
};
