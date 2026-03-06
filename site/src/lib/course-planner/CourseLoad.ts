/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview This file contains a function `retrieveCourses` which is
 * used as part of loading courses from local storage.
 */

import type {
    Course
 } from "@jupiterp/jupiterp";
import type {
    LegacyScheduleSelection,
    LegacyStoredSchedule,
    ScheduleSelection,
    SelectionDifferences,
    StoredSchedule
} from "../../types";
import { assignColorNumbers, modernizeSelections } from "./Modernization";
import { CourseDataCache, type RequestInput } from "./CourseDataCache";
import {
    getDefaultTermYear,
    normalizeStoredSchedule
} from "./Terms";
import {
    CurrentScheduleStore,
    NonselectedScheduleStore
} from "../../stores/CoursePlannerStores";

const updateCache = new CourseDataCache();

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLegacyStoredSchedule(parsed: any[]): boolean {
    for (const schedule of parsed) {
        if (schedule.selections && Array.isArray(schedule.selections)) {
            for (const selection of schedule.selections) {
                if ('credits' in selection) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

export function resolveStoredSchedules(storedRaw: string): StoredSchedule[] {
    const defaultTermYear = getDefaultTermYear();
    const parsed = JSON.parse(storedRaw);
    if (!Array.isArray(parsed)) {
        return [];
    }

    if (parsed.length === 0) {
        return [];
    }

    if (isLegacyStoredSchedule(parsed)) {
        return (parsed as LegacyStoredSchedule[]).map((legacy) => {
            return normalizeStoredSchedule({
                scheduleName: legacy.scheduleName,
                selections: modernizeSelections(legacy.selections)
            }, defaultTermYear);
        });
    }

    return (parsed as StoredSchedule[]).map((stored) => {
        return normalizeStoredSchedule({
            scheduleName: stored.scheduleName,
            selections: stored.selections,
            term: stored.term,
            year: stored.year,
        }, defaultTermYear);
    });
}

function diffAndUpdate(old: ScheduleSelection,
                        upToDateCourse: Course): ScheduleSelection | null {
    const differences: SelectionDifferences = {
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

            if (typeof oldMeeting === 'object' &&
                    typeof newMeeting === 'object') {
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

function semesterFromTermYear(
    term: StoredSchedule['term'],
    year: number
): string {
    if (term === 'Spring') {
        return `${year}01`;
    }

    if (term === 'Summer') {
        return `${year}05`;
    }

    if (term === 'Fall') {
        return `${year}08`;
    }

    return `${year}12`;
}

async function getUpToDateCoursesForSchedule(
    schedule: StoredSchedule
): Promise<Record<string, Course>> {
    const codes = new Set<string>();
    schedule.selections.forEach((selection) => {
        codes.add(selection.course.courseCode);
    });

    const semester = semesterFromTermYear(schedule.term, schedule.year);
    const entries = await Promise.all(Array.from(codes).map(async (courseCode) => {
        const input: RequestInput = {
            type: 'courseCode',
            value: courseCode,
            filters: {},
            includeSections: true,
            semester,
            term: schedule.term,
            year: schedule.year,
        };
        const courses = await updateCache.getCoursesAndSections(input);
        const course = courses.find((candidate) => {
            return candidate.courseCode === courseCode;
        }) ?? null;
        return [courseCode, course] as const;
    }));

    const record: Record<string, Course> = {};
    entries.forEach(([courseCode, course]) => {
        if (course) {
            record[courseCode] = course;
        }
    });
    return record;
}

export async function ensureUpToDateAndSetStores(
                        current: StoredSchedule, 
                        nonselected: StoredSchedule[]) {
    if (current.selections.length === 0 && nonselected.length === 0) {
        // Nothing to do
        return;
    }

    let upToDateCurrentCourses: Record<string, Course>;
    try {
        upToDateCurrentCourses = await getUpToDateCoursesForSchedule(current);
    } catch (e) {
        console.error("Failed to retrieve up-to-date course data:", e);
        return;
    }

    const updatedCurrentSelections: ScheduleSelection[] = [];
    current.selections.forEach((selection) => {
        const upToDate: Course =
            upToDateCurrentCourses[selection.course.courseCode];
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
    for (const stored of nonselected) {
        let upToDateCourses: Record<string, Course>;
        try {
            upToDateCourses = await getUpToDateCoursesForSchedule(stored);
        } catch (e) {
            console.error("Failed to retrieve up-to-date course data:", e);
            upToDateCourses = {};
        }

        const updatedSelections: ScheduleSelection[] = [];
        stored.selections.forEach((selection) => {
            const upToDate: Course = 
                upToDateCourses[selection.course.courseCode];
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
            selections: updatedSelections,
            term: stored.term,
            year: stored.year,
        });
    }

    CurrentScheduleStore.set({
        scheduleName: current.scheduleName,
        selections: assignColorNumbers(updatedCurrentSelections),
        term: current.term,
        year: current.year,
    });

    NonselectedScheduleStore.set(
        updatedNonSelectedSchedules.map((stored) => {
            return {
                scheduleName: stored.scheduleName,
                selections: assignColorNumbers(stored.selections),
                term: stored.term,
                year: stored.year,
            };
        })
    );
}