<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import CalendarView from './CalendarView.svelte';
	import {
		ActiveViewerStore,
		CurrentScheduleStore,
		NonselectedScheduleStore,
		ViewerNoticeStore,
		ViewerOptionsStore,
		type ViewerOption
	} from '../../../stores/CoursePlannerStores';
	import type { StoredSchedule } from '../../../types';
	import { totalTakenCreditsAcrossSchedules } from '$lib/gened/schedules';

	let currentSchedule: StoredSchedule = {
		scheduleName: 'Schedule 1',
		selections: [],
		term: 'Fall',
		year: new Date().getFullYear()
	};
	let printedOn = '';
	let activeViewer = 'self';
	let viewerOptions: ViewerOption[] = [];
	let viewerNotice: string | null = null;
	let nonselectedSchedules: StoredSchedule[] = [];
	let totalTakenCredits = 0;

	CurrentScheduleStore.subscribe((stored) => {
		currentSchedule = stored;
	});

	ActiveViewerStore.subscribe((stored) => {
		activeViewer = stored;
	});

	ViewerOptionsStore.subscribe((stored) => {
		viewerOptions = stored;
	});

	ViewerNoticeStore.subscribe((stored) => {
		viewerNotice = stored;
	});

	NonselectedScheduleStore.subscribe((stored) => {
		nonselectedSchedules = stored;
	});

	$: printedOn = new Date().toLocaleDateString();
	$: totalTakenCredits = totalTakenCreditsAcrossSchedules([
		currentSchedule,
		...nonselectedSchedules
	]);

	function rowCredits(schedule: StoredSchedule): number {
		let total = 0;
		for (const selection of schedule.selections) {
			total += selection.course.minCredits;
		}
		return total;
	}

	function exportCurrentToPdf() {
		window.print();
	}

	function onViewerChanged(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;
		ActiveViewerStore.set(target.value);
	}
</script>

<section class="schedule-print-pane flex min-h-0 min-w-0 grow flex-col">
	<div class="schedule-screen-header flex items-center justify-between gap-2 px-2 pb-2">
		<div>
			<div class="text-lg font-semibold">{currentSchedule.scheduleName}</div>
			<div class="text-xs opacity-70">
				{currentSchedule.term}
				{currentSchedule.year} · Credits {rowCredits(currentSchedule)}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span
				class="rounded-full border border-outlineLight px-2
                         py-1 text-xs dark:border-outlineDark"
			>
				Total taken: {totalTakenCredits} credits
			</span>
			<label class="flex items-center gap-1 text-xs opacity-80">
				<span>Viewing:</span>
				<select
					class="rounded-md border border-outlineLight bg-bgLight px-2
                                py-1 text-xs
                                dark:border-outlineDark dark:bg-bgDark"
					value={activeViewer}
					on:change={onViewerChanged}
				>
					{#each viewerOptions as option}
						<option value={option.id}>{option.label}</option>
					{/each}
				</select>
			</label>
			<button
				class="rounded-md border border-outlineLight px-3 py-1
                            text-sm hover:bg-hoverLight
                            dark:border-outlineDark dark:hover:bg-hoverDark"
				class:export-button={true}
				on:click={exportCurrentToPdf}
			>
				Export to PDF
			</button>
		</div>
	</div>
	{#if viewerNotice}
		<div class="px-2 pb-2 text-xs opacity-80">
			{viewerNotice}
		</div>
	{/if}
	<div class="schedule-page min-h-0 grow overflow-auto">
		<div class="print-only pb-3 text-left">
			<h1 class="text-xl font-semibold leading-tight">
				{currentSchedule.scheduleName} — {currentSchedule.term}
				{currentSchedule.year}
			</h1>
			<p class="text-sm opacity-70">
				{rowCredits(currentSchedule)} credits · {currentSchedule.selections.length} courses · Printed
				{printedOn}
			</p>
		</div>
		<CalendarView />
	</div>
</section>
