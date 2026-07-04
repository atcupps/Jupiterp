<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import {
		bucketPercent,
		GRADE_BUCKETS,
		type GradeBucket,
		type GradeDistribution
	} from '$lib/course-planner/Grades';

	export let distribution: GradeDistribution;

	// Static bucket -> class map; Tailwind requires literal class names
	const fillClasses: Record<GradeBucket, string> = {
		A: 'bg-gradeA',
		B: 'bg-gradeB',
		C: 'bg-gradeC',
		D: 'bg-orange',
		F: 'bg-gradeF',
		W: 'bg-midGray'
	};

	function computeWidths(dist: GradeDistribution): Record<GradeBucket, number> {
		const widths = {} as Record<GradeBucket, number>;
		for (const bucket of GRADE_BUCKETS) {
			if (dist.totalStudents === 0) {
				widths[bucket] = 0;
			} else {
				widths[bucket] = (dist.buckets[bucket] / dist.totalStudents) * 100;
			}
		}
		return widths;
	}

	$: widths = computeWidths(distribution);
</script>

<div class="flex flex-col gap-[3px]">
	{#each GRADE_BUCKETS as bucket}
		<div class="flex flex-row items-center gap-1">
			<span class="w-4 text-xs font-bold 2xl:text-sm">
				{bucket}
			</span>
			<div
				class="h-2 flex-1 overflow-hidden rounded-sm bg-hoverLight
                    dark:bg-hoverDark"
			>
				<!-- format-check exempt 1 16 -->
				<div class="h-full rounded-sm {fillClasses[bucket]}" style="width: {widths[bucket]}%"></div>
			</div>
			<span
				class="w-9 text-right text-[10px] tabular-nums
                    text-secCodesLight dark:text-secCodesDark"
			>
				{bucketPercent(distribution, bucket)}%
			</span>
		</div>
	{/each}
</div>
