/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import type { PageLoad } from "./$types";
import { computeGenEdProgress } from "$lib/gened/progress";
import { GEN_ED_REQUIREMENTS } from "$lib/gened/requirements";
import { fetchUserCoursesForGenEd } from "$lib/gened/userCourses";
import { getAuthUser, isSupabaseConfigured } from "$lib/supabase";

export const ssr = false;

export const load: PageLoad = async () => {
    if (!isSupabaseConfigured()) {
        return {
            genEdProgress: computeGenEdProgress(GEN_ED_REQUIREMENTS, []),
            genEdLoadError: null as string | null,
        };
    }

    try {
        const user = await getAuthUser();
        if (!user) {
            return {
                genEdProgress: computeGenEdProgress(GEN_ED_REQUIREMENTS, []),
                genEdLoadError: null as string | null,
            };
        }

        const userCourses = await fetchUserCoursesForGenEd(user.id);
        return {
            genEdProgress: computeGenEdProgress(GEN_ED_REQUIREMENTS, userCourses),
            genEdLoadError: null as string | null,
        };
    } catch (error) {
        console.error("Unable to load Gen Ed progress:", error);
        return {
            genEdProgress: computeGenEdProgress(GEN_ED_REQUIREMENTS, []),
            genEdLoadError: "Could not load Gen Ed progress right now.",
        };
    }
};
