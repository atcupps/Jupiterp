export function formatClasstime(time: Classtime): string {
    let days: string = time.days;
    let startTimeArray: TimeComponent[] = time.start_time;
    let startTime: string = startTimeArray[0] + ':' 
        + formatMinutes(startTimeArray[1]) + ' '
        + formatAmPm(startTimeArray[2]);
    let endTimeArray: TimeComponent[] = time.end_time;
    let endTime: string = endTimeArray[0] + ':'
        + formatMinutes(endTimeArray[1]) + ' '
        + formatAmPm(endTimeArray[2]);
    return days + ' ' + startTime + ' - ' + endTime;
}

function formatMinutes(minutesAsTC: TimeComponent): string {
    let minutes: number = typeof minutesAsTC === 'number' ? minutesAsTC : 0;
    if (minutes < 10) {
        return '0' + minutes;
    } else {
        return minutes.toString();
    }
}

function formatAmPm(AmPmAsTC: TimeComponent): String {
    let AmPm: string = typeof AmPmAsTC === 'string' ? AmPmAsTC : 'Am';
    switch (AmPm) {
        case 'Am':
            return 'am';
            break;
        case 'Pm':
            return 'pm';
            break;
    }
    throw new Error("Unknown Am/Pm code");
}
