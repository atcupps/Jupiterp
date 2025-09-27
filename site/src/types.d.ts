/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Types and interfaces used in Jupiterp
 */

// Any changes to `ScheduleSelection` need to be typechecked in `courseLoad.ts`
interface ScheduleSelection {
    courseCode: string,
    section: Section,
    hover: boolean,
    differences: string[],
    credits: number,
    course: Course,
    colorNumber: number,
}

interface StoredSchedule {
    scheduleName: string,
    selections: ScheduleSelection[]
}

interface ClassMeetingExtended {
    course: string,
    secCode: string,
    conflictIndex: number,
    conflictTotal: number,
    instructors: string[],
    meeting: ClassMeeting,
    hover: boolean,
    colorNumber: number,
    differences: string[]
}

interface Schedule {
    monday: ClassMeetingExtended[],
    tuesday: ClassMeetingExtended[],
    wednesday:  ClassMeetingExtended[],
    thursday: ClassMeetingExtended[],
    friday: ClassMeetingExtended[],
    other: ClassMeetingExtended[]
}

interface ClasstimeBound {
    earliestStart: number,
    latestEnd: number
}