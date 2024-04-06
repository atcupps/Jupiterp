<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang='ts'>
    import {
        AngleRightOutline, AngleDownOutline, DotsVerticalOutline, PlusOutline
    } from "flowbite-svelte-icons";

    let dropdownOpen: boolean = false;

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
        <!-- Ignoring a11y warnings since this on-click 
            only exists to stop event propagation -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <input class="text-inherit grow text-left bg-bgLight dark:bg-bgDark
                    px-0.5 rounded-sm cursor-text" contenteditable
                    on:click={(event) => {event.stopPropagation()}}
                    on:keydown={(event) => {
                        if (event.key === ' ') {
                            event.stopImmediatePropagation();
                        }
                    }} placeholder="My Schedule">
        <DotsVerticalOutline class="w-5 h-5 px-0.5" />
    </div>
    <button class="rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark h-7">
        <PlusOutline class="w-5 h-5 px-0.5" />
    </button>
</div>