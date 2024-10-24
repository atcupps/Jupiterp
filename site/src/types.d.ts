/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Types and interfaces used in Jupiterp
 */

interface Professor {
    name: string,
    slug: string,
    average_rating: number | null
}

interface Department {
    name: string,
    courses: Course[]
}

interface Course {
    code: string,
    name: string,
    credits: CreditCount,
    gen_eds: string[] | null,
    description: string,
    sections: Section[] | null
}

type CreditCount =
    { Amount: number } | { Range: number[] }

interface Section {
    sec_code: string,
    instructors: string[],
    class_meetings: ClassMeeting[]
}

type ClassMeeting =
    | string
    | { OnlineSync: Classtime }
    | { InPerson: InPersonClass }

interface InPersonClass {
    classtime: Classtime | null,
    location: string[] | null
}

interface Classtime {
    days: string,
    start_time: TimeComponent[],
    end_time: TimeComponent[]
}

type TimeComponent =
    number | string;

interface JupiterpData {
    professors: Professor[],
    departments: Department[]
}

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