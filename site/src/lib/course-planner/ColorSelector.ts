import type { ScheduleBlock } from '../../types';

export function firstAvailableColor(selections: ScheduleBlock[]): number {
	const unavailableColors = selections.map((s) => s.colorNumber).sort((a, b) => a - b);
	let result = 0;
	for (const c of unavailableColors) {
		if (c === result) result++;
		else break;
	}
	return result;
}
