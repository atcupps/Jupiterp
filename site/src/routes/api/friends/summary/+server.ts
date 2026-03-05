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
        return json(summary);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unauthorized';
        return json({ error: message }, { status: 401 });
    }
}
