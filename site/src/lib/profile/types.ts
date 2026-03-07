/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

export type DegreeType =
    | "Undergraduate"
    | "Dual-Degree"
    | "Double Major"
    | "Masters"
    | "P.H.D.";

export interface ProfilePreferences {
    degreeType: DegreeType;
    majors: string[];
    minors: string[];
    graduationYear: number | null;
}

export const DEFAULT_DEGREE_TYPE: DegreeType = "Undergraduate";
