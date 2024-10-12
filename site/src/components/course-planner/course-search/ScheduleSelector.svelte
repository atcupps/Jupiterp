<script lang='ts'>
    import { AngleRightOutline, PlusOutline } from "flowbite-svelte-icons";
    import {
        CurrentScheduleStore, NonselectedScheduleStore
    } from "../../../stores/CoursePlannerStores";
    import ScheduleOptionsDropdown from "./ScheduleOptionsDropdown.svelte";
    import { slide } from "svelte/transition";
    import { onMount } from "svelte";

    let dropdownOpen: boolean = false;

    let inputScheduleName: string;
    let currentScheduleName: string;
    let currentScheduleSelections: ScheduleSelection[];
    CurrentScheduleStore.subscribe((stored) => {
        currentScheduleName = stored.scheduleName;
        currentScheduleSelections = stored.selections;
    });

    $: if (inputScheduleName) {
        if (inputScheduleName.trim().length > 0) {
            currentScheduleName = inputScheduleName;
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });
        } else {
            currentScheduleName = defaultScheduleName(nonselectedSchedules);
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });
        }
    }

    function defaultScheduleName(schedules: StoredSchedule[]): string {
        let scheduleNames: Set<string> = new Set<string>();
        schedules.forEach((elt) => { scheduleNames.add(elt.scheduleName) });
        let i = 1;
        while (scheduleNames.has('Schedule ' + i)) {
            i++;
        }
        return 'Schedule ' + i;
    }

    let scheduleNameElement: HTMLInputElement;
    $: if (currentScheduleName && scheduleNameElement) {
        scheduleNameElement.value = currentScheduleName;
    }

    let nonselectedSchedules: StoredSchedule[] = [];
    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    function changeSchedule(newSchedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(newSchedule);
        if (index === -1) {
            // This should not be possible
            console.log('Could not find schedule: '+ newSchedule.scheduleName);
        }
        else {
            const scheduleToReplace: StoredSchedule = {
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            }
            nonselectedSchedules.splice(index, 1);
            nonselectedSchedules = [scheduleToReplace,...nonselectedSchedules];
            currentScheduleName = newSchedule.scheduleName;
            currentScheduleSelections = newSchedule.selections;
            
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });

            NonselectedScheduleStore.set(nonselectedSchedules);
        }
        dropdownOpen = false;
    }
</script>

<div class='flex w-full flex-col mb-1'>
    <div class='flex flex-row text-sm 2xl:text-md pb-1 w-full'>
        <div class='grow text-left justify-start py-1 px-0.5 flex flex-row
                        hover:bg-hoverLight hover:dark:bg-hoverDark rounded-md'>
            <button class:rotate-90={dropdownOpen}
                    class='transition origin-center'
                    on:click={() => dropdownOpen = !dropdownOpen }>
                <AngleRightOutline class='h-5 w-5' />
            </button>

            <input contenteditable="true"
                    bind:this={scheduleNameElement}
                    bind:value={inputScheduleName}
                    class='bg-bgLight dark:bg-bgDark
                            px-0.5 mr-1 rounded cursor-text grow'>
        </div>

        <ScheduleOptionsDropdown />

        <button class="rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark h-7">
            <PlusOutline class="w-5 h-5 px-0.5" />
        </button>
    </div>

    {#if dropdownOpen}
        <div class='w-full pr-5 pl-4' transition:slide>
            {#each nonselectedSchedules as schedule}
                <button class='text-sm hover:bg-hoverLight pl-1.5
                                dark:hover:bg-hoverDark text-left rounded-md
                                h-6 items-center w-full'
                        on:click={() => changeSchedule(schedule)}>
                    <div>{schedule.scheduleName}</div>
                </button>
            {/each}
        </div>
    {/if}
</div>