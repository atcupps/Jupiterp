import { json } from '@sveltejs/kit';
import { getFriendScheduleForViewer } from '$lib/server/friends';
import {
    createSupabaseServerClient,
    requireAuthUser,
} from '$lib/server/supabase';

export async function GET({ request, url }) {
    try {
        const { userId, accessToken } = await requireAuthUser(request);
        const friendId = url.searchParams.get('friendId');
        const term = url.searchParams.get('term');
        const yearRaw = url.searchParams.get('year');
        const year = yearRaw ? Number(yearRaw) : null;

        if (!friendId) {
            return json({
                visibility: 'off',
                friendName: 'Friend',
                schedule: null,
                message: 'Missing friend id',
            }, { status: 400 });
        }

        const supabase = createSupabaseServerClient(accessToken);
        const result = await getFriendScheduleForViewer(
            supabase,
            userId,
            friendId,
            term,
            Number.isInteger(year) ? year : null,
        );

        return json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load friend schedule';
        return json({
            visibility: 'off',
            friendName: 'Friend',
            schedule: null,
            message,
        }, { status: 401 });
    }
}
