<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import { schedulify } from './schedule';
    import ScheduleDay from './ScheduleDay.svelte';
    import TimeLine from './TimeLine.svelte';

    export let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(selections);

    // In order for Svelte to recreate `schedule` reactively as the user
    // selects new classes, this if block is needed to run `schedulify`
    // if `selections` changes.
    $: if (selections) {
        schedule = schedulify(selections);
    }
</script>

<div class='h-full w-full flex flex-row px-2 font-medium 
            text-lg text-center text-black dark:text-white overflow-y-scroll'>
    <div class='h-full grid grow relative pl-8'
            class:grid-cols-5={schedule.other.length == 0}
            class:grid-cols-6={schedule.other.length > 0}>
        <div class='absolute timelines z-0' 
                style='width: {schedule.other.length == 0 ? '100%' : '83.3%'};
                        top: 28px;'>
            <TimeLine number={'8 AM'} position={0 / 23} />
            <TimeLine position={1 / 23} />
            <TimeLine number={'9 AM'} position={2 / 23} />
            <TimeLine position={3 / 23} />
            <TimeLine number={'10 AM'} position={4 / 23} />
            <TimeLine position={5 / 23} />
            <TimeLine number={'11 AM'} position={6 / 23} />
            <TimeLine position={7 / 23} />
            <TimeLine number={'12 PM'} position={8 / 23} />
            <TimeLine position={9 / 23} />
            <TimeLine number={'1 PM'} position={10 / 23} />
            <TimeLine position={11 / 23} />
            <TimeLine number={'2 PM'} position={12 / 23} />
            <TimeLine position={13 / 23} />
            <TimeLine number={'3 PM'} position={14 / 23} />
            <TimeLine position={15 / 23} />
            <TimeLine number={'4 PM'} position={16 / 23} />
            <TimeLine position={17 / 23} />
            <TimeLine number={'5 PM'} position={18 / 23} />
            <TimeLine position={19 / 23} />
            <TimeLine number={'6 PM'} position={20 / 23} />
            <TimeLine position={21 / 23} />
            <TimeLine number={'7 PM'} position={22 / 23} />
        </div>

        <ScheduleDay name='Mon' classes={schedule.monday} />
        <ScheduleDay name='Tue' classes={schedule.tuesday} />
        <ScheduleDay name='Wed' classes={schedule.wednesday} />
        <ScheduleDay name='Thu' classes={schedule.thursday} />
        <ScheduleDay name='Fri' classes={schedule.friday} />

        {#if schedule.other.length > 0}
            <div class='h-full grow z-10 border-solid border-l-2 
                            border-divBorderLight dark:border-divBorderDark
                            flex flex-col px-2'>
                Other
                {#each schedule.other as meeting}
                    <div class='w-full bg-orange text-center text-black rounded-lg my-1 pb-1'>
                        <div class='text-base font-bold rounded-t-lg courseCode'>
                            {meeting.course}
                        </div>
                        <div class='font-thin text-xs'>
                            {meeting.instructors}
                        </div>
                        <div class='font-thin text-xs'>
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
    .timelines {
        height: calc(100% - 32px - 16px);
        top: calc(32px + 16px);
        padding-left: 2px;
        padding-right: 2px;
    }

    .courseCode {
        background-color: rgba(0, 0, 0, 0.1)
    }
</style>