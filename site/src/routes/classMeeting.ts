export function timeToNumber(time: TimeComponent[]): number {
    let result: number = 0;
    if (typeof time[0] == 'number') {
        result += time[0];
    }
    if (typeof time[1] == 'number') {
        result += time[1] / 60;
    }
    if (time[2] === 'Pm') {
        result += 12;
    }
    return result;
}