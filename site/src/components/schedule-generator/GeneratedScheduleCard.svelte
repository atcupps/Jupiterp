<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import MiniSchedule from './MiniSchedule.svelte';
	import { applyGeneratedSchedule } from '../../lib/schedule-generator/ApplySchedule';
	import { formatCredits } from '../../lib/course-planner/Formatting';
	import type { GeneratedSchedule } from '../../lib/schedule-generator/types';

	export let schedule: GeneratedSchedule;
	export let rank: number;

	$: metrics = schedule.metrics;

	function formatGap(minutes: number): string {
		if (minutes === 0) {
			return 'none';
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours === 0) {
			return `${mins}m`;
		}
		return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
	}

	function apply() {
		applyGeneratedSchedule(schedule);
		goto('/');
	}
</script>

<div
	class="flex flex-col gap-2 rounded-xl border border-divBorderLight
		bg-bgLight p-3 shadow-sm dark:border-divBorderDark dark:bg-bgDark"
>
	<div class="flex flex-row items-center justify-between">
		<span class="text-sm font-semibold opacity-60">#{rank}</span>
		<button
			class="rounded-md border border-orange px-3 py-1 text-sm font-semibold
				text-orange enabled:hover:bg-orange enabled:hover:text-white"
			on:click={apply}
			title="Open this schedule in the planner"
		>
			Apply
		</button>
	</div>

	<MiniSchedule selections={schedule.selections} />

	<div class="flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
		<span>
			{metrics.sectionCount} class{metrics.sectionCount === 1 ? '' : 'es'}
		</span>
		<span>
			{formatCredits(metrics.minCredits, metrics.maxCredits)} cr
		</span>
		<span>{metrics.daysWithClasses} days</span>
		<span>Gaps: {formatGap(metrics.totalGapMinutes)}</span>
		<span>
			{#if metrics.avgInstructorRating !== null}
				★ {metrics.avgInstructorRating.toFixed(1)}
				({metrics.ratedSectionCount}/{metrics.sectionCount} rated)
			{:else}
				Unrated
			{/if}
		</span>
	</div>
</div>
