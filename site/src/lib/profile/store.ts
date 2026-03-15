/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import { get, writable } from 'svelte/store';
import {
	getEditableProfile,
	getProfilePreferences,
	isSupabaseConfigured,
	updateEditableProfile,
	type UserProfileRow
} from '$lib/supabase';
import {
	readProfileMetadataFromLocalStorage,
	readProfilePreferencesFromLocalStorage,
	saveProfileMetadataToLocalStorage,
	saveProfilePreferencesToLocalStorage
} from '$lib/profile/preferences';
import {
	DEFAULT_AVATAR_COLOR,
	DEFAULT_DEGREE_TYPE,
	DEFAULT_PROFILE_PRIVACY,
	type EditableProfileFields,
	type ProfilePrivacyLevel
} from '$lib/profile/types';

export interface ProfileState extends EditableProfileFields {
	loaded: boolean;
	syncing: boolean;
}

const DEFAULT_PROFILE_STATE: ProfileState = {
	loaded: false,
	syncing: false,
	displayName: '',
	degreeType: DEFAULT_DEGREE_TYPE,
	majors: [],
	minors: [],
	graduationYear: null,
	profilePrivacy: DEFAULT_PROFILE_PRIVACY,
	avatarUrl: null,
	avatarColor: DEFAULT_AVATAR_COLOR
};

export const ProfileStateStore = writable<ProfileState>(DEFAULT_PROFILE_STATE);

function sanitizeMajors(values: string[]): string[] {
	return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function localSnapshot(): EditableProfileFields {
	const preferences = readProfilePreferencesFromLocalStorage();
	const metadata = readProfileMetadataFromLocalStorage();

	return {
		displayName: metadata.displayName,
		degreeType: preferences.degreeType,
		majors: sanitizeMajors(preferences.majors),
		minors: sanitizeMajors(preferences.minors),
		graduationYear: preferences.graduationYear,
		profilePrivacy: metadata.profilePrivacy,
		avatarUrl: metadata.avatarUrl,
		avatarColor: metadata.avatarColor
	};
}

function saveLocalSnapshot(snapshot: EditableProfileFields): void {
	saveProfilePreferencesToLocalStorage({
		degreeType: snapshot.degreeType,
		majors: snapshot.majors,
		minors: snapshot.minors,
		graduationYear: snapshot.graduationYear
	});

	saveProfileMetadataToLocalStorage({
		displayName: snapshot.displayName,
		profilePrivacy: snapshot.profilePrivacy,
		avatarUrl: snapshot.avatarUrl,
		avatarColor: snapshot.avatarColor
	});
}

function mergeServerProfile(
	current: EditableProfileFields,
	server: EditableProfileFields | null,
	row: UserProfileRow | null
): EditableProfileFields {
	if (!server && !row) {
		return current;
	}

	return {
		displayName: server?.displayName ?? row?.display_name ?? current.displayName,
		degreeType: server?.degreeType ?? current.degreeType,
		majors: sanitizeMajors(server?.majors ?? current.majors),
		minors: sanitizeMajors(server?.minors ?? current.minors),
		graduationYear: server?.graduationYear ?? current.graduationYear,
		profilePrivacy: (server?.profilePrivacy ??
			row?.profile_privacy ??
			current.profilePrivacy) as ProfilePrivacyLevel,
		avatarUrl: server?.avatarUrl ?? row?.avatar_url ?? current.avatarUrl,
		avatarColor: server?.avatarColor ?? row?.avatar_color ?? current.avatarColor
	};
}

export async function loadProfileState(row: UserProfileRow | null): Promise<void> {
	const local = localSnapshot();

	ProfileStateStore.set({
		...local,
		loaded: true,
		syncing: false
	});

	if (!isSupabaseConfigured() || !row) {
		return;
	}

	try {
		const [serverEditable, serverPreferences] = await Promise.all([
			getEditableProfile(),
			getProfilePreferences()
		]);

		const merged = mergeServerProfile(
			{
				...local,
				degreeType: serverPreferences?.degreeType ?? local.degreeType,
				majors: serverPreferences?.majors ?? local.majors,
				minors: serverPreferences?.minors ?? local.minors,
				graduationYear: serverPreferences?.graduationYear ?? local.graduationYear
			},
			serverEditable,
			row
		);

		saveLocalSnapshot(merged);
		ProfileStateStore.set({
			...merged,
			loaded: true,
			syncing: false
		});
	} catch {
		// Keep local state if cloud profile cannot be loaded.
	}
}

export async function saveProfileStatePatch(
	patch: Partial<EditableProfileFields>
): Promise<{ ok: boolean; message?: string }> {
	const current = get(ProfileStateStore);
	const next: ProfileState = {
		...current,
		...patch,
		majors: sanitizeMajors(patch.majors ?? current.majors),
		minors: sanitizeMajors(patch.minors ?? current.minors),
		syncing: true
	};

	ProfileStateStore.set(next);
	saveLocalSnapshot(next);

	if (!isSupabaseConfigured()) {
		ProfileStateStore.update((state) => ({ ...state, syncing: false }));
		return { ok: true };
	}

	try {
		await updateEditableProfile(patch);
		ProfileStateStore.update((state) => ({ ...state, syncing: false }));
		return { ok: true };
	} catch (error) {
		ProfileStateStore.update((state) => ({ ...state, syncing: false }));
		return {
			ok: false,
			message: error instanceof Error ? error.message : 'Unable to save profile changes'
		};
	}
}

export function selectedProgramPathFromState(state: EditableProfileFields): string {
	const majors = sanitizeMajors(state.majors);
	if (majors.length === 0) {
		return 'None selected';
	}

	if (state.degreeType === 'Dual-Degree' || state.degreeType === 'Double Major') {
		return majors.slice(0, 2).join(', ');
	}

	return majors[0];
}
