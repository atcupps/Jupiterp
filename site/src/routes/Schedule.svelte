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

<div class='h-full w-full flex flex-row px-2 font-bold 
            text-2xl text-center text-black dark:text-white'>
    <div class='h-full flex flex-col pt-[32px]'>
        <span class='grow'>8</span>
        <span class='grow'>9</span>
        <span class='grow'>10</span>
        <span class='grow'>11</span>
        <span class='grow'>12</span>
        <span class='grow'>1</span>
        <span class='grow'>2</span>
        <span class='grow'>3</span>
        <span class='grow'>4</span>
        <span class='grow'>5</span>
        <span class='grow'>6</span>
        <span class='grow'>7</span>
    </div>
    <div class='h-full grid grow relative'
            class:grid-cols-5={schedule.other.length == 0}
            class:grid-cols-6={schedule.other.length > 0}>
        <div class='absolute timelines z-0' 
                style='width: {schedule.other.length == 0 ? '100%' : '83.3%'}'>
            <TimeLine position={0} />
            <TimeLine position={1 / 22} />
            <TimeLine position={2 / 22} />
            <TimeLine position={3 / 22} />
            <TimeLine position={4 / 22} />
            <TimeLine position={5 / 22} />
            <TimeLine position={6 / 22} />
            <TimeLine position={7 / 22} />
            <TimeLine position={8 / 22} />
            <TimeLine position={9 / 22} />
            <TimeLine position={10 / 22} />
            <TimeLine position={11 / 22} />
            <TimeLine position={12 / 22} />
            <TimeLine position={13 / 22} />
            <TimeLine position={14 / 22} />
            <TimeLine position={15 / 22} />
            <TimeLine position={16 / 22} />
            <TimeLine position={17 / 22} />
            <TimeLine position={18 / 22} />
            <TimeLine position={19 / 22} />
            <TimeLine position={20 / 22} />
        </div>

        <ScheduleDay name='M' classes={schedule.monday} />
        <ScheduleDay name='Tu' classes={schedule.tuesday} />
        <ScheduleDay name='W' classes={schedule.wednesday} />
        <ScheduleDay name='Th' classes={schedule.thursday} />
        <ScheduleDay name='Fr' classes={schedule.friday} />

        {#if schedule.other.length > 0}
            <div class='h-full grow z-10 border-solid border-l-2 
                            border-divBorderLight dark:border-divBorderDark'>
                Other
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
</style>