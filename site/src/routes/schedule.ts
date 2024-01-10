/**
 * This file is part of Jupiterp: https://github.com/atcupps/Jupiterp
 * 
 * @fileoverview This file contains functions used for processing a list of
 * course sections chosen by a user and creating a schedule in the form of a
 * list of class meetings for every day of the week.
 */

import { timeToNumber } from "./classMeeting";

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
    let colorCounter = 0;
    selections.forEach((selection) => {
        const colorNumber: number = colorCounter++;
        selection.section.class_meetings.forEach((meeting) => {
            const newMeeting: ClassMeetingExtended = {
                course: selection.courseCode,
                secCode: selection.section.sec_code,
                instructors: selection.section.instructors,
                meeting,
                colorNumber
            }
            if (typeof meeting === 'string') {
                schedule.other = [...schedule.other, newMeeting];
            }
            else if ('OnlineSync' in meeting) {
                addMeetings(schedule, newMeeting, meeting.OnlineSync);
            } else {
                if (meeting.InPerson.classtime == null) {
                    schedule.other = [...schedule.other, newMeeting];
                } else {
                    addMeetings(schedule, newMeeting, 
                                        meeting.InPerson.classtime);
                }
            }
        })
    })
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
        switch (day) {
            case Day.Monday:
                schedule.monday = [...schedule.monday, meeting];
                break;
            case Day.Tuesday:
                schedule.tuesday = [...schedule.tuesday, meeting];
                break;
            case Day.Wednesday:
                schedule.wednesday = [...schedule.wednesday, meeting];
                break;
            case Day.Thursday:
                schedule.thursday = [...schedule.thursday, meeting];
                break;
            case Day.Friday:
                schedule.friday = [...schedule.friday, meeting];
                break;
            case Day.Other:
                schedule.other = [...schedule.other, meeting];
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
    switch (days) {
        case 'M':
            return [Day.Monday];
        case 'Tu':
            return [Day.Tuesday];
        case 'W':
            return [Day.Wednesday];
        case 'Th':
            return [Day.Thursday];
        case 'F':
            return [Day.Friday];
        case 'MWF':
            return [Day.Monday, Day.Wednesday, Day.Friday];
        case 'MW':
            return [Day.Monday, Day.Wednesday];
        case 'WF':
            return [Day.Wednesday, Day.Friday];
        case 'TuTh':
            return [Day.Tuesday, Day.Thursday];
        case 'MTuWThF':
            return [Day.Monday, Day.Tuesday, Day.Wednesday, 
                                        Day.Thursday, Day.Friday];
        case 'MF':
            return [Day.Monday, Day.Friday];
        case 'Sa':
            return [Day.Other];
        case 'Su':
            return [Day.Other];
        case 'SaSu':
            return [Day.Other];
        case 'MTu':
            return [Day.Monday, Day.Tuesday];
        case 'MTuThF':
            return [Day.Monday, Day.Tuesday, Day.Thursday, Day.Friday];
        case 'MTuWTh':
            return [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday];
        default:
            throw Error('Unknown Day code: ' + days);
    }
}

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