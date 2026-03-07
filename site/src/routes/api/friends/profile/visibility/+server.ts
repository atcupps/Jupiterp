import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { FriendVisibility } from '$lib/friends/types';
import {
    createSupabaseServerClient,
    requireAuthUser,
} from '$lib/server/supabase';

interface VisibilityPayload {
    visibility: FriendVisibility,
}

const VALID_VISIBILITY: FriendVisibility[] = ['full', 'busy_free', 'off'];

function toApiError(message: string): string {
    const normalized = message.toLowerCase();
    if (
        normalized.includes('schema cache')
        || normalized.includes('could not find the table')
        || normalized.includes('relation')
    ) {
        return 'Friends database is not initialized yet.';
    }

    return message;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const payload = await request.json() as VisibilityPayload;

        if (!VALID_VISIBILITY.includes(payload.visibility)) {
            return json(
                { ok: false, message: 'Invalid visibility value' },
                { status: 400 },
            );
        }

        const supabase = createSupabaseServerClient(accessToken);
        const { error } = await supabase
            .from('profiles')
            .update({ friends_visibility: payload.visibility })
            .eq('id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return json({ ok: true, message: 'Default visibility updated' });
    } catch (error) {
        console.error('Update default visibility error:', error);
        const message = toApiError(
            error instanceof Error
                ? error.message
                : 'Unable to update default visibility',
        );

        return json({ ok: false, message }, { status: 500 });
    }
};
