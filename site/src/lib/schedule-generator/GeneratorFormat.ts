/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Presentation helpers for the schedule generator: converting
 * between minutes-since-midnight and time-input strings, labelling days,
 * overridden filters, and relaxation hints.
 */

import type { EngineDay, OverriddenFilter, Relaxation } from './types';

/** Days of the week in display order. */
export const ENGINE_DAYS: EngineDay[] = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

const DAY_LONG: Record<EngineDay, string> = {
	M: 'Monday',
	Tu: 'Tuesday',
	W: 'Wednesday',
	Th: 'Thursday',
	F: 'Friday',
	Sa: 'Saturday',
	Su: 'Sunday'
};

/** Full day name, e.g. "Friday". */
export function engineDayLong(day: EngineDay): string {
	return DAY_LONG[day];
}

/** Format minutes-since-midnight as a 12-hour time, e.g. 570 -> "9:00 AM". */
export function minutesToLabel(minutes: number): string {
	const hour24 = Math.floor(minutes / 60);
	const minute = minutes % 60;
	const period = hour24 < 12 ? 'AM' : 'PM';
	let hour12 = hour24 % 12;
	if (hour12 === 0) {
		hour12 = 12;
	}
	const mm = minute.toString().padStart(2, '0');
	return `${hour12}:${mm} ${period}`;
}

/** Format minutes-since-midnight as a 24-hour `<input type="time">` value. */
export function minutesToTimeInput(minutes: number | null): string {
	if (minutes === null) {
		return '';
	}
	const hh = Math.floor(minutes / 60)
		.toString()
		.padStart(2, '0');
	const mm = (minutes % 60).toString().padStart(2, '0');
	return `${hh}:${mm}`;
}

/** Parse an `<input type="time">` value ("HH:MM") to minutes, or null. */
export function timeInputToMinutes(value: string): number | null {
	if (!value) {
		return null;
	}
	const parts = value.split(':');
	if (parts.length !== 2) {
		return null;
	}
	const hours = parseInt(parts[0], 10);
	const minutes = parseInt(parts[1], 10);
	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		return null;
	}
	return hours * 60 + minutes;
}

/** A short, human-readable label for an overridden per-section filter. */
export function overriddenFilterLabel(filter: OverriddenFilter): string {
	switch (filter) {
		case 'earliestStart':
			return 'starts earlier than your earliest-start time';
		case 'latestEnd':
			return 'ends later than your latest-end time';
		case 'dayOff':
			return 'meets on a day you marked off';
		case 'openSeats':
			return 'has no open seats';
	}
}

/** A short call-to-action describing a single constraint relaxation. */
export function relaxationLabel(relaxation: Relaxation): string {
	switch (relaxation.kind) {
		case 'earliestStart':
			return 'Allow earlier classes';
		case 'latestEnd':
			return 'Allow later classes';
		case 'dayOff':
			return relaxation.day
				? `Allow ${engineDayLong(relaxation.day)} classes`
				: 'Allow classes on a day off';
		case 'openSeats':
			return 'Include full (closed) sections';
		case 'minGap':
			return 'Remove the minimum gap between classes';
		case 'minCredits':
			return 'Allow fewer credits';
	}
}
