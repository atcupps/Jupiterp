<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import type { ClassMeetingExtended } from '../../../types';
  import ClassMeeting from './ClassMeeting.svelte';
  import { tightTransitions } from '../../../lib/course-planner/WalkTime';

  interface Props {
    name: string;
    classes: ClassMeetingExtended[];
    earliestClassStart?: number;
    latestClassEnd?: number;
    bgHeight?: number;
    /**
     * "Other" for the column holding meetings with no real classtime
     * (TBA, OnlineAsync, ...), which are laid out stacked rather than
     * positioned by time. "Day" for the five weekday columns.
     */
    type?: string;
  }

  let {
    name,
    classes,
    earliestClassStart = $bindable(0),
    latestClassEnd = $bindable(0),
    bgHeight = $bindable(0),
    type = 'Day',
  }: Props = $props();
  let walkWarnings = $derived(type === 'Day' ? tightTransitions(classes) : []);
</script>

<div class="z-10 flex h-full w-full flex-col px-1">
  <div>{name}</div>
  <div style="height: {bgHeight}px;" class="relative top-2.5 text-black">
    {#each classes as classMeeting, index (`${index}-${classMeeting.instructors}`)}
      <ClassMeeting meeting={classMeeting} isInOther={type === 'Other'} {earliestClassStart} {latestClassEnd} />
    {/each}

    <!-- Rendered after the meetings so the marker sits above the blocks -->
    {#each walkWarnings as warning (`${warning.from}-${warning.to}-${warning.at}`)}
      <div
        style="top: {((warning.at - earliestClassStart) / (latestClassEnd - earliestClassStart)) * 100}%"
        class="bg-orange absolute left-1/2 z-20 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow"
        title="{warning.needed} min walk from {warning.from} to {warning.to}, but only {warning.available} min between classes"
      >
        <!-- format-check exempt 6 -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-2.5 w-2.5 fill-white">
          <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
            d="M320 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM125.7 175.5c9.9-9.9 23.4-15.5 37.5-15.5c1.9 0 3.8 .1 5.6 .3L137.6 254c-9.3 28 1.7 58.8 26.8 74.5l86.2 53.9-25.4 88.8c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l28.7-100.4c5.9-20.6-2.6-42.6-20.7-53.9L238 299l30.9-82.4 5.1 12.3C289 264.7 323.9 288 362.7 288L384 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-21.3 0c-12.9 0-24.6-7.8-29.5-19.7l-6.3-15c-14.6-35.1-44.1-61.9-80.5-73.1l-48.7-15c-11.1-3.4-22.7-5.2-34.4-5.2c-31 0-60.8 12.3-82.7 34.3L57.4 153.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l23-23zM91.2 352L32 352c-17.7 0-32 14.3-32 32s14.3 32 32 32l69.6 0c19 0 36.2-11.2 43.9-28.5L157 361.6l-9.5-6c-17.5-10.9-30.5-26.8-37.9-44.9L91.2 352z"
          /></svg
        >
      </div>
    {/each}
  </div>
</div>
