<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import GeneratedScheduleCard from './GeneratedScheduleCard.svelte';
	import GeneratorSelect from './GeneratorSelect.svelte';
	import RelaxationHints from './RelaxationHints.svelte';
	import { runGeneration } from '../../lib/schedule-generator/Generate';
	import { sortedByCriterion } from '../../lib/schedule-generator/ScheduleSorter';
	import { SORT_CRITERIA, SORT_CRITERION_LABELS } from '../../lib/schedule-generator/types';
	import type { GeneratedSchedule, SortCriterion } from '../../lib/schedule-generator/types';
	import { overriddenFilterLabel } from '../../lib/schedule-generator/GeneratorFormat';
	import {
		GenerationStateStore,
		GeneratorRequirementsStore,
		GeneratorSortChosenByUserStore,
		GeneratorSortStore,
		type GenerationState,
		type GeneratorRequirement
	} from '../../stores/GeneratorStores';

	let state: GenerationState = { kind: 'idle' };
	GenerationStateStore.subscribe((s) => {
		state = s;
	});

	let sort: SortCriterion = 'bestRating';
	GeneratorSortStore.subscribe((s) => {
		sort = s;
	});

	let requirements: GeneratorRequirement[] = [];
	GeneratorRequirementsStore.subscribe((r) => {
		requirements = r;
	});

	// Render results in pages so a large result set (up to 1000 schedules,
	// each a small grid) never blocks the main thread on first paint.
	const PAGE_SIZE = 12;
	let visibleCount = PAGE_SIZE;
	// Reset the visible window whenever a new generation completes.
	$: if (state) {
		visibleCount = PAGE_SIZE;
	}

	$: sortedSchedules =
		state.kind === 'done' ? sortedByCriterion(state.schedules, sort) : ([] as GeneratedSchedule[]);
	$: visibleSchedules = sortedSchedules.slice(0, visibleCount);

	const sortOptions = SORT_CRITERIA.map((criterion) => ({
		value: criterion,
		label: SORT_CRITERION_LABELS[criterion]
	}));

	function setSort(value: string) {
		GeneratorSortChosenByUserStore.set(true);
		GeneratorSortStore.set(value as SortCriterion);
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Generate bar  -->
	<div class="flex flex-row items-center gap-3">
		<button
			class="rounded-lg border border-orange px-4 py-1.5 font-semibold text-orange
				enabled:hover:bg-orange enabled:hover:text-white disabled:opacity-40"
			disabled={requirements.length === 0 || state.kind === 'loading'}
			on:click={() => runGeneration()}
		>
			{state.kind === 'loading' ? 'Generating…' : 'Generate schedules'}
		</button>

		{#if state.kind === 'done' && state.schedules.length > 0}
			<div class="flex flex-row items-center gap-2 text-sm">
				<span class="opacity-70">Sort by</span>
				<GeneratorSelect
					options={sortOptions}
					value={sort}
					onChange={setSort}
					buttonClass="min-w-36"
					title="Sort schedules by"
				/>
			</div>
		{/if}
	</div>

	{#if state.kind === 'idle'}
		<p class="py-8 text-center text-sm opacity-60">
			Add courses and set any constraints, then generate schedules.
		</p>
	{:else if state.kind === 'failed'}
		<div
			class="rounded-lg border border-orange bg-lightOrange
				bg-opacity-30 px-3 py-2 text-sm"
		>
			{state.message}
		</div>
	{:else if state.kind === 'noSchedules'}
		<RelaxationHints
			hints={state.hints}
			coursesWithNoValidSections={state.coursesWithNoValidSections}
		/>
	{:else if state.kind === 'done'}
		{#if state.truncated}
			<div class="text-xs italic opacity-60">
				Showing the first {state.schedules.length} schedules; more exist. Add constraints to narrow them
				down.
			</div>
		{/if}

		{#if state.pinNotices.length > 0}
			<div
				class="flex flex-col gap-1 rounded-lg border border-orange
					bg-lightOrange bg-opacity-20 px-3 py-2 text-xs"
			>
				{#each state.pinNotices as notice}
					<div>
						<span class="font-semibold">
							{notice.courseCode} ({notice.sectionCode})
						</span>
						was pinned even though it
						{notice.overriddenFilters.map(overriddenFilterLabel).join(', ')}.
					</div>
				{/each}
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
			{#each visibleSchedules as schedule, i}
				<GeneratedScheduleCard {schedule} rank={i + 1} />
			{/each}
		</div>

		{#if visibleCount < sortedSchedules.length}
			<button
				class="mx-auto mt-1 rounded-lg border border-outlineLight px-4
					py-1.5 text-sm hover:border-orange hover:text-orange
					dark:border-outlineDark"
				on:click={() => (visibleCount += PAGE_SIZE)}
			>
				Show more ({sortedSchedules.length - visibleCount} more)
			</button>
		{/if}
	{/if}
</div>
