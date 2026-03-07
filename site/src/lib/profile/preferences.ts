/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import {
    DEFAULT_DEGREE_TYPE,
    type DegreeType,
    type ProfilePreferences,
} from "$lib/profile/types";

const DEGREE_KEY = "profileDegreeType";
const MAJORS_KEY = "profileMajors";
const MINORS_KEY = "profileMinors";
const GRAD_YEAR_KEY = "profileGraduationYear";

const DEGREE_TYPES: DegreeType[] = [
    "Undergraduate",
    "Dual-Degree",
    "Double Major",
    "Masters",
    "P.H.D.",
];

export function isDegreeType(value: string | null): value is DegreeType {
    return !!value && DEGREE_TYPES.includes(value as DegreeType);
}

export function readProfilePreferencesFromLocalStorage(): ProfilePreferences {
    if (typeof localStorage === "undefined") {
        return {
            degreeType: DEFAULT_DEGREE_TYPE,
            majors: [],
            minors: [],
            graduationYear: null,
        };
    }

    const degreeRaw = localStorage.getItem(DEGREE_KEY);
    const majorsRaw = localStorage.getItem(MAJORS_KEY);
    const minorsRaw = localStorage.getItem(MINORS_KEY);
    const gradRaw = localStorage.getItem(GRAD_YEAR_KEY);

    const degreeType = isDegreeType(degreeRaw)
        ? degreeRaw
        : DEFAULT_DEGREE_TYPE;

    let majors: string[] = [];
    let minors: string[] = [];

    try {
        majors = majorsRaw ? JSON.parse(majorsRaw) as string[] : [];
        if (!Array.isArray(majors)) {
            majors = [];
        }
    } catch {
        majors = [];
    }

    try {
        minors = minorsRaw ? JSON.parse(minorsRaw) as string[] : [];
        if (!Array.isArray(minors)) {
            minors = [];
        }
    } catch {
        minors = [];
    }

    const graduationYear = gradRaw ? Number(gradRaw) : null;
    return {
        degreeType,
        majors,
        minors,
        graduationYear: Number.isFinite(graduationYear) ? graduationYear : null,
    };
}

export function saveProfilePreferencesToLocalStorage(
    preferences: ProfilePreferences
): void {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(DEGREE_KEY, preferences.degreeType);
    localStorage.setItem(MAJORS_KEY, JSON.stringify(preferences.majors));
    localStorage.setItem(MINORS_KEY, JSON.stringify(preferences.minors));
    if (preferences.graduationYear === null) {
        localStorage.removeItem(GRAD_YEAR_KEY);
    } else {
        localStorage.setItem(GRAD_YEAR_KEY, preferences.graduationYear.toString());
    }
}
