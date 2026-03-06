/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

/* Colors for courses on the Schedule */
const colorMapping = [
    '#7FA0E0',
    '#E07F7F',
    '#E0DA7F',
    '#7FE0CF',
    '#B97FE0',
    '#86E07F',
    '#E0A86F',
    '#E07FB5',
    '#C9A6C1',
    '#E6BFA5',
    '#6FC1E0',
    '#E6A6D6',
    '#8F84E0',
    '#B6E07F',
    '#6FD3E0',
    '#E0977F',
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