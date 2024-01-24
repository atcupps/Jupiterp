<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import { getClasstimeBounds, schedulify } from './schedule';
    import ScheduleDay from './ScheduleDay.svelte';
    import ScheduleBackground from './ScheduleBackground.svelte';

    export let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(selections);

    // In order for Svelte to recreate `schedule` reactively as the user
    // selects new classes, this if block is needed to run `schedulify`
    // if `selections` changes.
    $: if (selections) {
        schedule = schedulify(selections);
    }

    let bgHeight: number;

    // Keep track of the range of times to display on the Schedule
    let earliestClassStart: number = 8;
    let latestClassEnd: number = 16;
    $: if (selections) {
        if (selections.length === 0) {
            earliestClassStart = 8;
            latestClassEnd = 16;
        } else {
            const bounds = getClasstimeBounds(schedule);
            earliestClassStart = bounds.earliestStart;
            latestClassEnd = bounds.latestEnd;
            const boundDiff = latestClassEnd - earliestClassStart;
            if (boundDiff < 8) {
                earliestClassStart -= Math.floor((8 - boundDiff) / 2);
                latestClassEnd += Math.floor((8 - boundDiff) / 2);
            }
        }
    }
</script>

<div class='h-full w-full flex flex-row px-2 font-medium
            items-center overflow-x-scroll
            text-lg text-center text-black dark:text-white overflow-y-scroll'>
    <div class='h-full grid grow relative pl-8 min-w-[768px]'
            class:grid-cols-5={schedule.other.length == 0}
            class:grid-cols-6={schedule.other.length > 0}>
        
        <!-- Background lines for the schedule -->
        <div class='absolute timelines z-0 h-full top-[1.75rem]' 
                style='width: {schedule.other.length == 0 ? '100%' : '83.3%'};;'>
            <ScheduleBackground bind:earliest={earliestClassStart}
                                bind:latest={latestClassEnd} 
                                bind:h={bgHeight}/>
        </div>

        <!-- ClassTimes by day -->
        <ScheduleDay name='Mon' classes={schedule.monday} 
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd 
            bind:bgHeight/>
        <ScheduleDay name='Tue' classes={schedule.tuesday}
        bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>
        <ScheduleDay name='Wed' classes={schedule.wednesday}
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>
        <ScheduleDay name='Thu' classes={schedule.thursday}
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>
        <ScheduleDay name='Fri' classes={schedule.friday}
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>

        <!-- 'Other' classes (OnlineAsync, Unspecified) -->
        {#if schedule.other.length > 0}
            <ScheduleDay name='Other' classes={schedule.other} type='Other'
                {bgHeight}
            bind:selections={selections}/>
        {/if}
    </div>
</div>