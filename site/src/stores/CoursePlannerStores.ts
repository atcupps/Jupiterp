/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import type { Course, Department, Instructor } from '@jupiterp/jupiterp';
import { writable, type Writable } from 'svelte/store';
import type { CourseSectionPair, FilterParams, ScheduleSelection, StoredSchedule } from '../types';
import { getDefaultTermYear } from '$lib/course-planner/Terms';
import type { FriendVisibility } from '$lib/friends/types';
import type { AcademicTerm } from '$lib/course-planner/Terms';

/** `Record<string, Instructor>` for getting instructor data from names
/* Initially set to an empty record since the data used here is
/* loaded in `+page.svelte`.
 */
export const ProfsLookupStore: Writable<Record<string, Instructor>> = writable({});

/** Track which section is being hovered by the user in Course Search */
export const HoveredSectionStore: Writable<ScheduleSelection | null> = writable(null);

/** Track selected sections in current schedule */
const defaultTermYear = getDefaultTermYear();
export const CurrentScheduleStore: Writable<StoredSchedule> = writable({
	scheduleName: 'Schedule 1',
	selections: [],
	term: defaultTermYear.term,
	year: defaultTermYear.year
});

/** Track stored schedules that are not the active current schedule */
export const NonselectedScheduleStore: Writable<StoredSchedule[]> = writable([]);

// Track current course displayed in course info section
export const CourseInfoPairStore: Writable<CourseSectionPair | null> = writable(null);
/** List of departments */
export const DepartmentsStore: Writable<Department[]> = writable([]);

/** Search results */
export const SearchResultsStore: Writable<Course[]> = writable([]);

/** Potential department suggestions for partial searches */
export const DeptSuggestionsStore: Writable<string[]> = writable([]);

/** Filter parameters for course search */
export const CourseSearchFilterStore: Writable<FilterParams> = writable({
	serverSideFilters: {},
	clientSideFilters: {}
});

export interface ResolvedSearchTermYear {
	term: AcademicTerm;
	year: number;
	semester: string;
}

export const ResolvedSearchTermYearStore: Writable<ResolvedSearchTermYear | null> = writable(null);

export interface ViewerOption {
	id: string;
	label: string;
	type: 'self' | 'friend';
}

export const ViewerOptionsStore: Writable<ViewerOption[]> = writable([
	{
		id: 'self',
		label: 'You',
		type: 'self'
	}
]);

export const ActiveViewerStore: Writable<string> = writable('self');

export const ScheduleReadOnlyStore: Writable<boolean> = writable(false);

export const ScheduleVisibilityStore: Writable<FriendVisibility> = writable('full');

export const ViewerNoticeStore: Writable<string | null> = writable(null);
