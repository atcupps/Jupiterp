import { base } from '$app/paths';
import type { PageLoad } from './$types';
import { getAccessToken } from '$lib/supabase';
import type { FriendsSummary } from '$lib/friends/types';

export const ssr = false;

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
                initialError: payload.error ?? 'Unable to load friends',
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
            initialError: error instanceof Error
                ? error.message
                : 'Unable to load friends',
        };
    }
};
