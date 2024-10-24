/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

/**
 * Takes an array of three `TimeComponent`s representing a time as an hour,
 * minute, and am/pm, and returns a number in 24 hour time. For example,
 * inputting the equivalent of 10:00am would return 10; 1:30pm would return
 * 13.5. This function assumes `time` does not represent a time from midnight
 * to 1 am.
 * @param time A `TimeComponent[]` representing hours, minutes, and am/pm.
 * @returns A numerical equivalent of `time`
 */
export function timeToNumber(time: TimeComponent[]): number {
    let result: number = 0;
    if (typeof time[0] == 'number') {
        result += time[0];
    }
    if (typeof time[1] == 'number') {
        result += time[1] / 60;
    }
    if (time[2] === 'Pm' && time[0] != 12) {
        result += 12;
    }
    return result;
}

/* Colors for courses on the Schedule */
const colorMapping = [
    '#B3C8F2',
    '#F2B3B3',
    '#F2EFB3',
    '#B3F2E6',
    '#DEB3F2',
    '#B8F2B3',
    '#f2c996',
    '#EDAFD6',
    '#E6CDE3',
    '#FEDFCC',
    '#ADE0F6',
    '#FDD4F3',
    '#C4BBF1',
    '#D3F4BA',
    '#AAEFF4',
    '#FFC6B0',
];

/**
 * Gets the color hex code from a `num` index; used to assign colors to
 * courses to differentiate them on the Schedule.
 * @params num A key to get a color
 * @returns A hex code color string
 */
export function getColorFromNumber(num: number): string {
    return colorMapping[num % colorMapping.length];
}