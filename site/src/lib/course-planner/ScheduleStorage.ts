/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

export interface LocalScheduleSnapshot {
    selectedSectionsRaw: string | null;
    scheduleNameRaw: string | null;
    scheduleTermRaw: string | null;
    scheduleYearRaw: string | null;
    nonselectedSchedulesRaw: string | null;
}

const KEY_SELECTED = "selectedSections";
const KEY_NAME = "scheduleName";
const KEY_TERM = "scheduleTerm";
const KEY_YEAR = "scheduleYear";
const KEY_NONSELECTED = "nonselectedSchedules";

function scopePrefix(userId: string | null): string {
    return userId ? `schedule:user:${userId}:` : "schedule:guest:";
}

function scopedKey(userId: string | null, baseKey: string): string {
    return `${scopePrefix(userId)}${baseKey}`;
}

function readScopedSnapshot(userId: string | null): LocalScheduleSnapshot {
    return {
        selectedSectionsRaw: localStorage.getItem(scopedKey(userId, KEY_SELECTED)),
        scheduleNameRaw: localStorage.getItem(scopedKey(userId, KEY_NAME)),
        scheduleTermRaw: localStorage.getItem(scopedKey(userId, KEY_TERM)),
        scheduleYearRaw: localStorage.getItem(scopedKey(userId, KEY_YEAR)),
        nonselectedSchedulesRaw: localStorage.getItem(scopedKey(userId, KEY_NONSELECTED)),
    };
}

function snapshotHasAnyValue(snapshot: LocalScheduleSnapshot): boolean {
    return !!(
        snapshot.selectedSectionsRaw
        || snapshot.scheduleNameRaw
        || snapshot.scheduleTermRaw
        || snapshot.scheduleYearRaw
        || snapshot.nonselectedSchedulesRaw
    );
}

// Guest mode supports one-time fallback from pre-scoped keys.
function readLegacyGuestSnapshot(): LocalScheduleSnapshot {
    return {
        selectedSectionsRaw: localStorage.getItem(KEY_SELECTED),
        scheduleNameRaw: localStorage.getItem(KEY_NAME),
        scheduleTermRaw: localStorage.getItem(KEY_TERM),
        scheduleYearRaw: localStorage.getItem(KEY_YEAR),
        nonselectedSchedulesRaw: localStorage.getItem(KEY_NONSELECTED),
    };
}

export function readLocalScheduleSnapshot(
    userId: string | null,
): LocalScheduleSnapshot {
    if (typeof localStorage === "undefined") {
        return {
            selectedSectionsRaw: null,
            scheduleNameRaw: null,
            scheduleTermRaw: null,
            scheduleYearRaw: null,
            nonselectedSchedulesRaw: null,
        };
    }

    const scoped = readScopedSnapshot(userId);
    if (snapshotHasAnyValue(scoped)) {
        return scoped;
    }

    if (userId === null) {
        return readLegacyGuestSnapshot();
    }

    // Signed-in users should never read guest storage.
    return scoped;
}

export function hasLocalScheduleSnapshot(userId: string | null): boolean {
    if (typeof localStorage === "undefined") {
        return false;
    }

    return snapshotHasAnyValue(readScopedSnapshot(userId));
}

export function writeLocalScheduleSnapshot(
    userId: string | null,
    snapshot: {
        selectedSections: string,
        scheduleName: string,
        scheduleTerm: string,
        scheduleYear: string,
        nonselectedSchedules: string,
    }
): void {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(scopedKey(userId, KEY_SELECTED), snapshot.selectedSections);
    localStorage.setItem(scopedKey(userId, KEY_NAME), snapshot.scheduleName);
    localStorage.setItem(scopedKey(userId, KEY_TERM), snapshot.scheduleTerm);
    localStorage.setItem(scopedKey(userId, KEY_YEAR), snapshot.scheduleYear);
    localStorage.setItem(scopedKey(userId, KEY_NONSELECTED), snapshot.nonselectedSchedules);
}
