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
    type LetterGrade,
  } from '../../../lib/course-planner/Grades';

  interface Props {
    distribution: GradeDistribution;
  }

  let { distribution }: Props = $props();

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
    'A+': 'bg-grade-a-plus',
    A: 'bg-grade-a',
    'A-': 'bg-grade-a-minus',
    'B+': 'bg-grade-b-plus',
    B: 'bg-grade-b',
    'B-': 'bg-grade-b-minus',
    'C+': 'bg-grade-c-plus',
    C: 'bg-grade-c',
    'C-': 'bg-grade-c-minus',
    'D+': 'bg-grade-d-plus',
    D: 'bg-orange',
    'D-': 'bg-grade-d-minus',
    F: 'bg-grade-f',
    W: 'bg-mid-gray',
  };

  function computeSegments(dist: GradeDistribution): BucketSegments {
    const segments = {} as BucketSegments;
    for (const bucket of GRADE_BUCKETS) {
      segments[bucket] = [];
      if (dist.barTotal === 0) {
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
          width: (count / dist.barTotal) * 100,
          count,
        });
      }
    }
    return segments;
  }

  let segments = $derived(computeSegments(distribution));
</script>

<div class="flex flex-col gap-[3px]">
  {#each GRADE_BUCKETS as bucket (bucket)}
    <div class="flex flex-row items-center gap-1">
      <span class="w-4 text-xs font-bold 2xl:text-sm">
        {bucket}
      </span>
      <div class="bg-hover flex h-2 flex-1 flex-row overflow-hidden rounded-sm">
        {#each segments[bucket] as segment (segment.letter)}
          <div
            style="width: {segment.width}%"
            class="h-full {segment.fillClass}"
            title="{segment.letter}: {segment.count}"
          ></div>
        {/each}
      </div>
      <span class="text-text-secondary w-9 text-right text-[10px] tabular-nums">
        {bucketPercent(distribution, bucket)}%
      </span>
    </div>
  {/each}
</div>
