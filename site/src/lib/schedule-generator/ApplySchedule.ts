/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Applies a generated schedule to the course planner. The
 * planner reads its state from local storage on mount, so this writes there
 * directly (in the planner's format), saving the generated schedule as a new
 * named schedule and preserving the user's existing schedules.
 */

import { resolveSelections, resolveStoredSchedules } from '../course-planner/CourseLoad';
import { assignColorNumbers } from '../course-planner/Modernization';
import { uniqueScheduleName } from '../course-planner/ScheduleSelector';
import type { GeneratedSchedule } from './types';
import type { ScheduleBlock, StoredSchedule } from '../../types';

const SELECTIONS_KEY = 'selectedSections';
const NAME_KEY = 'scheduleName';
const NONSELECTED_KEY = 'nonselectedSchedules';

/** Read the planner's current schedule from local storage. */
function readCurrentSchedule(): StoredSchedule {
	const rawSelections = localStorage.getItem(SELECTIONS_KEY);
	const selections: ScheduleBlock[] = rawSelections ? resolveSelections(rawSelections) : [];
	const scheduleName = localStorage.getItem(NAME_KEY) ?? 'Schedule 1';
	return { scheduleName, selections };
}

/** Read the planner's non-selected schedules from local storage. */
function readNonselectedSchedules(): StoredSchedule[] {
	const raw = localStorage.getItem(NONSELECTED_KEY);
	return raw ? resolveStoredSchedules(raw) : [];
}

/**
 * Save `schedule` into the planner as a new named schedule (e.g. "Generated
 * 1"), demoting the user's existing active schedule to a saved one if it had
 * any selections. Returns the name assigned to the new schedule.
 */
export function applyGeneratedSchedule(schedule: GeneratedSchedule): string {
	const current = readCurrentSchedule();
	const nonselected = readNonselectedSchedules();

	// Preserve the existing active schedule alongside the others.
	const preserved = current.selections.length > 0 ? [current, ...nonselected] : nonselected;

	const name = uniqueScheduleName('Generated 1', 'New ', [current, ...nonselected]);

	const selections = assignColorNumbers(schedule.selections);

	localStorage.setItem(SELECTIONS_KEY, JSON.stringify(selections));
	localStorage.setItem(NAME_KEY, name);
	localStorage.setItem(NONSELECTED_KEY, JSON.stringify(preserved));

	return name;
}
