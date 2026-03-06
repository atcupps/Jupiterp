import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    acceptFriendRequest,
    cancelOutgoingFriendRequest,
    declineFriendRequest,
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

interface ActionPayload {
    action: 'accept' | 'decline' | 'cancel',
}

export const POST: RequestHandler = async ({ request, params }) => {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const payload = await request.json() as ActionPayload;
        const requestId = params.requestId;
        if (!requestId) {
            return json({ ok: false, message: 'Missing request id' }, { status: 400 });
        }

        const supabase = createSupabaseServerClient(accessToken);
        const result = payload.action === 'accept'
            ? await acceptFriendRequest(supabase, userId, requestId)
            : payload.action === 'cancel'
                ? await cancelOutgoingFriendRequest(supabase, userId, requestId)
                : await declineFriendRequest(supabase, userId, requestId);

        return json(result, { status: result.ok ? 200 : 400 });
    } catch (error) {
        console.error('Update friend request error:', error);
        const message = toApiError(
            error instanceof Error ? error.message : 'Unable to update request'
        );
        return json({ ok: false, message }, { status: 500 });
    }
};
