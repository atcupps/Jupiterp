/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Utilities for working with academic terms.
 */

import type { StoredSchedule } from "../../types";

export const TERM_VALUES = ["Winter", "Spring", "Summer", "Fall"] as const;
export const MIN_SCHEDULE_YEAR = 2022;

export type AcademicTerm = typeof TERM_VALUES[number];

export interface TermYear {
    term: AcademicTerm,
    year: number,
}

export function isAcademicTerm(value: unknown): value is AcademicTerm {
    return typeof value === "string" &&
        TERM_VALUES.includes(value as AcademicTerm);
}

export function getMaxScheduleYear(date = new Date()): number {
    return date.getFullYear();
}

export function getDefaultTermYear(date = new Date()): TermYear {
    const month = date.getMonth();
    const year = date.getFullYear();

    if (month <= 1) {
        return {
            term: "Winter",
            year,
        };
    }

    if (month <= 4) {
        return {
            term: "Spring",
            year,
        };
    }

    if (month <= 7) {
        return {
            term: "Summer",
            year,
        };
    }

    return {
        term: "Fall",
        year,
    };
}

export function normalizeStoredSchedule(
                        schedule: Partial<StoredSchedule>,
                        defaultValue = getDefaultTermYear()): StoredSchedule {
    const maxYear = getMaxScheduleYear();
    const parsedYear = Number(schedule.year);
    const year = Number.isInteger(parsedYear) &&
            parsedYear >= MIN_SCHEDULE_YEAR && parsedYear <= maxYear
        ? parsedYear
        : defaultValue.year;

    const term = isAcademicTerm(schedule.term)
        ? schedule.term
        : defaultValue.term;

    return {
        scheduleName: schedule.scheduleName ?? "Schedule",
        selections: schedule.selections ?? [],
        term,
        year,
    };
}
