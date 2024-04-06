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

    let dropdownOpen: boolean = false;

    let scheduleNameInput: string = '';
    let scheduleName: string = 'My Schedule'
    $: if (scheduleNameInput.length > 0) {
        scheduleName = scheduleNameInput;
        console.log(scheduleName);
    } else {
        scheduleName = 'My Schedule';
        console.log(scheduleName);
    }

    export let selections: ScheduleSelection[];
</script>

<div class='text-sm pb-1 font-light w-full static flex 
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
                    px-0.5 rounded-sm cursor-text" placeholder="My Schedule"
                    bind:value={scheduleNameInput}>
        <ScheduleOptionsDropdown />
    </div>
    <button class="rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark h-7">
        <PlusOutline class="w-5 h-5 px-0.5" />
    </button>
</div>