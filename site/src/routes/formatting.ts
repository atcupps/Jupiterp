/**
 * This file is part of Jupiterp: https://github.com/atcupps/Jupiterp
 * 
 * @fileoverview Functions for formatting various Jupiterp objects as strings.
 */

/**
 * Format a `Classtime` as a `string`
 * 
 * @param time A `Classtime` to be formatted
 * 
 * @returns A `string` representation of `time`
 */
export function formatClasstime(time: Classtime): string {
    const days: string = time.days;
    const startTimeArray: TimeComponent[] = time.start_time;
    const startTime: string = startTimeArray[0] + ':' 
        + formatMinutes(startTimeArray[1]) + ' '
        + formatAmPm(startTimeArray[2]);
    const endTimeArray: TimeComponent[] = time.end_time;
    const endTime: string = endTimeArray[0] + ':'
        + formatMinutes(endTimeArray[1]) + ' '
        + formatAmPm(endTimeArray[2]);
    return days + ' ' + startTime + ' - ' + endTime;
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
            break;
        case 'Pm':
            return 'pm';
            break;
    }
    throw new Error('Unknown Am/Pm code');
}
