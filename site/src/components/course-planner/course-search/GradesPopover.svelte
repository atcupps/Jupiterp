<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import {
    formatSemesterRange,
    hasEnoughForGpa,
    MIN_GRADED_FOR_GPA,
    type GradeDistribution,
  } from '../../../lib/course-planner/Grades';
  import GradeDistributionBars from './GradeDistributionBars.svelte';
  import { resolve } from '$app/paths';

  interface Props {
    /** Professor name or course code shown at the top of the popover */
    heading: string;
    distribution: GradeDistribution;
    /** Instructor slug; when given, the heading links to their page */
    slug?: string;
    /** Called when the popover should close, e.g. on Escape */
    onclose?: () => void;
  }

  let { heading, distribution, slug = undefined, onclose = undefined }: Props = $props();

  // Static tier -> class map; Tailwind requires literal class names
  let semesterRange = $derived(formatSemesterRange(distribution));
  let showGpa = $derived(hasEnoughForGpa(distribution));

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onclose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- right-0: opens leftward so the search results scroll container
    (overflow clips on the right) cannot cut the popover off -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="border-outline bg-bg-primary text-text-primary absolute right-0 top-full z-50 mt-1 w-60 cursor-default rounded-lg border-2 p-2 text-left font-normal normal-case shadow-lg"
  aria-label="Grade distribution for {heading}"
  onclick={(event) => event.stopPropagation()}
>
  <div class="truncate text-xs font-bold">
    {#if slug}
      <a
        href={resolve('/professor/[slug]', { slug })}
        class="hover:underline"
        onclick={(event) => event.stopPropagation()}>{heading}</a
      >
    {:else}
      {heading}
    {/if}
  </div>

  {#if showGpa && distribution.gpa != null}
    <div class="flex flex-row items-baseline gap-1 pb-1">
      <span class="text-lg font-bold">
        {distribution.gpa.toFixed(2)}
      </span>
      <span class="text-text-secondary text-xs">
        avg GPA &middot;
        {distribution.graded.toLocaleString()} graded
      </span>
    </div>
  {:else}
    <!-- A 4.00 computed from three students is noise presented as a fact. -->
    <div class="text-text-secondary pb-1 text-xs">
      Limited data &middot; {distribution.graded.toLocaleString()} graded
      {#if distribution.graded < MIN_GRADED_FOR_GPA}
        <span class="block">Too few students to show an average GPA.</span>
      {/if}
    </div>
  {/if}

  <GradeDistributionBars {distribution} />

  <div class="text-text-secondary mt-1 text-[10px] leading-tight">
    {#if semesterRange != null}
      {semesterRange} &middot;
    {/if}
    Percentages over {distribution.barTotal.toLocaleString()} students including withdrawals; GPA excludes them.
    <span class="block">Grade data from UMD's Office of the Registrar.</span>
  </div>
</div>
