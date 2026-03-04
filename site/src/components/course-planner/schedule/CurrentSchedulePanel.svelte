<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import CalendarView from './CalendarView.svelte';
    import { CurrentScheduleStore } from '../../../stores/CoursePlannerStores';
    import type { StoredSchedule } from '../../../types';

    let currentSchedule: StoredSchedule = {
        scheduleName: 'Schedule 1',
        selections: [],
        term: 'Fall',
        year: new Date().getFullYear(),
    };
    let printedOn = '';

    CurrentScheduleStore.subscribe((stored) => {
        currentSchedule = stored;
    });

    $: printedOn = new Date().toLocaleDateString();

    function rowCredits(schedule: StoredSchedule): number {
        let total = 0;
        for (const selection of schedule.selections) {
            total += selection.course.minCredits;
        }
        return total;
    }

    function exportCurrentToPdf() {
        window.print();
    }
</script>

<section class='schedule-print-pane flex flex-col min-h-0 grow min-w-0'>
    <div class='schedule-screen-header flex items-center justify-between pb-2 px-2'>
        <div>
            <div class='text-lg font-semibold'>{currentSchedule.scheduleName}</div>
            <div class='text-xs opacity-70'>
                {currentSchedule.term} {currentSchedule.year} ·
                Credits {rowCredits(currentSchedule)}
            </div>
        </div>
        <button class='rounded-md px-3 py-1 text-sm border
                        border-outlineLight dark:border-outlineDark
                        hover:bg-hoverLight dark:hover:bg-hoverDark'
                class:export-button={true}
                on:click={exportCurrentToPdf}>
            Export to PDF
        </button>
    </div>
    <div class='schedule-page grow min-h-0 overflow-auto'>
        <div class='print-only pb-3 text-left'>
            <h1 class='text-xl font-semibold leading-tight'>
                {currentSchedule.scheduleName} — {currentSchedule.term} {currentSchedule.year}
            </h1>
            <p class='text-sm opacity-70'>
                {rowCredits(currentSchedule)} credits · {currentSchedule.selections.length} courses · Printed {printedOn}
            </p>
        </div>
        <CalendarView />
    </div>
</section>
