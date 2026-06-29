<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	// format-check exempt 2
	import Schedule from '../components/course-planner/schedule/Schedule.svelte';
	import CourseSearch from '../components/course-planner/course-search/CourseSearch.svelte';
	import { onMount } from 'svelte';
	import {
		applySharedScheduleToStores,
		ensureUpToDateAndSetStores,
		resolveSelections,
		resolveStoredSchedules
	} from '../lib/course-planner/CourseLoad';
	import { SHARE_PARAM } from '$lib/course-planner/ShareLink';
	import { loadInstructorLookup } from '$lib/course-planner/CourseSearch';
	import { handlePlannerShortcutKeydown } from '../lib/course-planner/PlannerShortcuts';
	import {
		CurrentScheduleStore,
		NonselectedScheduleStore,
		DepartmentsStore
	} from '../stores/CoursePlannerStores';
	import { client } from '$lib/client';
	import type { ScheduleBlock, StoredSchedule } from '../types';
	import IsDesktop from '../components/course-planner/IsDesktop.svelte';
	import { PlannerState } from '../stores/CoursePlannerStores';

	let isDesktop: boolean = false;
	let plannerContainer: HTMLDivElement | null = null;

	$: PlannerState.update(
		(state: { isDesktop: boolean; chainScrollParent: HTMLElement | null }) => ({
			...state,
			isDesktop,
			chainScrollParent: plannerContainer
		})
	);

	// Function to get list of department codes as an array of strings
	// and set the DepartmentsStore.
	async function fetchDeptCodes() {
		const res = await client.deptList();
		if (res.ok() && res.data != null) {
			const depts = res.data;
			DepartmentsStore.set(depts);
		} else {
			console.error('Error fetching department codes:', res.errorBody);
		}
	}

	// Keep track of chosen sections
	let currentSchedule: StoredSchedule;
	let hasReadLocalStorage: boolean = false;
	CurrentScheduleStore.subscribe((stored) => {
		if (hasReadLocalStorage) {
			currentSchedule = stored;

			// Save to local storage
			if (currentSchedule) {
				if (typeof window !== 'undefined') {
					localStorage.setItem('selectedSections', jsonifySections(currentSchedule.selections));
					localStorage.setItem('scheduleName', currentSchedule.scheduleName);
				}
			}
		}
	});

	let nonselectedSchedules: StoredSchedule[];
	// Save non-selected schedules to local storage
	NonselectedScheduleStore.subscribe((stored) => {
		if (hasReadLocalStorage) {
			nonselectedSchedules = stored;

			// Save to local storage
			if (nonselectedSchedules) {
				if (typeof window !== 'undefined') {
					localStorage.setItem('nonselectedSchedules', JSON.stringify(nonselectedSchedules));
				}
			}
		}
	});

	onMount(() => {
		// Fetch instructor data from API
		loadInstructorLookup();

		// Fetch department codes from API
		fetchDeptCodes();

		// Retrieve data from client local storage
		try {
			if (typeof window !== 'undefined') {
				// Get stored selections from local storage
				const storedSelectionsOption = localStorage.getItem('selectedSections');
				let storedSelections: ScheduleBlock[];
				if (storedSelectionsOption) {
					storedSelections = resolveSelections(storedSelectionsOption);
				} else {
					storedSelections = [];
				}

				// Get stored current schedule name from local storage
				const storedScheduleNameOption = localStorage.getItem('scheduleName');
				let storedScheduleName: string;
				if (storedScheduleNameOption) {
					storedScheduleName = storedScheduleNameOption;
				} else {
					storedScheduleName = 'Schedule 1';
				}

				const currentSchedule: StoredSchedule = {
					scheduleName: storedScheduleName,
					selections: storedSelections
				};

				// Get stored non-selected schedules from local storage
				const storedNonselectedSchedulesOption = localStorage.getItem('nonselectedSchedules');
				let storedNonselectedSchedules: StoredSchedule[];
				if (storedNonselectedSchedulesOption) {
					storedNonselectedSchedules = resolveStoredSchedules(storedNonselectedSchedulesOption);
				} else {
					storedNonselectedSchedules = [];
				}

				// Allow store subscriptions to persist whatever we load below.
				hasReadLocalStorage = true;

				// If the page was opened from a shared link, load that schedule
				// as a new named schedule (preserving the user's own), then
				// strip the param so a refresh doesn't re-import it.
				const shareParam = new URLSearchParams(window.location.search).get(SHARE_PARAM);
				if (shareParam) {
					(async () => {
						const consumed = await applySharedScheduleToStores(
							shareParam,
							currentSchedule,
							storedNonselectedSchedules
						);
						if (consumed) {
							// Strip the param so a refresh doesn't re-import; on a
							// transient fetch failure (consumed === false) keep it so
							// a refresh can retry.
							const cleanUrl = window.location.pathname + window.location.hash;
							window.history.replaceState(window.history.state, '', cleanUrl);
						}
					})().catch((e) => console.error('Failed to apply shared schedule:', e));
				} else {
					// Find differences between stored selections and
					// most up-to-date course data, and update accordingly.
					ensureUpToDateAndSetStores(currentSchedule, storedNonselectedSchedules);
				}
			}
		} catch (e) {
			console.log('Unable to retrieve courses: ' + e);
			CurrentScheduleStore.set({
				scheduleName: 'Schedule 1',
				selections: []
			});
			NonselectedScheduleStore.set([]);
		}
	});

	function jsonifySections(sections: ScheduleBlock[]): string {
		return JSON.stringify(sections.filter((s) => !('course' in s) || !s.hover));
	}

	function handlePlannerKeydown(event: KeyboardEvent) {
		handlePlannerShortcutKeydown(event, isDesktop);
	}
</script>

<IsDesktop bind:isDesktop />

<svelte:window on:keydown={handlePlannerKeydown} />

<div
	id="planner-container"
	bind:this={plannerContainer}
	class="custom-scrollbar fixed bottom-0 top-12 w-full flex-col overflow-y-auto px-3 lg:grid lg:grid-cols-[22rem_1fr]"
>
	<Schedule />
	<CourseSearch />
</div>
