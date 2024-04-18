<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang='ts'>
    import {
        AngleRightOutline, AngleDownOutline, PlusOutline
    } from "flowbite-svelte-icons";
    import ScheduleOptionsDropdown from "./ScheduleOptionsDropdown.svelte";
    import { slide } from 'svelte/transition';

    let dropdownOpen: boolean = false;

    export let selections: ScheduleSelection[];
    export let schedules: UserSchedule[];
    let scheduleNameInput: string = '';
    let curSchedule: UserSchedule;
    $: if (schedules) {
        // When schedules is loaded, it will have length >= 1
        curSchedule = schedules[0];
    }

    $: if (curSchedule) {
        if (scheduleNameInput !== null && scheduleNameInput.length > 0) {
            curSchedule.name = scheduleNameInput;
        } else {
            curSchedule.name = 'Schedule Name';
        }
    }

    $: if (curSchedule && selections) {
        curSchedule.selections = selections;
    }

    function changeSchedule(schedule: UserSchedule) {
        dropdownOpen = false;
        const index: number = schedules.indexOf(schedule);
        if (index === -1) {
            console.log('Failed to retrieve user schedule.');
        } else {
            schedules.splice(index, 1);
            schedules = [schedule, ...schedules];
        }
    }
</script>

<div class='flex w-full flex-col mb-1'>
    <div class='text-sm font-light w-full static flex 
                flex-row items-center justify-start'>
        <div class="hover:bg-hoverLight dark:hover:bg-hoverDark rounded-md 
                        grow flex flex-row items-center justify-start h-7">
            <button on:click={() => {dropdownOpen = !dropdownOpen}}>
                {#if !dropdownOpen}
                    <AngleRightOutline class="w-5 h-5" />
                {:else}
                    <AngleDownOutline class="w-5 h-5" />
                {/if}
            </button>
            <input class="text-inherit grow text-left bg-bgLight dark:bg-bgDark
                        px-0.5 rounded-sm cursor-text" placeholder="Schedule Name"
                        bind:value={scheduleNameInput}>
            <ScheduleOptionsDropdown />
        </div>
        <button class="rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark h-7">
            <PlusOutline class="w-5 h-5 px-0.5" />
        </button>
    </div>

    {#if dropdownOpen}
        <div class='w-full pr-5 pl-4' transition:slide>
            {#each schedules as schedule}
                <button class='text-sm hover:bg-hoverLight pl-1.5
                                dark:hover:bg-hoverDark text-left rounded-md
                                h-6 items-center w-full'
                        on:click={() => changeSchedule(schedule)}>
                    <div>{schedule.name}</div>
                </button>
            {/each}
        </div>
    {/if}
</div>