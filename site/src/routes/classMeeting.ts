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
    '#FFD1DC',
    '#FDFD96',
    '#77DD77',
    '#AEC6CF',
    '#C3B1E1',
    '#FFB347',
    '#FF6961',
    '#CBF7D4',
    '#E6CDE3',
    '#FEDFCC',
];
export function getColorFromNumber(num: number): string {
    return colorMapping[num];
}