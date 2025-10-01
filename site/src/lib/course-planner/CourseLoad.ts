/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview This file contains a function `retrieveCourses` which is
 * used as part of loading courses from local storage.
 */

import type { LegacyScheduleSelection, LegacyStoredSchedule, ScheduleSelection, StoredSchedule } from "../../types";
import { modernizeSelections } from "./Modernization";

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

    return parsed as StoredSchedule[];
}

/**
 * Given courses from local storage, identify any differences in stored
 * courses compared with those in the most recently available data, and
 * return an updated array of `ScheduleSelection`s with stored courses.
 * 
 * @param selections A `ScheduleSelection[]` of locally stored courses
 * @param depts `Department[]` with all courses
 * @returns An updated `ScheduleSelection[]` with identified differences
 */
// export function retrieveCourses(selections: ScheduleSelection[], 
//                                     depts: Department[]): ScheduleSelection[] {
//     const result: ScheduleSelection[] = [];
//     let colorNumber: number = 0;
//     selections.forEach((selection) => {
//         typeCheckScheduleSelection(selection);
//         const deptName = selection.courseCode.slice(0, 4);
//         const dept = depts.find(department => department.name === deptName);
//         if (dept) {
//             const course = dept.courses.find(
//                 aCourse => aCourse.code === selection.courseCode
//             );
//             if (course && course.sections !== null) {
//                 const section = course.sections.find(
//                     aSection => 
//                         aSection.sec_code === selection.section.sec_code
//                 );
//                 if (section) {
//                     selection.differences = [];
//                     // This segment of code compares instructors and class
//                     // meetings by iterating through their respective arrays.
//                     // This could lead to false identifications of differences
//                     // if their orders are changed in arrays but the content
//                     // remains the same. This shouldn't happen, but it may be
//                     // valuable to sort the arrays. This could have its own
//                     // problems as well, though, so this should only be
//                     // considered if this issue becomes noticeable.

//                     // Compare instructors
//                     if (section.instructors.length !==  
//                                     selection.section.instructors.length) {
//                         selection.differences.push('Instructors');
//                     } else {
//                         for (let i = 0; i < section.instructors.length; i++) {
//                             if (section.instructors[i] 
//                                         !== selection.section.instructors[i]) {
//                                 selection.differences.push('Instructors');
//                                 i = section.instructors.length;
//                             }
//                         }
//                     }
//                     // Compare class meetings
//                     if (section.class_meetings.length !==
//                                 selection.section.class_meetings.length) {
//                         selection.differences.push('Number of class meetings');
//                     } else {
//                         for (let i = 0; i < section.class_meetings.length; 
//                                                                         i++) {
//                             const storedMeeting = 
//                                         selection.section.class_meetings[i];
//                             const dataMeeting = section.class_meetings[i];
//                             if (typeof storedMeeting === 'string') {
//                                 if (storedMeeting !== dataMeeting) {
//                                     selection.differences.push(
//                                         'Type of meeting'
//                                     );
//                                 }
//                             }
//                             else if (typeof storedMeeting !== 'string' &&
//                                             typeof dataMeeting !== 'string') {
//                                 if ('OnlineSync' in storedMeeting) {
//                                     if ('OnlineSync' in dataMeeting) {
//                                         // Exception to style guide: This would look
//                                         // worse and less readable if confined to 80 cols
//                                         if (JSON.stringify(storedMeeting.OnlineSync) !==
//                                                     JSON.stringify(dataMeeting.OnlineSync)) {
//                                             selection.differences.push('Meeting time');
//                                         }
//                                     } else {
//                                         selection.differences.push(
//                                             'Type of meeting'
//                                         );
//                                     }
//                                 }
//                                 else if ('InPerson' in storedMeeting) {
//                                     if ('InPerson' in dataMeeting) {
//                                         // Exception to style guide: This would look
//                                         // worse and less readable if confined to 80 cols
//                                         if (JSON.stringify(storedMeeting.InPerson.classtime) !==
//                                                     JSON.stringify(dataMeeting.InPerson.classtime)) {
//                                             selection.differences.push('Meeting time');
//                                         }
//                                         if (JSON.stringify(storedMeeting.InPerson.location) !==
//                                                     JSON.stringify(dataMeeting.InPerson.location)) {
//                                             selection.differences.push('Meeting location');
//                                         }
//                                     }
//                                 }
//                             } else {
//                                 selection.differences.push('Type of meeting');
//                             }
//                         }
//                     }
//                     selection.section = section;
//                     result.push(selection);
//                 }
//             } else if (course && course.sections === null && 
//                             selection.section.sec_code === 'N/A') {
//                 result.push(selection);
//             }
//         }
//         selection.colorNumber = colorNumber;
//         colorNumber++;
//     });
//     return result;
// }