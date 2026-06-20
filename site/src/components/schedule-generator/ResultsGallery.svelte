<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import GeneratedScheduleCard from './GeneratedScheduleCard.svelte';
	import RelaxationHints from './RelaxationHints.svelte';
	import { runGeneration } from '../../lib/schedule-generator/Generate';
	import { sortedByCriterion } from '../../lib/schedule-generator/ScheduleSorter';
	import { SORT_CRITERIA, SORT_CRITERION_LABELS } from '../../lib/schedule-generator/types';
	import type { GeneratedSchedule, SortCriterion } from '../../lib/schedule-generator/types';
	import { overriddenFilterLabel } from '../../lib/schedule-generator/GeneratorFormat';
	import {
		GenerationStateStore,
		GeneratorRequirementsStore,
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

	$: sortedSchedules =
		state.kind === 'done' ? sortedByCriterion(state.schedules, sort) : ([] as GeneratedSchedule[]);
</script>

<div class="flex flex-col gap-3">
	<!-- Generate bar -->
	<div class="flex flex-row items-center gap-3">
		<button
			class="rounded-lg bg-orange px-4 py-1.5 font-semibold text-white
				hover:opacity-90 disabled:opacity-40"
			disabled={requirements.length === 0 || state.kind === 'loading'}
			on:click={() => runGeneration()}
		>
			{state.kind === 'loading' ? 'Generating…' : 'Generate schedules'}
		</button>

		{#if state.kind === 'done' && state.schedules.length > 0}
			<label class="flex flex-row items-center gap-2 text-sm">
				<span class="opacity-70">Sort by</span>
				<select
					class="rounded-md border border-outlineLight bg-bgLight
						px-2 py-1 dark:border-outlineDark dark:bg-bgDark"
					bind:value={sort}
					on:change={() => GeneratorSortStore.set(sort)}
				>
					{#each SORT_CRITERIA as criterion}
						<option value={criterion}>
							{SORT_CRITERION_LABELS[criterion]}
						</option>
					{/each}
				</select>
			</label>
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
			{#each sortedSchedules as schedule, i}
				<GeneratedScheduleCard {schedule} rank={i + 1} />
			{/each}
		</div>
	{/if}
</div>
