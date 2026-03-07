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
import { readLocalScheduleSnapshot } from "$lib/course-planner/ScheduleStorage";
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

export function readSchedulesFromLocalStorage(userId: string | null = null): StoredSchedule[] {
    if (typeof localStorage === "undefined") {
        return [];
    }

    const {
        selectedSectionsRaw,
        scheduleNameRaw,
        scheduleTermRaw,
        scheduleYearRaw,
        nonselectedSchedulesRaw,
    } = readLocalScheduleSnapshot(userId);
    const defaultTermYear = getDefaultTermYear();
    const selectedRaw = selectedSectionsRaw;
    const scheduleName = scheduleNameRaw ?? "Schedule";
    const scheduleTerm = isAcademicTerm(scheduleTermRaw)
        ? scheduleTermRaw
        : defaultTermYear.term;
    const scheduleYear = Number(scheduleYearRaw ?? defaultTermYear.year);

    const currentSchedule = normalizeStoredSchedule({
        scheduleName,
        selections: selectedRaw ? resolveSelections(selectedRaw) : [],
        term: scheduleTerm,
        year: scheduleYear,
    }, defaultTermYear);

    const nonselectedRaw = nonselectedSchedulesRaw;
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
    const byCourse = new Map<string, UserCourse>();

    for (const schedule of schedules) {
        const termCode = termYearToCode(schedule.term, schedule.year);
        const isCompleted = compareTermCodes(termCode, nowCode) <= 0;

        for (const selection of schedule.selections) {
            const courseId = selection.course.courseCode;
            const nextGenEds = (selection.course.genEds ?? []).map((genEd) => genEd.code);
            const existing = byCourse.get(courseId);

            if (!existing) {
                byCourse.set(courseId, {
                    id: courseId,
                    user_id: userId,
                    course_id: courseId,
                    course_title: selection.course.name,
                    term_code: termCode,
                    gen_ed_tags: nextGenEds,
                    grade: null,
                    is_completed: isCompleted,
                });
                continue;
            }

            const mergedGenEds = Array.from(new Set([
                ...(existing.gen_ed_tags ?? []),
                ...nextGenEds,
            ]));

            const shouldReplaceTerm =
                (!existing.is_completed && isCompleted)
                || (
                    existing.is_completed === isCompleted
                    && compareTermCodes(termCode, existing.term_code) < 0
                );

            byCourse.set(courseId, {
                ...existing,
                course_title: existing.course_title || selection.course.name,
                term_code: shouldReplaceTerm ? termCode : existing.term_code,
                gen_ed_tags: mergedGenEds,
                is_completed: existing.is_completed || isCompleted,
            });
        }
    }

    return Array.from(byCourse.values());
}

export function totalCreditsForSchedule(schedule: StoredSchedule): number {
    return schedule.selections.reduce((sum, selection) => {
        return sum + selection.course.minCredits;
    }, 0);
}

export function totalTakenCreditsAcrossSchedules(
    schedules: StoredSchedule[],
    nowTermYear: TermYear = getDefaultTermYear()
): number {
    const courses = schedulesToUserCourses(schedules, nowTermYear);
    const seen = new Set<string>();
    let total = 0;

    for (const course of courses) {
        if (!course.is_completed) {
            continue;
        }
        if (seen.has(course.course_id)) {
            continue;
        }
        seen.add(course.course_id);

        const matched = schedules
            .flatMap((schedule) => schedule.selections)
            .find((selection) => selection.course.courseCode === course.course_id);
        total += matched?.course.minCredits ?? 0;
    }

    return total;
}
