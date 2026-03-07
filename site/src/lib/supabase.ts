/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Supabase auth and schedule persistence helpers.
 */

import { createClient, type User } from "@supabase/supabase-js";
import {
    PUBLIC_SUPABASE_ANON_KEY,
    PUBLIC_SUPABASE_URL,
} from "$env/static/public";
import type { StoredSchedule } from "../types";
import type { FriendVisibility } from "$lib/friends/types";
import {
    DEFAULT_PROFILE_PRIVACY,
    DEFAULT_DEGREE_TYPE,
    type EditableProfileFields,
    type DegreeType,
    type ProfilePrivacyLevel,
    type ProfilePreferences,
} from "$lib/profile/types";

interface UserScheduleRow {
    user_id: string,
    schedules: {
        currentSchedule: StoredSchedule,
        nonselectedSchedules: StoredSchedule[],
    }
}

export interface UserProfileRow {
    id: string,
    email: string | null,
    display_name: string | null,
    friend_code: string,
    friends_visibility: FriendVisibility,
    degree_type: DegreeType,
    majors: string[] | null,
    minors: string[] | null,
    graduation_year: number | null,
    profile_privacy: ProfilePrivacyLevel,
}

let initialized = false;
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseUrl(): string {
    return PUBLIC_SUPABASE_URL ?? "";
}

function getSupabaseAnonKey(): string {
    return PUBLIC_SUPABASE_ANON_KEY ?? "";
}

function initSupabase() {
    if (initialized) {
        return;
    }

    initialized = true;

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    if (supabaseUrl.trim().length === 0 || supabaseAnonKey.trim().length === 0) {
        return;
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
    initSupabase();
    return supabaseClient !== null;
}

function requireSupabase() {
    initSupabase();
    if (!supabaseClient) {
        throw new Error("Supabase is not configured");
    }

    return supabaseClient;
}

export function getSupabaseClient() {
    return requireSupabase();
}

export async function getAuthUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error("Failed to get auth user:", error.message);
        return null;
    }

    return data.user;
}

export async function getAccessToken(): Promise<string | null> {
    if (!isSupabaseConfigured()) {
        return null;
    }

    function decodeJwtExpiry(accessToken: string): number | null {
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            return null;
        }

        try {
            const payload = JSON.parse(atob(parts[1])) as { exp?: number };
            if (typeof payload.exp !== 'number') {
                return null;
            }
            return payload.exp;
        } catch (_error) {
            return null;
        }
    }

    function shouldRefreshToken(accessToken: string): boolean {
        const exp = decodeJwtExpiry(accessToken);
        if (!exp) {
            return false;
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        const refreshWindowSeconds = 120;
        return exp <= (nowSeconds + refreshWindowSeconds);
    }

    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Failed to get auth session:", error.message);
    }

    const currentAccessToken = data.session?.access_token;
    if (currentAccessToken && !shouldRefreshToken(currentAccessToken)) {
        return currentAccessToken;
    }

    const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
    if (refreshError) {
        console.error("Failed to refresh auth session:", refreshError.message);
        return null;
    }

    return refreshed.session?.access_token ?? null;
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
    if (!isSupabaseConfigured()) {
        callback(null);
        return () => undefined;
    }

    const supabase = requireSupabase();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });

    return () => {
        data.subscription.unsubscribe();
    };
}

export async function signInWithGoogle(redirectTo: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo,
        },
    });

    if (error) {
        throw new Error(error.message);
    }
}

export async function signInWithApple(redirectTo: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
            redirectTo,
        },
    });

    if (error) {
        throw new Error(error.message);
    }
}

export async function signInWithEmail(
                        email: string,
                        redirectTo: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: redirectTo,
        },
    });

    if (error) {
        throw new Error(error.message);
    }
}

export async function signOutUser(): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw new Error(error.message);
    }
}

export async function loadUserSchedules(
                        userId: string): Promise<{
                            currentSchedule: StoredSchedule,
                            nonselectedSchedules: StoredSchedule[],
                        } | null> {
    const supabase = requireSupabase() as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                eq: (column: string, value: string) => {
                    maybeSingle: <T>() => Promise<{
                        data: T | null,
                        error: { message: string } | null,
                    }>
                }
            }
        }
    };

    const { data, error } = await supabase
        .from("user_schedules")
        .select("user_id,schedules")
        .eq("user_id", userId)
        .maybeSingle<UserScheduleRow>();

    if (error) {
        throw new Error(error.message);
    }

    if (!data || !data.schedules) {
        return null;
    }

    return data.schedules;
}

export async function saveUserSchedules(
                        userId: string,
                        schedules: {
                            currentSchedule: StoredSchedule,
                            nonselectedSchedules: StoredSchedule[],
                        }): Promise<void> {
    const supabase = requireSupabase() as unknown as {
        from: (table: string) => {
            upsert: (
                values: Record<string, unknown>,
                options: { onConflict: string }
            ) => Promise<{ error: { message: string } | null }>
        }
    };

    const { error } = await supabase
        .from("user_schedules")
        .upsert({
            user_id: userId,
            schedules,
        }, {
            onConflict: "user_id",
        });

    if (error) {
        throw new Error(error.message);
    }
}

export async function ensureUserProfile(): Promise<UserProfileRow | null> {
    const user = await getAuthUser();
    if (!user) {
        return null;
    }

    const supabase = requireSupabase() as unknown as {
        from: (table: string) => {
            select: (query: string) => {
                eq: (column: string, value: string) => {
                    maybeSingle: <T>() => Promise<{
                        data: T | null,
                        error: { message: string } | null,
                    }>
                }
            },
            insert: (values: Record<string, unknown>) => {
                select: (query: string) => {
                    single: <T>() => Promise<{
                        data: T | null,
                        error: { message: string } | null,
                    }>
                }
            },
            update: (values: Record<string, unknown>) => {
                eq: (column: string, value: string) => Promise<{
                    error: { message: string } | null,
                }>
            },
        }
    };

    const { data, error } = await supabase
        .from("profiles")
        .select("id,email,display_name,friend_code,friends_visibility,degree_type,majors,minors,graduation_year,profile_privacy")
        .eq("id", user.id)
        .maybeSingle<UserProfileRow>();

    if (error) {
        throw new Error(error.message);
    }

    if (data) {
        return data;
    }

    const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({
            id: user.id,
            email: user.email ?? null,
            display_name: user.email ?? null,
            degree_type: DEFAULT_DEGREE_TYPE,
            majors: [],
            minors: [],
            profile_privacy: DEFAULT_PROFILE_PRIVACY,
        })
        .select("id,email,display_name,friend_code,friends_visibility,degree_type,majors,minors,graduation_year,profile_privacy")
        .single<UserProfileRow>();

    if (insertError) {
        throw new Error(insertError.message);
    }

    return inserted;
}

export async function updateFriendsVisibility(
    value: FriendVisibility,
): Promise<void> {
    const user = await getAuthUser();
    if (!user) {
        throw new Error("Sign in required");
    }

    const supabase = requireSupabase() as unknown as {
        from: (table: string) => {
            update: (values: Record<string, unknown>) => {
                eq: (column: string, value: string) => Promise<{
                    error: { message: string } | null,
                }>
            },
        }
    };

    const { error } = await supabase
        .from("profiles")
        .update({ friends_visibility: value })
        .eq("id", user.id);

    if (error) {
        throw new Error(error.message);
    }
}

export async function getProfilePreferences(): Promise<ProfilePreferences | null> {
    const profile = await ensureUserProfile();
    if (!profile) {
        return null;
    }

    return {
        degreeType: profile.degree_type ?? DEFAULT_DEGREE_TYPE,
        majors: profile.majors ?? [],
        minors: profile.minors ?? [],
        graduationYear: profile.graduation_year ?? null,
    };
}

export async function getEditableProfile(): Promise<EditableProfileFields | null> {
    const profile = await ensureUserProfile();
    if (!profile) {
        return null;
    }

    return {
        displayName: profile.display_name ?? "",
        degreeType: profile.degree_type ?? DEFAULT_DEGREE_TYPE,
        majors: profile.majors ?? [],
        minors: profile.minors ?? [],
        graduationYear: profile.graduation_year ?? null,
        profilePrivacy: profile.profile_privacy ?? DEFAULT_PROFILE_PRIVACY,
    };
}

export async function updateProfilePreferences(
    preferences: ProfilePreferences
): Promise<void> {
    const user = await getAuthUser();
    if (!user) {
        throw new Error("Sign in required");
    }

    const supabase = requireSupabase() as unknown as {
        from: (table: string) => {
            update: (values: Record<string, unknown>) => {
                eq: (column: string, value: string) => Promise<{
                    error: { message: string } | null,
                }>
            },
        }
    };

    const { error } = await supabase
        .from("profiles")
        .update({
            degree_type: preferences.degreeType,
            majors: preferences.majors,
            minors: preferences.minors,
            graduation_year: preferences.graduationYear,
        })
        .eq("id", user.id);

    if (error) {
        throw new Error(error.message);
    }
}

export async function updateEditableProfile(
    updates: Partial<EditableProfileFields>
): Promise<void> {
    const user = await getAuthUser();
    if (!user) {
        throw new Error("Sign in required");
    }

    const payload: Record<string, unknown> = {};
    if (typeof updates.displayName === "string") {
        payload.display_name = updates.displayName;
    }
    if (updates.degreeType) {
        payload.degree_type = updates.degreeType;
    }
    if (updates.majors) {
        payload.majors = updates.majors;
    }
    if (updates.minors) {
        payload.minors = updates.minors;
    }
    if (updates.graduationYear !== undefined) {
        payload.graduation_year = updates.graduationYear;
    }
    if (updates.profilePrivacy) {
        payload.profile_privacy = updates.profilePrivacy;
    }

    if (Object.keys(payload).length === 0) {
        return;
    }

    const supabase = requireSupabase() as unknown as {
        from: (table: string) => {
            update: (values: Record<string, unknown>) => {
                eq: (column: string, value: string) => Promise<{
                    error: { message: string } | null,
                }>
            },
        }
    };

    const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

    if (error) {
        throw new Error(error.message);
    }
}
