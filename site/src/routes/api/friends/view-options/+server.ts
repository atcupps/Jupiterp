import { json } from '@sveltejs/kit';
import { getFriendsSummary } from '$lib/server/friends';
import {
    createSupabaseServerClient,
    requireAuthUser,
} from '$lib/server/supabase';

export async function GET({ request }) {
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
        const message = error instanceof Error ? error.message : 'Unauthorized';
        return json({ error: message }, { status: 401 });
    }
}
