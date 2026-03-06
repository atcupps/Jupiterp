import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFriendsSummary } from '$lib/server/friends';
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

export const GET: RequestHandler = async ({ request }) => {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const supabase = createSupabaseServerClient(accessToken);
        const summary = await getFriendsSummary(supabase, userId);

        return json({
            selfName: summary.selfProfile.displayName
                ?? summary.selfProfile.email
                ?? 'You',
            friends: summary.friends.map((friend) => {
                return {
                    id: friend.friend.id,
                    label: friend.friend.displayName
                        ?? friend.friend.email
                        ?? friend.friend.friendCode,
                };
            }),
        });
    } catch (error) {
        console.error('Friends viewer options error:', error);
        const message = toApiError(error instanceof Error ? error.message : 'Unauthorized');
        return json({ error: message }, { status: 401 });
    }
};
