import { base } from '$app/paths';
import type { PageLoad } from './$types';
import { getAccessToken } from '$lib/supabase';
import type { FriendsSummary } from '$lib/friends/types';

export const ssr = false;

function toUserFriendlyFriendsError(message: string): string {
    const normalized = message.toLowerCase();
    if (
        normalized.includes("schema cache") ||
        normalized.includes("could not find the table") ||
        normalized.includes("relation")
    ) {
        return 'Friends database is not initialized yet. Run the Supabase migration for the Friends feature.';
    }

    return message;
}

export const load: PageLoad = async ({ fetch }) => {
    const token = await getAccessToken();
    if (!token) {
        return {
            initialSummary: null,
            initialError: 'Sign in to use Friends',
        };
    }

    try {
        const response = await fetch(`${base}/api/friends/summary`, {
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const payload = await response.json() as { error?: string };
            return {
                initialSummary: null,
                initialError: toUserFriendlyFriendsError(
                    payload.error ?? 'Unable to load friends'
                ),
            };
        }

        const summary = await response.json() as FriendsSummary;
        return {
            initialSummary: summary,
            initialError: null,
        };
    } catch (error) {
        return {
            initialSummary: null,
            initialError: toUserFriendlyFriendsError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load friends'
            ),
        };
    }
};
