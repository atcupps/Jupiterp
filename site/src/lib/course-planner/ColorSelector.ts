
// TODO: this is for later so that both user and class events can have the same color generator

// export function firstAvailableColor(selections: ScheduleSelection[]): number {
//     let unavailableColors: number[] = [];
//     selections.forEach((selection) => {
//         unavailableColors.push(selection.colorNumber);
//     });
//     unavailableColors.sort((a, b) => a - b);
//     let result: number = 0;
//     while (result < unavailableColors.length && unavailableColors[result] === result) {
//         result += 1;
//     }
//     return result;
// }