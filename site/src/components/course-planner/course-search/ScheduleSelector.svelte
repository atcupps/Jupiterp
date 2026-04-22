<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { AngleRightOutline, PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import {
		CurrentScheduleStore,
		NonselectedScheduleStore
	} from '../../../stores/CoursePlannerStores';
	import { clickoutside } from '@svelte-put/clickoutside';
	import ScheduleOptionsDropdown from './ScheduleOptionsDropdown.svelte';
	import { slide } from 'svelte/transition';
	import {
		deleteNonselectedSchedule,
		uniqueScheduleName
	} from '$lib/course-planner/ScheduleSelector';
	import type { ScheduleSelection, StoredSchedule } from '../../../types';

	let dropdownOpen: boolean = false;

	let currentScheduleName: string;
	let currentScheduleSelections: ScheduleSelection[];
	CurrentScheduleStore.subscribe((stored) => {
		currentScheduleName = stored.scheduleName;
		currentScheduleSelections = stored.selections;
	});

	function changeScheduleName() {
		const inputScheduleName = scheduleNameElement.value;
		if (inputScheduleName.trim().length > 0) {
			currentScheduleName = uniqueScheduleName(inputScheduleName, 'New ', nonselectedSchedules);
			CurrentScheduleStore.set({
				scheduleName: currentScheduleName,
				selections: currentScheduleSelections
			});
		} else {
			currentScheduleName = uniqueScheduleName('New schedule', 'New ', nonselectedSchedules);
			CurrentScheduleStore.set({
				scheduleName: currentScheduleName,
				selections: currentScheduleSelections
			});
		}
	}

	let scheduleNameElement: HTMLInputElement;
	$: if (currentScheduleName && scheduleNameElement) {
		scheduleNameElement.value = currentScheduleName;
	}

	let nonselectedSchedules: StoredSchedule[] = [];
	NonselectedScheduleStore.subscribe((stored) => {
		nonselectedSchedules = stored;
	});

	function changeSchedule(newSchedule: StoredSchedule) {
		const index = nonselectedSchedules.indexOf(newSchedule);
		if (index === -1) {
			// This should not be possible
			console.log('Could not find schedule: ' + newSchedule.scheduleName);
		} else {
			const scheduleToReplace: StoredSchedule = {
				scheduleName: currentScheduleName,
				selections: currentScheduleSelections
			};
			nonselectedSchedules.splice(index, 1);
			nonselectedSchedules = [scheduleToReplace, ...nonselectedSchedules];
			currentScheduleName = newSchedule.scheduleName;
			currentScheduleSelections = newSchedule.selections;

			CurrentScheduleStore.set({
				scheduleName: currentScheduleName,
				selections: currentScheduleSelections
			});

			NonselectedScheduleStore.set(nonselectedSchedules);
		}
	}

	function createNewSchedule() {
		const oldSchedule: StoredSchedule = {
			scheduleName: currentScheduleName,
			selections: currentScheduleSelections
		};
		nonselectedSchedules = [oldSchedule, ...nonselectedSchedules];
		NonselectedScheduleStore.set(nonselectedSchedules);
		currentScheduleName = uniqueScheduleName('New schedule', 'New ', nonselectedSchedules);
		currentScheduleSelections = [];
		CurrentScheduleStore.set({
			scheduleName: currentScheduleName,
			selections: currentScheduleSelections
		});
	}
</script>

<div class="flex w-full flex-col" use:clickoutside on:clickoutside={() => (dropdownOpen = false)}>
	<div class="2xl:text-md flex w-full flex-row pb-1 text-sm" title="Toggle schedule dropdown">
		<div
			class="flex grow flex-row justify-start rounded-md px-0.5 py-1
                    text-left hover:bg-hoverLight hover:dark:bg-hoverDark"
		>
			<button
				class:rotate-90={dropdownOpen}
				class="origin-center transition"
				on:click={() => (dropdownOpen = !dropdownOpen)}
			>
				<AngleRightOutline class="h-5 w-5" />
			</button>

			<input
				id="schedule-name-input"
				contenteditable="true"
				bind:this={scheduleNameElement}
				on:blur={changeScheduleName}
				title="Schedule name"
				class="2xl:text-md mr-1 grow cursor-text rounded border-none bg-bgLight px-0.5 py-0 text-sm outline-none dark:bg-bgDark"
			/>
		</div>

		<ScheduleOptionsDropdown />

		<button
			class="h-7 rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark"
			title="Create new schedule"
			on:click={createNewSchedule}
		>
			<PlusOutline class="h-5 w-5 px-0.5" />
		</button>
	</div>

	{#if dropdownOpen}
		<!-- in: and out: instead of transition: due to lag when closing dropdown if some schedule are deleted -->
		<div class="w-full pb-0.5 pl-4 pr-5" in:slide out:slide>
			{#each nonselectedSchedules as schedule}
				<div class="flex h-6 w-full flex-row">
					<button
						class="h-6 min-w-0 grow items-center rounded-md pl-1.5 text-left text-sm hover:bg-hoverLight dark:hover:bg-hoverDark"
						title={'Switch to ' + schedule.scheduleName}
						on:click={() => changeSchedule(schedule)}
					>
						<span class="no-scrollbar block w-full min-w-0 overflow-x-auto whitespace-nowrap">
							{schedule.scheduleName}
						</span>
					</button>

					<button
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark"
						title={'Delete ' + schedule.scheduleName}
						on:click={() => deleteNonselectedSchedule(schedule, nonselectedSchedules)}
					>
						<TrashBinOutline class="h-4 w-4" />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
