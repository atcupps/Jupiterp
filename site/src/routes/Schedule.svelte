<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import { getClasstimeBounds, schedulify } from './schedule';
    import ScheduleDay from './ScheduleDay.svelte';
    import { getColorFromNumber } from "./classMeeting";
    import { formatInstructors } from './formatting';
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
            text-lg text-center text-black dark:text-white overflow-y-scroll'>
    <div class='h-full grid grow relative pl-8'
            class:grid-cols-5={schedule.other.length == 0}
            class:grid-cols-6={schedule.other.length > 0}>
        
        <!-- Background lines for the schedule -->
        <div class='absolute timelines z-0 h-full' 
                style='width: {schedule.other.length == 0 ? '100%' : '83.3%'};
                        top: 28px;'>
            <ScheduleBackground bind:earliest={earliestClassStart}
                                bind:latest={latestClassEnd} 
                                bind:h={bgHeight}/>
        </div>

        <!-- ClassTimes by day -->
        <ScheduleDay name='Mon' classes={schedule.monday} 
            bind:earliestClassStart
            bind:latestClassEnd 
            bind:bgHeight/>
        <ScheduleDay name='Tue' classes={schedule.tuesday} 
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>
        <ScheduleDay name='Wed' classes={schedule.wednesday} 
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>
        <ScheduleDay name='Thu' classes={schedule.thursday} 
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>
        <ScheduleDay name='Fri' classes={schedule.friday} 
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight/>

        <!-- 'Other' classes (OnlineAsync, Unspecified) -->
        {#if schedule.other.length > 0}
            <div class='h-full grow z-10 border-solid border-l-2 
                            border-divBorderLight dark:border-divBorderDark
                            flex flex-col pl-2'>
                Other
                {#each schedule.other as meeting}
                    <div class='w-full text-center text-black rounded-lg my-1 pb-1'
                            style='background-color: {getColorFromNumber(meeting.colorNumber)}'>
                        <div class='text-base font-semibold rounded-t-lg courseCode font-sans'>
                            {meeting.course}
                        </div>
                        <div class='font-thin text-xs font-sans'>
                            {formatInstructors(meeting.instructors)}
                        </div>
                        <div class='font-thin text-xs font-sans'>
                            Section {meeting.secCode}
                        </div>
                        <div class='font-thin text-xs font-sans'>
                            {#if meeting.meeting === 'OnlineAsync'}
                                ONLINE ASYNC
                            {:else if meeting.meeting === 'Unspecified'}
                                Unspecified
                            {:else}
                                {meeting.meeting}
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>

    .courseCode {
        background-color: rgba(0, 0, 0, 0.07)
    }
</style>