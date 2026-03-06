/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import {
    GEN_ED_REQUIREMENT_CODE_SET,
    type GenEdRequirement,
    type GenEdRequirementCode,
} from "$lib/gened/requirements";
import type { UserCourse } from "$lib/gened/userCourses";

export type GenEdStatus = "not_started" | "in_progress" | "completed";

export interface GenEdCourseInstance {
    course_id: string;
    course_title: string;
    term_code: string;
    grade: string | null;
    otherMatchingGenEdCodes: GenEdRequirementCode[];
}

/**
 * Computed row shown in the Gen Ed progress table for one requirement.
 */
export interface GenEdProgressRow {
    requirement: GenEdRequirement;
    completedCount: number;
    remainingCount: number;
    status: GenEdStatus;
    courses: GenEdCourseInstance[];
    earliestTermCode: string | null;
    latestTermCode: string | null;
}

function toKnownGenEdCodes(tags: string[]): GenEdRequirementCode[] {
    return tags.filter((tag): tag is GenEdRequirementCode =>
        GEN_ED_REQUIREMENT_CODE_SET.has(tag as GenEdRequirementCode)
    );
}

function getTermExtents(termCodes: string[]): {
    earliestTermCode: string | null,
    latestTermCode: string | null,
} {
    if (termCodes.length === 0) {
        return {
            earliestTermCode: null,
            latestTermCode: null,
        };
    }

    const sorted = [...termCodes].sort(compareTermCodes);
    return {
        earliestTermCode: sorted[0],
        latestTermCode: sorted[sorted.length - 1],
    };
}

const TERM_SUFFIX_ORDER: Record<string, number> = {
    WI: 0,
    SP: 1,
    SU: 2,
    FA: 3,
};

/**
 * Parses and compares term codes like 2025SP / 2025FA.
 */
export function compareTermCodes(a: string, b: string): number {
    const aMatch = a.match(/^(\d{4})([A-Z]{2})$/);
    const bMatch = b.match(/^(\d{4})([A-Z]{2})$/);

    if (!aMatch || !bMatch) {
        return a.localeCompare(b);
    }

    const aYear = Number(aMatch[1]);
    const bYear = Number(bMatch[1]);
    if (aYear !== bYear) {
        return aYear - bYear;
    }

    const aSuffix = TERM_SUFFIX_ORDER[aMatch[2]];
    const bSuffix = TERM_SUFFIX_ORDER[bMatch[2]];
    if (aSuffix !== undefined && bSuffix !== undefined) {
        return aSuffix - bSuffix;
    }

    return aMatch[2].localeCompare(bMatch[2]);
}

/**
 * Computes progress against each Gen Ed requirement using completed user
 * courses and their tags.
 */
export function computeGenEdProgress(
    requirements: GenEdRequirement[],
    courses: UserCourse[]
): GenEdProgressRow[] {
    return requirements.map((requirement) => {
        const matchingCourses: GenEdCourseInstance[] = courses
            .map((course): GenEdCourseInstance | null => {
                const tags = toKnownGenEdCodes(
                    Array.isArray(course.gen_ed_tags)
                        ? course.gen_ed_tags.map((value) => String(value).trim().toUpperCase())
                        : []
                );

                if (!tags.includes(requirement.code)) {
                    return null;
                }

                return {
                    course_id: course.course_id,
                    course_title: course.course_title,
                    term_code: course.term_code,
                    grade: course.grade,
                    otherMatchingGenEdCodes: tags.filter(
                        (tag) => tag !== requirement.code
                    ),
                };
            })
            .filter((course): course is GenEdCourseInstance => course !== null);

        const completedCount = matchingCourses.length;
        const remainingCount = Math.max(requirement.requiredCount - completedCount, 0);
        const status: GenEdStatus =
            completedCount === 0
                ? "not_started"
                : completedCount >= requirement.requiredCount
                    ? "completed"
                    : "in_progress";

        const { earliestTermCode, latestTermCode } = getTermExtents(
            matchingCourses.map((course) => course.term_code)
        );

        return {
            requirement,
            completedCount,
            remainingCount,
            status,
            courses: matchingCourses,
            earliestTermCode,
            latestTermCode,
        };
    });
}
