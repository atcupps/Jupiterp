/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

export type DegreeType = 'Undergraduate' | 'Dual-Degree' | 'Double Major' | 'Masters' | 'P.H.D.';

export type ProfilePrivacyLevel = 'public' | 'friends_only' | 'umd_only' | 'private';

export interface ProfilePreferences {
	degreeType: DegreeType;
	majors: string[];
	minors: string[];
	graduationYear: number | null;
}

export interface EditableProfileFields {
	displayName: string;
	degreeType: DegreeType;
	majors: string[];
	minors: string[];
	graduationYear: number | null;
	profilePrivacy: ProfilePrivacyLevel;
	avatarUrl: string | null;
	avatarColor: string;
}

export const DEFAULT_DEGREE_TYPE: DegreeType = 'Undergraduate';
export const DEFAULT_PROFILE_PRIVACY: ProfilePrivacyLevel = 'friends_only';
export const DEFAULT_AVATAR_COLOR = '#b90e25';
