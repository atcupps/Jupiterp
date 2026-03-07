/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import type { PageLoad } from "./$types";
import { computeGenEdProgress } from "$lib/gened/progress";
import { GEN_ED_REQUIREMENTS } from "$lib/gened/requirements";
import {
    chooseSchedulesForProfile,
    readSchedulesFromLocalStorage,
    schedulesToUserCourses,
} from "$lib/gened/schedules";
import { getAuthUser, isSupabaseConfigured, loadUserSchedules } from "$lib/supabase";
import type { StoredSchedule } from "../../types";

export const ssr = false;

export const load: PageLoad = async () => {
    try {
        const localSchedules = readSchedulesFromLocalStorage();
        let userId = "local";
        let cloudSchedules: {
            currentSchedule: StoredSchedule,
            nonselectedSchedules: StoredSchedule[],
        } | null = null;

        if (isSupabaseConfigured()) {
            const user = await getAuthUser();
            if (user) {
                userId = user.id;
                cloudSchedules = await loadUserSchedules(user.id);
            }
        }

        const schedules = chooseSchedulesForProfile(cloudSchedules, localSchedules);
        const userCourses = schedulesToUserCourses(schedules, undefined, userId);

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
