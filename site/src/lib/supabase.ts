/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Supabase auth and schedule persistence helpers.
 */

import { createClient, type User } from "@supabase/supabase-js";
import { env } from "$env/dynamic/public";
import type { StoredSchedule } from "../types";

interface UserScheduleRow {
    user_id: string,
    schedules: {
        currentSchedule: StoredSchedule,
        nonselectedSchedules: StoredSchedule[],
    }
}

let initialized = false;
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseUrl(): string {
    return env.PUBLIC_SUPABASE_URL ?? "";
}

function getSupabaseAnonKey(): string {
    return env.PUBLIC_SUPABASE_ANON_KEY ?? "";
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
