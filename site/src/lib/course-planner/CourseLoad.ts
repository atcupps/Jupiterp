/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2025 Andrew Cupps
 * 
 * @fileoverview This file contains a function `retrieveCourses` which is
 * used as part of loading courses from local storage.
 */

import type { Course, CoursesConfig, CoursesResponse } from "@jupiterp/jupiterp";
import type {
    LegacyScheduleSelection,
    LegacyStoredSchedule,
    ScheduleSelection,
    SelectionDifferences,
    StoredSchedule
} from "../../types";
import { assignColorNumbers, modernizeSelections } from "./Modernization";
import { client } from "$lib/client";
import { CurrentScheduleStore, NonselectedScheduleStore } from "../../stores/CoursePlannerStores";

/**
 * Resolve a stored schedule selection array from a string in local storage,
 * and convert to modernized format if necessary.
 * @param selectionsRaw A string from local storage
 * @returns The parsed and modernized `ScheduleSelection[]`
 */
export function resolveSelections(selectionsRaw: string): ScheduleSelection[] {
    const parsed = JSON.parse(selectionsRaw);
    if (!Array.isArray(parsed)) {
        return [];
    }

    if (parsed.length === 0) {
        return [];
    }

    if ('credits' in parsed[0]) {
        // If 'credits' is a property, this is legacy
        return modernizeSelections(
                parsed as LegacyScheduleSelection[]);
    }

    return parsed as ScheduleSelection[];
}

export function resolveStoredSchedules(storedRaw: string): StoredSchedule[] {
    const parsed = JSON.parse(storedRaw);
    if (!Array.isArray(parsed)) {
        return [];
    }

    if (parsed.length === 0) {
        return [];
    }

    if ('credits' in parsed[0].selections[0]) {
        // If 'credits' is a property, this is legacy
        return (parsed as LegacyStoredSchedule[]).map((legacy) => {
            return {
                scheduleName: legacy.scheduleName,
                selections: modernizeSelections(legacy.selections)
            };
        });
    }

    return (parsed as StoredSchedule[]).map((stored) => {
        return {
            scheduleName: stored.scheduleName,
            selections: stored.selections
        };
    });
}

function diffAndUpdate(old: ScheduleSelection,
                        upToDateCourse: Course): ScheduleSelection | null {
    let differences: SelectionDifferences = {
        instructors: false,
        numMeetings: false,
        meetingType: false,
        meetingTime: false,
        meetingLocation: false
    };

    if (!upToDateCourse.sections) {
        // Course has no sections, nothing to compare
        return old;
    }

    // Test for pseudo section used for courses with no section
    if (old.section.sectionCode === 'N/A'
            && upToDateCourse.sections.length === 0) {
        return old;
    }

    const upToDateSection = upToDateCourse.sections.find((section) => {
        return section.sectionCode === old.section.sectionCode;
    });

    if (!upToDateSection) {
        // Section no longer exists!
        return null;
    }
    
    // Compare instructors
    const oldInstructors = old.section.instructors.sort();
    const newInstructors = upToDateSection.instructors.sort();
    if (oldInstructors.length !== newInstructors.length) {
        differences.instructors = true;
    } else {
        for (let i = 0; i < oldInstructors.length; i++) {
            if (oldInstructors[i] !== newInstructors[i]) {
                differences.instructors = true;
                break;
            }
        }
    }

    // Compare class meetings
    const oldMeetings = old.section.meetings;
    const newMeetings = upToDateSection.meetings;
    if (oldMeetings.length !== newMeetings.length) {
        differences.numMeetings = true;
    }
    else {
        for (let i = 0; i < oldMeetings.length; i++) {
            const oldMeeting = oldMeetings[i];
            const newMeeting = newMeetings[i];
            
            const oldIsString = typeof oldMeeting === 'string';
            const newIsString = typeof newMeeting === 'string';

            if (oldIsString && newIsString) {
                if (oldMeeting !== newMeeting) {
                    differences.meetingType = true;
                    continue;
                }
            }

            if (oldIsString !== newIsString) {
                differences.meetingType = true;
                continue;
            }

            if (typeof oldMeeting === 'object' && typeof newMeeting === 'object') {
                // Compare classtime
                if (JSON.stringify(oldMeeting.classtime) !==
                        JSON.stringify(newMeeting.classtime)) {
                    differences.meetingTime = true;
                }

                // Compare location
                if (JSON.stringify(oldMeeting.location) !==
                        JSON.stringify(newMeeting.location)) {
                    differences.meetingLocation = true;
                }
            }
        }
    }

    return {
        course: {
            courseCode: upToDateCourse.courseCode,
            name: upToDateCourse.name,
            minCredits: upToDateCourse.minCredits,
            maxCredits: upToDateCourse.maxCredits,
            description: upToDateCourse.description,
            genEds: upToDateCourse.genEds,
            conditions: upToDateCourse.conditions,
        },
        section: upToDateSection,
        hover: false,
        differences,
        colorNumber: old.colorNumber,
    }
}

function getCoursesToRetrieve(
            current: StoredSchedule,
            nonselected: StoredSchedule[]): Set<string> {
    const result: Set<string> = new Set<string>();

    current.selections.forEach((selection) => {
        result.add(selection.course.courseCode);
    });

    nonselected.forEach((stored) => {
        stored.selections.forEach((selection) => {
            result.add(selection.course.courseCode);
        });
    });

    return result;
}

async function getUpToDateCourses(
                courseCodes: Set<string>): 
                    Promise<Record<string, Course>> {
    const cfg: CoursesConfig = {
        courseCodes
    };
    
    const courses: CoursesResponse = await client.coursesWithSections(cfg);
    if (!courses.ok() || !courses.data) {
        throw new Error("Failed to retrieve course data");
    }

    const courseRecord: Record<string, Course> = {};
    courses.data.forEach((course) => {
        courseRecord[course.courseCode] = course;
    });
    return courseRecord;
}

export async function ensureUpToDateAndSetStores(
                        current: StoredSchedule, 
                        nonselected: StoredSchedule[]) {
    if (current.selections.length === 0 && nonselected.length === 0) {
        // Nothing to do
        return;
    }

    const coursesToRetrieve = getCoursesToRetrieve(
        current, 
        nonselected
    );

    let upToDateCourses: Record<string, Course>;
    try {
        upToDateCourses = await getUpToDateCourses(coursesToRetrieve);
    } catch (e) {
        console.error("Failed to retrieve up-to-date course data:", e);
        return;
    }

    const updatedCurrentSelections: ScheduleSelection[] = [];
    current.selections.forEach((selection) => {
        const upToDate: Course = upToDateCourses[selection.course.courseCode];
        if (!upToDate) {
            // Course no longer exists, skip
            return;
        }
        const updated = diffAndUpdate(selection, upToDate);
        if (updated !== null) {
            updatedCurrentSelections.push(updated);
        }
    });

    const updatedNonSelectedSchedules: StoredSchedule[] = [];
    nonselected.forEach((stored) => {
        const updatedSelections: ScheduleSelection[] = [];
        stored.selections.forEach((selection) => {
            const upToDate: Course = upToDateCourses[selection.course.courseCode];
            if (!upToDate) {
                // Course no longer exists, skip
                return;
            }
            const updated = diffAndUpdate(selection, upToDate);
            if (updated !== null) {
                updatedSelections.push(updated);
            }
        });
        updatedNonSelectedSchedules.push({
            scheduleName: stored.scheduleName,
            selections: updatedSelections
        });
    });

    CurrentScheduleStore.set({
        scheduleName: current.scheduleName,
        selections: assignColorNumbers(updatedCurrentSelections)
    });

    NonselectedScheduleStore.set(
        updatedNonSelectedSchedules.map((stored) => {
            return {
                scheduleName: stored.scheduleName,
                selections: assignColorNumbers(stored.selections)
            };
        })
    );
}