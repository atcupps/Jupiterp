/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview This file contains functions used for processing a list of
 * course sections chosen by a user and creating a schedule in the form of a
 * list of class meetings for every day of the week.
 */

import { timeToNumber } from "./ClassMeetingUtils";

enum Day {
    Monday = 'monday',
    Tuesday = 'tuesday',
    Wednesday = 'wednesday',
    Thursday = 'thursday',
    Friday = 'friday',
    Other = 'other'
}

/**
 * Create a `Schedule` from a list of selected course sections.
 * @param selections A list of course sections chosen by the user in the form
 *                      of a `ScheduleSelection[]`.
 * @returns A `Schedule` built from `selections`
 */
export function schedulify(selections: ScheduleSelection[]): Schedule {
    const schedule: Schedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        other: []
    };
    selections.forEach((selection) => {
        selection.section.class_meetings.forEach((meeting) => {
            const newMeeting: ClassMeetingExtended = {
                course: selection.courseCode,
                secCode: selection.section.sec_code,
                instructors: selection.section.instructors,
                conflictIndex: 1,
                conflictTotal: 1,
                meeting,
                hover: selection.hover,
                colorNumber: selection.colorNumber,
                differences: selection.differences
            }
            if (typeof meeting === 'string') {
                schedule.other = [...schedule.other, newMeeting];
            }
            else if ('OnlineSync' in meeting) {
                addMeetings(schedule, newMeeting, meeting.OnlineSync);
            } else {
                if (meeting.InPerson.classtime === null) {
                    schedule.other = [...schedule.other, newMeeting];
                } else {
                    addMeetings(schedule, newMeeting, 
                                        meeting.InPerson.classtime);
                }
            }
        })
    });
    labelConflictingClasstimes(schedule);
    return schedule;
}

/**
 * Add class meetings to days of the week of `schedule` appropriately.
 * @param schedule A `Schedule` object to be modified.
 * @param meeting A `ClassMeetingExtended` object to be added to the matching
 *                  days of `schedule`.
 * @param classtime A `Classtime` used to determine which days to add `meeting`
 *                  to.
 */
function addMeetings(schedule: Schedule, meeting: ClassMeetingExtended, 
                                                        classtime: Classtime) {
    const days: Day[] = parseDays(classtime.days);
    days.forEach((day) => {
        const meetingCopy = JSON.parse(JSON.stringify(meeting))
        switch (day) {
            case Day.Monday:
                schedule.monday = [...schedule.monday, meetingCopy];
                schedule.monday.sort((a, b) => {
                    return getClassStartTime(a) - getClassStartTime(b)
                });
                break;
            case Day.Tuesday:
                schedule.tuesday = [...schedule.tuesday, meetingCopy];
                schedule.tuesday.sort((a, b) => {
                    return getClassStartTime(a) - getClassStartTime(b)
                });
                break;
            case Day.Wednesday:
                schedule.wednesday = [...schedule.wednesday, meetingCopy];
                schedule.wednesday.sort((a, b) => {
                    return getClassStartTime(a) - getClassStartTime(b)
                });
                break;
            case Day.Thursday:
                schedule.thursday = [...schedule.thursday, meetingCopy];
                schedule.thursday.sort((a, b) => {
                    return getClassStartTime(a) - getClassStartTime(b)
                });
                break;
            case Day.Friday:
                schedule.friday = [...schedule.friday, meetingCopy];
                schedule.friday.sort((a, b) => {
                    return getClassStartTime(a) - getClassStartTime(b)
                });
                break;
            case Day.Other:
                schedule.other = [...schedule.other, meetingCopy];
                break;
        }
    })
}

/**
 * Parse `days` as a code and return an array of matching `Day`s. As an
 * example, `'TuTh'` would match to Tuesday and Thursday, so this function
 * would return `[Day.Tuesday, Day.Thursday]`.
 * @param days A `string` with a day code; ex. `'TuTh'`.
 * @returns An array of `Day`s matching `days`.
 */
function parseDays(days: string): Day[] {
    const result: Day[] = [];
    for (let i = 0; i < days.length; i++) {
        switch (days[i]) {
            case 'M':
                result.push(Day.Monday);
                break;
            case 'T':
                if (days[i + 1] === 'u') {
                    result.push(Day.Tuesday);
                    i++;
                } else if (days[i + 1] === 'h') {
                    result.push(Day.Thursday);
                    i++;
                } else {
                    throw Error('Invalid day code: ' + days);
                }
                break;
            case 'W':
                result.push(Day.Wednesday);
                break;
            case 'F':
                result.push(Day.Friday);
                break;
            case 'S':
                if (days === 'SaSu') {
                    result.push(Day.Other);
                    i += 3;
                } else {
                    result.push(Day.Other);
                    i++;
                }
                break;
            default:
                throw Error('Invalid day code: ' + days);
        }
    }
    return result;
}

/**
 * Gets the bounds of a `schedule` identifying the earliest start time for a
 * class meeting in the schedule and the latest end time. Because this is meant
 * to be used for the user interface, the earliest start time is floored, and
 * the latest end time is ceiled. 
 * @param schedule A `Schedule`
 * @returns A `ClasstimeBound` for the `Schedule`
 */
export function getClasstimeBounds(schedule: Schedule): ClasstimeBound {
    let result: ClasstimeBound = {
        earliestStart: Number.MAX_SAFE_INTEGER,
        latestEnd: Number.MIN_SAFE_INTEGER,
    };
    const days = [
        schedule.monday, 
        schedule.tuesday, 
        schedule.wednesday, 
        schedule.thursday, 
        schedule.friday,
    ];
    days.forEach(day => {
        day.forEach(classMeeting => {
            const meeting = classMeeting.meeting;
            if (typeof meeting != 'string') {
                if ('OnlineSync' in meeting) {
                    result = {
                        earliestStart: Math.min(
                            result.earliestStart,
                            Math.floor(
                                timeToNumber(
                                    meeting.OnlineSync.start_time
                                )
                            )
                        ),
                        latestEnd: Math.max(
                            result.latestEnd,
                            Math.ceil(
                                timeToNumber(
                                    meeting.OnlineSync.end_time
                                )
                            )
                        )
                    }
                } else {
                    if (meeting.InPerson.classtime != null) {
                        result = {
                            earliestStart: Math.min(
                                result.earliestStart,
                                Math.floor(
                                    timeToNumber(
                                        meeting.InPerson.classtime.start_time
                                    )
                                )
                            ),
                            latestEnd: Math.max(
                                result.latestEnd,
                                Math.ceil(
                                    timeToNumber(
                                        meeting.InPerson.classtime.end_time
                                    )
                                )
                            )
                        }
                    }
                }
            }
        })
    })
    return result;
}

/**
 * Labels conflicting classtimes with an appropriate `conflictIndex` and
 * `conflictTotal`. This allows the `schedule` to have multiple classes with
 * conflicting class meeting times and display them side-by-side in the UI.
 * This function has side effects and modifies an existing schedule rather than
 * returning a schedule to be assigned to another variable.
 * @param schedule A `Schedule`
 */
function labelConflictingClasstimes(schedule: Schedule) {
    for (const day of 
                    [
                        schedule.monday, 
                        schedule.tuesday, 
                        schedule.wednesday, 
                        schedule.thursday, 
                        schedule.friday
                    ]) {
        const startTimes: number[] = day.map(getClassStartTime);
        const endTimes: number[] = day.map(getClassEndTime);
        for (let i = 0; i < day.length - 1; i++) {
            if (endTimes[i] > startTimes[i + 1]) {
                let j = i + 1;
                let curEnd: number = endTimes[i];
                
                // Identifying a group of conflicting classtimes
                while (curEnd > startTimes[j] && j < day.length) {
                    curEnd = Math.max(curEnd, endTimes[j]);
                    j++;
                }

                // Creating an array of conflict indices
                const conflictIndices: number[] = 
                        getConflictIndices(
                            day.slice(i, j),
                            startTimes.slice(i, j),
                            endTimes.slice(i, j)
                        );
                
                // Assigning conflict indices
                const startingPos = i;
                while (i < j) {
                    day[i].conflictIndex = conflictIndices[i - startingPos];
                    day[i].conflictTotal = Math.max(...conflictIndices);
                    i++;
                }
                i--;
            }
        }
    }
}

/**
 * @param meeting A `ClassMeetingExtended`
 * @returns The number form start time of `meeting`
 */
function getClassStartTime(meeting: ClassMeetingExtended): number {
    if (typeof meeting.meeting === 'string') {
        throw Error('`getClassStartTime` called on a string');
    }
    else if ('OnlineSync' in meeting.meeting) {
        return timeToNumber(meeting.meeting.OnlineSync.start_time)
    }
    else {
        if (meeting.meeting.InPerson.classtime !== null) {
            return timeToNumber(meeting.meeting.InPerson.classtime.start_time);
        } else {
            throw Error(
                'Null In Person meeting class time in `getClassStartTime`'
            );
        }
    }
}

/**
 * @param meeting A `ClassMeetingExtended`
 * @returns The number form end time of `meeting`
 */
function getClassEndTime(meeting: ClassMeetingExtended): number {
    if (typeof meeting.meeting === 'string') {
        throw Error('`getClassEndTime` called on a string');
    }
    else if ('OnlineSync' in meeting.meeting) {
        return timeToNumber(meeting.meeting.OnlineSync.end_time)
    }
    else {
        if (meeting.meeting.InPerson.classtime !== null) {
            return timeToNumber(meeting.meeting.InPerson.classtime.end_time);
        } else {
            throw Error(
                'Null In Person meeting class time in `getClassEndTime`'
            );
        }
    }
}

function getConflictIndices(
        classes: ClassMeetingExtended[], 
        startTimes: number[], 
        endTimes: number[]
    ): number[] {

    const result: number[] = [1];
    let curMax: number = 1;

    // If a class conflicts with another class,
    // it cannot use the same index number.
    for (let i = 1; i < classes.length; i++) {
        let freeIndexFound: boolean = false;
        let freeIndexIndex: number = -1;
        let curResult: number = -1;
        for (let j = 0; j < result.length; j++) {
            if (i !== j && !classesConflict(
                                            classes[i], classes[j],
                                            startTimes[i], endTimes[i],
                                            startTimes[j], endTimes[j])) {
                if (!freeIndexFound) {
                    curResult = result[j];
                    freeIndexIndex = j;
                }
                freeIndexFound = true;
            }
            else if (freeIndexFound && curResult === result[j]) {
                j = freeIndexIndex;
                freeIndexFound = false;
            }
        }
        if (freeIndexFound) {
            result.push(curResult);
        }
        else {
            result.push(++curMax);
        }
    }
    return result;
}

function classesConflict(
        a: ClassMeetingExtended, b: ClassMeetingExtended, 
        aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    let result: boolean = false;
    if (aStart <= bStart && aEnd > bStart) {
        result = true;
    }
    else if (bStart <= aStart && bEnd > aStart) {
        result = true;
    }
    return result;
}

/**
 * Append a `hoveredSection` to `selections` if it is not `null`.
 * @param selections An array of `ScheduleSelection`s
 * @param hoveredSection A `ScheduleSelection` or `null`
 * @returns `selections`, with `hoveredSection` appended if it is not `null`.
 */
export function appendHoveredSection(selections: ScheduleSelection[], 
        hoveredSection: ScheduleSelection | null): ScheduleSelection[] {
    if (hoveredSection) {
        return [...selections, hoveredSection];
    } else {
        return selections;
    }
}