/**
 * This file is part of Jupiterp: https://github.com/atcupps/Jupiterp
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
    credits: CreditAmount,
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

interface ScheduleSelection {
    courseCode: string,
    section: Section
}

interface ClassMeetingExtended {
    course: string,
    instructors: string[],
    meeting: ClassMeeting,
    colorNumber: number
}

interface Schedule {
    monday: ClassMeetingExtended[],
    tuesday: ClassMeetingExtended[],
    wednesday:  ClassMeetingExtended[],
    thursday: ClassMeetingExtended[],
    friday: ClassMeetingExtended[],
    other: ClassMeetingExtended[]
}