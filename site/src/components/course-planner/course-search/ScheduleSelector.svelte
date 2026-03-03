<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import {
        AngleRightOutline, PlusOutline, TrashBinOutline
    } from "flowbite-svelte-icons";
    import {
        CurrentScheduleStore, NonselectedScheduleStore
    } from "../../../stores/CoursePlannerStores";
    import ScheduleOptionsDropdown from "./ScheduleOptionsDropdown.svelte";
    import { slide } from "svelte/transition";
    import {
        deleteNonselectedSchedule,
        groupSchedulesByTerm,
        uniqueScheduleName
    } from "$lib/course-planner/ScheduleSelector";
    import { TERM_VALUES } from "$lib/course-planner/Terms";
    import type { ScheduleSelection, StoredSchedule } from "../../../types";

    let dropdownOpen: boolean = false;

    let currentScheduleName: string;
    let currentScheduleSelections: ScheduleSelection[];
    let currentScheduleTerm: StoredSchedule['term'];
    let currentScheduleYear: number;
    CurrentScheduleStore.subscribe((stored) => {
        currentScheduleName = stored.scheduleName;
        currentScheduleSelections = stored.selections;
        currentScheduleTerm = stored.term;
        currentScheduleYear = stored.year;
    });

    function changeScheduleName() {
        const inputScheduleName = scheduleNameElement.value;
        if (inputScheduleName.trim().length > 0) {
            currentScheduleName = uniqueScheduleName(
                inputScheduleName,
                'New ',
                nonselectedSchedules
            );
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections,
                term: currentScheduleTerm,
                year: currentScheduleYear,
            });
        }
        else {
            currentScheduleName = uniqueScheduleName(
                'New schedule',
                'New ',
                nonselectedSchedules
            );
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections,
                term: currentScheduleTerm,
                year: currentScheduleYear,
            });
        }
    }

    function changeScheduleTerm(term: StoredSchedule['term']) {
        currentScheduleTerm = term;
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        });
    }

    function changeScheduleYear(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const parsed = Number(target.value);
        if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 3000) {
            target.value = currentScheduleYear.toString();
            return;
        }

        currentScheduleYear = parsed;
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        });
    }

    function handleScheduleTermChange(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        const value = target.value;
        if (value === 'Fall' || value === 'Spring' ||
                value === 'Winter' || value === 'Summer') {
            changeScheduleTerm(value);
        }
    }

    let scheduleNameElement: HTMLInputElement;
    $: if (currentScheduleName && scheduleNameElement) {
        scheduleNameElement.value = currentScheduleName;
    }

    let nonselectedSchedules: StoredSchedule[] = [];
    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    let scheduleGroups = groupSchedulesByTerm(nonselectedSchedules);

    function changeSchedule(newSchedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(newSchedule);
        if (index === -1) {
            // This should not be possible
            console.log('Could not find schedule: '+ newSchedule.scheduleName);
        }
        else {
            const scheduleToReplace: StoredSchedule = {
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections,
                term: currentScheduleTerm,
                year: currentScheduleYear,
            }
            nonselectedSchedules.splice(index, 1);
            nonselectedSchedules = [scheduleToReplace,...nonselectedSchedules];
            currentScheduleName = newSchedule.scheduleName;
            currentScheduleSelections = newSchedule.selections;
            currentScheduleTerm = newSchedule.term;
            currentScheduleYear = newSchedule.year;
            
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections,
                term: currentScheduleTerm,
                year: currentScheduleYear,
            });

            NonselectedScheduleStore.set(nonselectedSchedules);
        }
    }

    function createNewSchedule() {
        const oldSchedule: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        };
        nonselectedSchedules = [oldSchedule, ...nonselectedSchedules];
        NonselectedScheduleStore.set(nonselectedSchedules);
        currentScheduleName = uniqueScheduleName(
            'New schedule',
            'New ',
            nonselectedSchedules
        );
        currentScheduleSelections = [];
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        });
    }

    $: scheduleGroups = groupSchedulesByTerm(nonselectedSchedules);
</script>

<div class='flex w-full flex-col'>
    <div class='flex flex-row text-sm 2xl:text-md pb-1 w-full'
            title='Toggle schedule dropdown'>
        <div class='grow text-left justify-start py-1 px-0.5 flex flex-row
                    hover:bg-hoverLight hover:dark:bg-hoverDark rounded-md'>
            <button class:rotate-90={dropdownOpen}
                    class='transition origin-center'
                    on:click={() => dropdownOpen = !dropdownOpen }>
                <AngleRightOutline class='h-5 w-5' />
            </button>

            <input contenteditable="true"
                    bind:this={scheduleNameElement}
                    on:blur={changeScheduleName}
                    title='Schedule name'
                    class='bg-bgLight dark:bg-bgDark text-sm 2xl:text-md
                            px-0.5 mr-1 rounded cursor-text grow
                            border-none outline-none py-0'>
        </div>

        <ScheduleOptionsDropdown />

        <button class="rounded-md hover:bg-hoverLight
                        dark:hover:bg-hoverDark h-7"
                title='Create new schedule'
                on:click={createNewSchedule}>
            <PlusOutline class="w-5 h-5 px-0.5" />
        </button>
    </div>

    <div class='flex flex-row gap-1 w-full pb-1 pr-5 pl-4'>
        <select class='bg-bgLight dark:bg-bgDark text-xs border-none rounded
                        px-1 py-0.5 outline-none'
                title='Schedule term'
                bind:value={currentScheduleTerm}
                on:change={handleScheduleTermChange}>
            {#each TERM_VALUES as termOption}
                <option value={termOption}>{termOption}</option>
            {/each}
        </select>

        <input class='bg-bgLight dark:bg-bgDark text-xs border-none rounded
                        px-1 py-0.5 outline-none w-16'
                title='Schedule year'
                type='number'
                min='1900'
                max='3000'
                bind:value={currentScheduleYear}
                on:blur={changeScheduleYear}>
    </div>

    {#if dropdownOpen}
        <div class='w-full pr-5 pl-4 pb-0.5' transition:slide>
            {#each scheduleGroups as scheduleGroup}
                <div class='text-xs font-semibold opacity-70 pt-1 pb-0.5'>
                    {scheduleGroup.groupLabel}
                </div>
                {#each scheduleGroup.schedules as schedule}
                    <div class='h-6 w-full flex flex-row'>
                        <button class='text-sm hover:bg-hoverLight text-sm
                                        dark:hover:bg-hoverDark text-left rounded-md
                                        h-6 items-center grow pl-1.5'
                                title={'Switch to ' + schedule.scheduleName}
                                on:click={() => changeSchedule(schedule)}>
                            <div>{schedule.scheduleName}</div>
                        </button>

                        <button class='rounded-md hover:bg-hoverLight
                                        dark:hover:bg-hoverDark h-6 w-6
                                        flex justify-center items-center'
                                title={'Delete ' + schedule.scheduleName}
                                on:click={
                                    ()=> deleteNonselectedSchedule(
                                            schedule, nonselectedSchedules
                                        )
                                }>
                            <TrashBinOutline class='w-4 h-4' />
                        </button>
                    </div>
                {/each}
            {/each}
        </div>
    {/if}
</div>