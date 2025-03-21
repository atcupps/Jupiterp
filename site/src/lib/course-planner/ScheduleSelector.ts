/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Functions for switching between schedules. Many functions
 * are in `ScheduleSelector.svelte` or `ScheduleOptionsDropdown.svelte`,
 * but in this file there are some that are used by both.
 */

import { NonselectedScheduleStore } from "../../stores/CoursePlannerStores";

/**
 * Ensure that a schedule name is unique by appending another string if
 * necessary.
 * 
 * @param schedules The schedules to compare `defaultName` with
 * @param uniquifier The string to append to the beginning
 * @returns A unique schedule name based on `defaultname`
 */
export function uniqueScheduleName(
                    defaultName: string, 
                    uniquifier: string,
                    schedules: StoredSchedule[]): string {
    const scheduleNames: Set<string> = new Set<string>();
    schedules.forEach((elt) => { scheduleNames.add(elt.scheduleName) });
    if (scheduleNames.has(defaultName)) {
        let curName = defaultName;
        while (scheduleNames.has(curName)) {
            curName = uniquifier + curName;
        }
        return curName;
    } else {
        return defaultName;
    }
}

/**
 * Delete a specific schedule from an array of non-selected schedules.
 * @param schedule The schedule to be deleted
 * @param nonselectedSchedules The array from which to delete `schedule`.
 * Because the actual value being taken as a parameter is a pointer to the
 * array, this function will cause a side effect in the `nonselectedSchedules`
 * array used as an argument to this function.
 */
export function deleteNonselectedSchedule(schedule: StoredSchedule,
                                    nonselectedSchedules: StoredSchedule[]) {
    const index = nonselectedSchedules.indexOf(schedule);
    if (index === -1) {
        // This should not be possible
        console.log('Could not find schedule: ' + schedule.scheduleName);
    }
    else {
        nonselectedSchedules.splice(index, 1);
        NonselectedScheduleStore.set(nonselectedSchedules);
    }
}