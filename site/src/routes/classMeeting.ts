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
    '#dfa8e6',
    '#E6CDE3',
    '#FEDFCC',
];
export function getColorFromNumber(num: number): string {
    return colorMapping[num];
}