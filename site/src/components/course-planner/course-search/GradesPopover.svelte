<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import {
		formatSemester,
		gpaTier,
		type GpaTier,
		type GradeDistribution
	} from '$lib/course-planner/Grades';
	import GradeDistributionBars from './GradeDistributionBars.svelte';

	/** Professor name or course code shown at the top of the popover */
	export let heading: string;
	export let distribution: GradeDistribution;
	/** Link to the relevant PlanetTerp page for attribution */
	export let ptLink: string;

	// Static tier -> class map; Tailwind requires literal class names
	const tierClasses: Record<GpaTier, string> = {
		good: 'text-gpaGoodLight dark:text-gpaGoodDark',
		mid: 'text-gpaMidLight dark:text-gpaMidDark',
		low: 'text-gpaLowLight dark:text-gpaLowDark'
	};

	$: semesterRange =
		distribution.earliestSemester != null && distribution.latestSemester != null
			? distribution.earliestSemester === distribution.latestSemester
				? formatSemester(distribution.earliestSemester)
				: formatSemester(distribution.earliestSemester) +
					' – ' +
					formatSemester(distribution.latestSemester)
			: null;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- right-0: opens leftward so the search results scroll container
    (overflow clips on the right) cannot cut the popover off -->
<div
	class="absolute right-0 top-full z-50 mt-1 w-56 cursor-default rounded-lg
        border-2 border-outlineLight bg-bgLight p-2 text-left font-normal
        normal-case text-textLight shadow-lg dark:border-outlineDark
        dark:bg-bgDark dark:text-textDark"
	on:click|stopPropagation
>
	<div class="truncate text-xs font-bold">
		{heading}
	</div>

	{#if distribution.gpa != null}
		<div class="flex flex-row items-baseline gap-1 pb-1">
			<span
				class="text-lg font-bold
                    {tierClasses[gpaTier(distribution.gpa)]}"
			>
				{distribution.gpa.toFixed(2)}
			</span>
			<span class="text-xs text-secCodesLight dark:text-secCodesDark">
				avg GPA &middot;
				{distribution.totalStudents.toLocaleString()} students
			</span>
		</div>
	{/if}

	<GradeDistributionBars {distribution} />

	<div
		class="mt-1 text-[10px] leading-tight text-secCodesLight
            dark:text-secCodesDark"
	>
		{#if semesterRange != null}
			{semesterRange} &middot;
		{/if}
		<!-- format-check exempt 1 12 -->
		<a href={ptLink} target="_blank" class="text-orange underline" on:click|stopPropagation>
			Data from PlanetTerp
		</a>
	</div>
</div>
