<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { formatSemester, gpaTier, type GpaTier, type GradeDistribution } from '../../../lib/course-planner/Grades';
  import GradeDistributionBars from './GradeDistributionBars.svelte';

  interface Props {
    /** Professor name or course code shown at the top of the popover */
    heading: string;
    distribution: GradeDistribution;
    /** Link to the relevant PlanetTerp page for attribution */
    ptLink: string;
  }

  let { heading, distribution, ptLink }: Props = $props();

  // Static tier -> class map; Tailwind requires literal class names
  const tierClasses: Record<GpaTier, string> = {
    good: 'text-gpa-good',
    mid: 'text-gpa-mid',
    low: 'text-gpa-low',
  };

  let semesterRange = $derived(
    distribution.earliestSemester != null && distribution.latestSemester != null
      ? distribution.earliestSemester === distribution.latestSemester
        ? formatSemester(distribution.earliestSemester)
        : formatSemester(distribution.earliestSemester) + ' – ' + formatSemester(distribution.latestSemester)
      : null
  );
</script>

<!-- right-0: opens leftward so the search results scroll container
    (overflow clips on the right) cannot cut the popover off -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="border-outline bg-bg-primary text-text-primary absolute right-0 top-full z-50 mt-1 w-56 cursor-default rounded-lg border-2 p-2 text-left font-normal normal-case shadow-lg"
  onclick={(event) => event.stopPropagation()}
>
  <div class="truncate text-xs font-bold">
    {heading}
  </div>

  {#if distribution.gpa != null}
    <div class="flex flex-row items-baseline gap-1 pb-1">
      <span class="text-lg font-bold {tierClasses[gpaTier(distribution.gpa)]}">
        {distribution.gpa.toFixed(2)}
      </span>
      <span class="text-text-secondary text-xs">
        avg GPA &middot;
        {distribution.totalStudents.toLocaleString()} students
      </span>
    </div>
  {/if}

  <GradeDistributionBars {distribution} />

  <div class="text-text-secondary mt-1 text-[10px] leading-tight">
    {#if semesterRange != null}
      {semesterRange} &middot;
    {/if}
    <a
      href={ptLink}
      target="_blank"
      rel="external noopener noreferrer"
      class="text-orange underline"
      onclick={(event) => event.stopPropagation()}
    >
      Data from PlanetTerp
    </a>
  </div>
</div>
