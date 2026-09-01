<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  interface Props {
    /** Earliest hour shown on the schedule, as a decimal hour. */
    earliestClassStart: number;

    /** Latest hour shown on the schedule, as a decimal hour. */
    latestClassEnd: number;

    /**
     * Distance in pixels from the first hour line to the last, as measured by
     * `ScheduleBackground`. Also used to detect that the schedule has actually
     * been laid out; it is 0 during SSR and before the first measurement.
     */
    bgHeight: number;

    /** Whether the schedule is currently showing an "Other" column. */
    hasOther: boolean;
  }

  let { earliestClassStart, latestClassEnd, bgHeight, hasOther }: Props = $props();

  /**
   * Tick once a minute so the line follows the clock. Created inside an
   * `$effect` so the interval only ever exists in the browser and is cleared
   * when the component is destroyed.
   */
  let now = $state(new Date());
  $effect(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 60_000);
    return () => clearInterval(interval);
  });

  /** The current time as a decimal hour, matching `Classtime.start`/`.end`. */
  let nowDecimal = $derived(now.getHours() + now.getMinutes() / 60);

  /**
   * Index of today's column, where 0 is Monday. `-1` on a weekend, in which
   * case no column is highlighted and every line is drawn translucent.
   */
  let todayColumn = $derived(now.getDay() >= 1 && now.getDay() <= 5 ? now.getDay() - 1 : -1);

  /** Position of the line within the hour-line band, as a percentage. */
  let topPercent = $derived(((nowDecimal - earliestClassStart) / (latestClassEnd - earliestClassStart)) * 100);

  /**
   * Only render once the schedule has been measured, and only while the
   * current time falls inside the window the schedule actually displays.
   */
  let visible = $derived(
    bgHeight > 0 &&
      latestClassEnd > earliestClassStart &&
      nowDecimal >= earliestClassStart &&
      nowDecimal <= latestClassEnd
  );

  /** The current time as a 12-hour `h:mm` label for the bubble. */
  let label = $derived.by(() => {
    const hour = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
    return `${hour}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
</script>

{#if visible}
  <div style="height: {bgHeight}px;" class="top-9.5 pointer-events-none absolute left-0 z-10 w-full">
    <!-- One segment per day column, so the solid/translucent split lands
         exactly on a day boundary and the "Other" column is skipped. -->
    <div
      class="absolute inset-y-0 left-9 grid w-[calc(100%-2.25rem)] 2xl:left-11 2xl:w-[calc(100%-2.75rem)]"
      class:grid-cols-5={!hasOther}
      class:grid-cols-6={hasOther}
    >
      {#each Array.from({ length: hasOther ? 6 : 5 }, (_, i) => i) as columnIndex (columnIndex)}
        <div class="relative">
          {#if columnIndex < 5}
            <div
              style="top: {topPercent}%"
              class="absolute h-0.5 w-full -translate-y-1/2 {columnIndex === todayColumn
                ? 'bg-red-500'
                : 'bg-red-500/30'}"
            ></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Current time bubble, sitting over the hour labels -->
    <div
      style="top: {topPercent}%"
      class="absolute left-0 -translate-y-1/2 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[0.7rem] font-semibold leading-none text-white 2xl:text-xs"
    >
      {label}
    </div>
  </div>
{/if}
