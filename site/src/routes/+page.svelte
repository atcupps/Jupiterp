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
		ensureUpToDateAndSetStores,
		resolveSelections,
		resolveStoredSchedules
	} from '../lib/course-planner/CourseLoad';
	import { getProfsLookup } from '$lib/course-planner/CourseSearch';
	import { handlePlannerShortcutKeydown } from '../lib/course-planner/PlannerShortcuts';
	import {
		ProfsLookupStore,
		CurrentScheduleStore,
		NonselectedScheduleStore,
		DepartmentsStore
	} from '../stores/CoursePlannerStores';
	import { client } from '$lib/client';
	import {
		type Instructor,
		type InstructorsConfig,
		type InstructorsResponse
	} from '@jupiterp/jupiterp';
	import type { ScheduleSelection, StoredSchedule } from '../types';
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

	// Function to retrieve professor data; called in `onMount`.
	async function fetchProfessorData() {
		try {
			let limit = 500;
			let offset = 0;
			let allInstructors: Instructor[] = [];
			let config: InstructorsConfig = {
				limit: limit,
				offset: offset
			};
			let complete = false;
			while (!complete) {
				const response: InstructorsResponse = await client.activeInstructors(config);
				if (response.ok() && response.data != null) {
					allInstructors = [...allInstructors, ...response.data];
					if (response.data.length < limit) {
						complete = true;
						break;
					}
					offset += limit;
					config.offset = offset;
				} else {
					// format-check exempt 1
					throw new Error(
						`Failed to fetch data: ${response.statusCode} ${response.statusMessage} ${response.errorBody}`
					);
				}
			}

			// Update the ProfsLookupStore with the fetched data
			ProfsLookupStore.set(getProfsLookup(allInstructors));
		} catch (error) {
			console.error('Error fetching professor data:', error);
		}
	}

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
		fetchProfessorData();

		// Fetch department codes from API
		fetchDeptCodes();

		// Retrieve data from client local storage
		try {
			if (typeof window !== 'undefined') {
				// Get stored selections from local storage
				const storedSelectionsOption = localStorage.getItem('selectedSections');
				let storedSelections: ScheduleSelection[];
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

				// Find differences between stored selections and
				// most up-to-date course data, and update accordingly.
				ensureUpToDateAndSetStores(currentSchedule, storedNonselectedSchedules);

				hasReadLocalStorage = true;
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

	function jsonifySections(sections: ScheduleSelection[]): string {
		let finalSelections: ScheduleSelection[] = [];
		for (let section of sections) {
			if (!section.hover) {
				finalSelections.push(section);
			}
		}
		return JSON.stringify(finalSelections);
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
