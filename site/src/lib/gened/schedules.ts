/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import type { UserCourse } from "$lib/gened/userCourses";
import { compareTermCodes } from "$lib/gened/progress";
import {
    getDefaultTermYear,
    isAcademicTerm,
    normalizeStoredSchedule,
    type AcademicTerm,
    type TermYear,
} from "$lib/course-planner/Terms";
import {
    resolveSelections,
    resolveStoredSchedules,
} from "$lib/course-planner/CourseLoad";
import type { StoredSchedule } from "../../types";

const TERM_SUFFIX: Record<AcademicTerm, string> = {
    Winter: "WI",
    Spring: "SP",
    Summer: "SU",
    Fall: "FA",
};

export function termYearToCode(term: AcademicTerm, year: number): string {
    return `${year}${TERM_SUFFIX[term]}`;
}

function normalizeCloudSchedules(
    cloudValue: {
        currentSchedule: StoredSchedule,
        nonselectedSchedules: StoredSchedule[],
    }
): StoredSchedule[] {
    const fallback = getDefaultTermYear();
    const current = normalizeStoredSchedule(cloudValue.currentSchedule, fallback);
    const nonselected = cloudValue.nonselectedSchedules.map((schedule) => {
        return normalizeStoredSchedule(schedule, fallback);
    });

    return [current, ...nonselected];
}

export function readSchedulesFromLocalStorage(): StoredSchedule[] {
    if (typeof localStorage === "undefined") {
        return [];
    }

    const defaultTermYear = getDefaultTermYear();
    const selectedRaw = localStorage.getItem("selectedSections");
    const scheduleName = localStorage.getItem("scheduleName") ?? "Schedule";
    const scheduleTermRaw = localStorage.getItem("scheduleTerm");
    const scheduleTerm = isAcademicTerm(scheduleTermRaw)
        ? scheduleTermRaw
        : defaultTermYear.term;
    const scheduleYear = Number(localStorage.getItem("scheduleYear") ?? defaultTermYear.year);

    const currentSchedule = normalizeStoredSchedule({
        scheduleName,
        selections: selectedRaw ? resolveSelections(selectedRaw) : [],
        term: scheduleTerm,
        year: scheduleYear,
    }, defaultTermYear);

    const nonselectedRaw = localStorage.getItem("nonselectedSchedules");
    const nonselected = nonselectedRaw
        ? resolveStoredSchedules(nonselectedRaw)
        : [];

    return [currentSchedule, ...nonselected];
}

export function chooseSchedulesForProfile(
    cloudValue: {
        currentSchedule: StoredSchedule,
        nonselectedSchedules: StoredSchedule[],
    } | null,
    localSchedules: StoredSchedule[]
): StoredSchedule[] {
    if (cloudValue) {
        return normalizeCloudSchedules(cloudValue);
    }

    return localSchedules;
}

export function schedulesToUserCourses(
    schedules: StoredSchedule[],
    nowTermYear: TermYear = getDefaultTermYear(),
    userId = "local"
): UserCourse[] {
    const nowCode = termYearToCode(nowTermYear.term, nowTermYear.year);
    const dedupe = new Set<string>();
    const result: UserCourse[] = [];

    for (const schedule of schedules) {
        const termCode = termYearToCode(schedule.term, schedule.year);
        const isCompleted = compareTermCodes(termCode, nowCode) <= 0;

        for (const selection of schedule.selections) {
            const courseId = selection.course.courseCode;
            const key = `${courseId}|${termCode}`;
            if (dedupe.has(key)) {
                continue;
            }
            dedupe.add(key);

            result.push({
                id: key,
                user_id: userId,
                course_id: courseId,
                course_title: selection.course.name,
                term_code: termCode,
                gen_ed_tags: (selection.course.genEds ?? []).map((genEd) => genEd.code),
                grade: null,
                is_completed: isCompleted,
            });
        }
    }

    return result;
}
