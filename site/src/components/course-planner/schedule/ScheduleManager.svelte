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

    let scheduleNameInput: string = '';
    let scheduleName: string = 'Schedule 1'
    $: if (scheduleNameInput.length > 0) {
        scheduleName = scheduleNameInput;
        console.log(scheduleName);
    } else {
        scheduleName = 'Schedule 1';
        console.log(scheduleName);
    }

    export let selections: ScheduleSelection[];
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
                        px-0.5 rounded-sm cursor-text" placeholder="Schedule 1"
                        bind:value={scheduleNameInput}>
            <ScheduleOptionsDropdown />
        </div>
        <button class="rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark h-7">
            <PlusOutline class="w-5 h-5 px-0.5" />
        </button>
    </div>

    {#if dropdownOpen}
        <button class='text-sm mr-5 ml-4 pl-1.5 hover:bg-hoverLight
                        dark:hover:bg-hoverDark text-left rounded-md
                        h-6 items-center' transition:slide>
            <div>Alan's schedule</div>
        </button>
    {/if}
</div>