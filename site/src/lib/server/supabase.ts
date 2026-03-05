import { createClient } from '@supabase/supabase-js';
import {
    PUBLIC_SUPABASE_ANON_KEY,
    PUBLIC_SUPABASE_URL,
} from '$env/static/public';

export function createSupabaseServerClient(accessToken: string) {
    if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase is not configured');
    }

    return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export function getAccessTokenFromRequest(request: Request): string | null {
    const auth = request.headers.get('authorization') ?? '';
    if (!auth.toLowerCase().startsWith('bearer ')) {
        return null;
    }

    const token = auth.slice(7).trim();
    return token.length > 0 ? token : null;
}

export async function requireAuthUser(request: Request): Promise<{
    userId: string,
    accessToken: string,
}> {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
        throw new Error('Missing authorization token');
    }

    const supabase = createSupabaseServerClient(accessToken);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        throw new Error('Invalid or expired session');
    }

    return {
        userId: data.user.id,
        accessToken,
    };
}
