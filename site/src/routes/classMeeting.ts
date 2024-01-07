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