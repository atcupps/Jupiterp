/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Types and interfaces used in Jupiterp
 */

import type { ClassMeeting, Course, Section } from "@jupiterp/jupiterp"

/**
 * A section of a class selected by the user, along with metadata used for
 * displaying it on the schedule.
 */
// Any changes to `ScheduleSelection` need to be typechecked in `courseLoad.ts`
interface ScheduleSelection {
    /**
     * The course this selection belongs to
     */
    course: Course,

    /**
     * The section selected by the user
     */
    section: Section,

    /**
     * If this is true, the user has not actually selected this yet, but it is
     * being previewed on the schedule.
     */
    hover: boolean,

    /**
     * A list of strings that track how this selection differs from the most
     * up-to-date version of the section. This is used to display a warning
     * icon in the UI if the section has changed since the user added it to
     * their schedule.
     */
    differences: string[],

    /**
     * The number used to color-code this selection in the UI.
     */
    colorNumber: number,
}

/**
 * A selection stored in local storage, along with the name of the schedule
 */
interface StoredSchedule {
    scheduleName: string,
    selections: ScheduleSelection[]
}

/**
 * A ClassMeeting, with additional metadata used for displaying it on the
 * schedule.
 */
interface ClassMeetingExtended {
    /**
     * The course code of this meeting
     */
    courseCode: string,

    /**
     * The section code of this meeting
     */
    sectionCode: string,

    /**
     * Meeting data
     */
    meeting: ClassMeeting,

    /**
     * When there are multiple meetings that have overlapping times, they
     * conflict. To display them side-by-side, the meetings are sorted into
     * a minimal number of columns. The `conflictIndex` indicates which column
     * this meeting is in.
     */
    conflictIndex: number,

    /**
     * Indicates the total number of columns needed to display all conflicting
     * meetings.
     */
    conflictTotal: number,

    /**
     * Instructors for this meeting
     */
    instructors: string[],

    /**
     * If this is true, the user has not actually selected this yet, but it is
     * being previewed on the schedule.
     */
    hover: boolean,

    /**
     * The number used to color-code this meeting in the UI.
     */
    colorNumber: number,

    /**
     * A list of strings that track how this meeting differs from the most
     * up-to-date version of the section. This is used to display a warning
     * icon in the UI if the section has changed since the user added it to
     * their schedule.
     */
    differences: string[]
}

/**
 * A schedule, organized by day of the week.
 */
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