<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import {
		bucketPercent,
		BUCKET_LETTERS,
		GRADE_BUCKETS,
		type GradeBucket,
		type GradeDistribution,
		type LetterGrade
	} from '$lib/course-planner/Grades';

	export let distribution: GradeDistribution;

	interface BarSegment {
		letter: LetterGrade;
		fillClass: string;
		width: number;
		count: number;
	}

	type BucketSegments = Record<GradeBucket, BarSegment[]>;

	// Static letter -> class map; Tailwind requires literal class names.
	// Within a bucket, plus grades are darkest and minus grades lightest.
	const fillClasses: Partial<Record<LetterGrade, string>> = {
		'A+': 'bg-gradeAPlus',
		A: 'bg-gradeA',
		'A-': 'bg-gradeAMinus',
		'B+': 'bg-gradeBPlus',
		B: 'bg-gradeB',
		'B-': 'bg-gradeBMinus',
		'C+': 'bg-gradeCPlus',
		C: 'bg-gradeC',
		'C-': 'bg-gradeCMinus',
		'D+': 'bg-gradeDPlus',
		D: 'bg-orange',
		'D-': 'bg-gradeDMinus',
		F: 'bg-gradeF',
		W: 'bg-midGray'
	};

	function computeSegments(dist: GradeDistribution): BucketSegments {
		const segments = {} as BucketSegments;
		for (const bucket of GRADE_BUCKETS) {
			segments[bucket] = [];
			if (dist.totalStudents === 0) {
				continue;
			}
			// Reversed so segments run minus -> plus (light -> dark)
			for (const letter of [...BUCKET_LETTERS[bucket]].reverse()) {
				const count = dist.letters[letter];
				if (count === 0) {
					continue;
				}
				segments[bucket].push({
					letter,
					fillClass: fillClasses[letter] ?? '',
					width: (count / dist.totalStudents) * 100,
					count
				});
			}
		}
		return segments;
	}

	$: segments = computeSegments(distribution);
</script>

<div class="flex flex-col gap-[3px]">
	{#each GRADE_BUCKETS as bucket}
		<div class="flex flex-row items-center gap-1">
			<span class="w-4 text-xs font-bold 2xl:text-sm">
				{bucket}
			</span>
			<div
				class="flex h-2 flex-1 flex-row overflow-hidden rounded-sm
                    bg-hoverLight dark:bg-hoverDark"
			>
				{#each segments[bucket] as segment}
					<div
						class="h-full {segment.fillClass}"
						style="width: {segment.width}%"
						title="{segment.letter}: {segment.count}"
					></div>
				{/each}
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
