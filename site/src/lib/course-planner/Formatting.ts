/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Functions for formatting various Jupiterp objects as strings.
 */

/**
 * Format a `Classtime` as a `string`, including the days
 * @param time A `Classtime` to be formatted
 * @returns A `string` representation of `time`, including days
 */
export function formatClassDayTime(time: Classtime): string {
    return time.days + ' ' + formatClasstime(time);
}

/**
 * Format a `Classtime` as a `string`
 * 
 * @param time A `Classtime` to be formatted
 * 
 * @returns A `string` representation of `time`
 */
export function formatClasstime(time: Classtime): string {
    const startTimeArray: TimeComponent[] = time.start_time;
    const startTime: string = startTimeArray[0] + ':' 
        + formatMinutes(startTimeArray[1])
        + formatAmPm(startTimeArray[2]);
    const endTimeArray: TimeComponent[] = time.end_time;
    const endTime: string = endTimeArray[0] + ':'
        + formatMinutes(endTimeArray[1])
        + formatAmPm(endTimeArray[2]);
    return startTime + ' - ' + endTime;
}

/**
 * Format a `TimeComponent` as a `string` assuming it to be some number of
 * minutes in an hour.
 * 
 * @param minutesAsTC A `TimeComponent` representing the number of minutes in
 *                      an hour of a `Classtime`.
 * 
 * @returns A string representing `minutesAsTC` as some number of minutes.
 */
function formatMinutes(minutesAsTC: TimeComponent): string {
    const minutes: number = typeof minutesAsTC === 'number' ? minutesAsTC : 0;
    if (minutes < 10) {
        return '0' + minutes;
    } else {
        return minutes.toString();
    }
}

/**
 * Format an `AmPm` `TimeComponent` as a `string`
 * 
 * @param AmPmAsTC A `TimeComponent` which is assumed to be either 'Am` or `Pm`
 * 
 * @returns A `TimeComponent` formatted as either `'am'` or `'pm'`
 */
function formatAmPm(AmPmAsTC: TimeComponent): string {
    const AmPm: string = typeof AmPmAsTC === 'string' ? AmPmAsTC : 'Am';
    switch (AmPm) {
        case 'Am':
            return 'am';
        case 'Pm':
            return 'pm';
    }
    throw new Error('Unknown Am/Pm code');
}

/**
 * Formats a `CreditCount` as a `string`
 * @param credits A `CreditCount` to be formatted
 * @returns `credits` formatted as a string
 */
export function formatCredits(credits: CreditCount): string {
    if ('Amount' in credits) {
        return credits.Amount.toString();
    } else {
        return credits.Range[0] + ' - ' + credits.Range[1];
    }
}

/**
 * Formats `location` as a `string`
 * @param location A `string[]` where `string[0]` is a building code and
 *                  `string[1]` is a room code; ex: `['IRB', '2107']`
 * @returns `location` formatted as a `string`
 */
export function formatLocation(location: string[]): string {
    return location[0] + ' ' + location[1]
}

/**
 * Formats `instructors` as a single `string`
 * @param instructors An array of `string`s, each representing an instructor
 * @returns Instructors formatted as a single `string`
 */
export function formatInstructors(instructors: string[]): string {
    return instructors.join(', ');
}

/**
 * Generates a link to the UMD Testudo page for a given course code
 * @param courseCode The course code for which to generate a link
 */
export function testudoLink(courseCode: string): string {
    return 'https://app.testudo.umd.edu/soc/search?courseId=' + courseCode + '&sectionId=&termId=202408&_openSectionsOnly=on&creditCompare=%3E%3D&credits=0.0&courseLevelFilter=ALL&instructor=&_facetoface=on&_blended=on&_online=on&courseStartCompare=&courseStartHour=&courseStartMin=&courseStartAM=&courseEndHour=&courseEndMin=&courseEndAM=&teachingCenter=ALL&_classDay1=on&_classDay2=on&_classDay3=on&_classDay4=on&_classDay5=on'
}

/**
 * Splits a `code` into its four letter department code and three numbers
 * as a single string, space delimited.
 * Example: `splitCourseCode('CMSC424') --> 'CMSC 424'
 * @param code A `string` code to split apart
 * @returns `code` split into 
 */
export function splitCourseCode(code: string): string {
    return code.slice(0, 4) + ' ' + code.slice(4);
}