<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import {
        PlusOutline,
        TrashBinOutline,
    } from "flowbite-svelte-icons";
    import {
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from "../../stores/CoursePlannerStores";
    import { groupSchedulesByTerm } from "$lib/course-planner/ScheduleSelector";
    import type { ScheduleSelection, StoredSchedule } from "../../types";

    const MIN_YEAR = 2022;
    const MAX_YEAR = new Date().getFullYear();

    const DISPLAY_TERM_OPTIONS: StoredSchedule['term'][] = [
        'Fall',
        'Spring',
        'Winter',
        'Summer',
    ];

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

    let nonselectedSchedules: StoredSchedule[] = [];
    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    function updateCurrentSchedule() {
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        });
    }

    function makeUniqueName(baseName: string): string {
        const trimmed = baseName.trim();
        const defaultName = trimmed.length > 0 ? trimmed : 'New schedule';
        const allNames = new Set<string>([
            currentScheduleName,
            ...nonselectedSchedules.map((schedule) => schedule.scheduleName),
        ]);

        if (!allNames.has(defaultName)) {
            return defaultName;
        }

        let index = 2;
        let candidate = `${defaultName} ${index}`;
        while (allNames.has(candidate)) {
            index += 1;
            candidate = `${defaultName} ${index}`;
        }
        return candidate;
    }

    function createNewSchedule() {
        const rawName = window.prompt('Name this new schedule:', 'New schedule');
        if (rawName === null) {
            return;
        }

        const oldCurrent: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        };

        const updated = [oldCurrent, ...nonselectedSchedules];
        NonselectedScheduleStore.set(updated);

        currentScheduleName = makeUniqueName(rawName);
        currentScheduleSelections = [];
        updateCurrentSchedule();
    }

    function changeSchedule(newSchedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(newSchedule);
        if (index === -1) {
            return;
        }

        const oldCurrent: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        };

        const updated = [...nonselectedSchedules];
        updated.splice(index, 1);
        updated.unshift(oldCurrent);
        NonselectedScheduleStore.set(updated);

        currentScheduleName = newSchedule.scheduleName;
        currentScheduleSelections = newSchedule.selections;
        currentScheduleTerm = newSchedule.term;
        currentScheduleYear = newSchedule.year;
        updateCurrentSchedule();
    }

    function deleteNonselected(schedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(schedule);
        if (index === -1) {
            return;
        }

        const updated = [...nonselectedSchedules];
        updated.splice(index, 1);
        NonselectedScheduleStore.set(updated);
    }

    function handleScheduleTermChange(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        const value = target.value;
        if (value === 'Fall' || value === 'Spring' ||
                value === 'Winter' || value === 'Summer') {
            currentScheduleTerm = value;
            updateCurrentSchedule();
        }
    }

    function changeScheduleYear(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const parsed = Number(target.value);
        if (!Number.isInteger(parsed)) {
            target.value = currentScheduleYear.toString();
            return;
        }

        const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, parsed));
        currentScheduleYear = clamped;
        target.value = clamped.toString();
        updateCurrentSchedule();
    }

    let groupedNonselectedSchedules = groupSchedulesByTerm(nonselectedSchedules);
    $: groupedNonselectedSchedules = groupSchedulesByTerm(nonselectedSchedules)
        .map((group) => {
            return {
                ...group,
                schedules: [...group.schedules].sort((a, b) => {
                    return a.scheduleName.localeCompare(b.scheduleName);
                })
            };
        });
</script>

<div class='flex w-full flex-col gap-2'>
    <div class='flex flex-row items-center justify-between'>
        <div class='text-xs opacity-70'>Current schedule</div>
        <button class='rounded-md px-2 py-1 text-xs hover:bg-hoverLight
                        dark:hover:bg-hoverDark border
                        border-outlineLight dark:border-outlineDark
                        inline-flex items-center gap-1'
                title='Create new schedule'
                on:click={createNewSchedule}>
            <PlusOutline class='w-4 h-4' />
            Create New Schedule
        </button>
    </div>

    <div class='rounded-md border border-outlineLight dark:border-outlineDark
                p-2 flex flex-col gap-2'>
        <div class='text-sm font-semibold truncate' title={currentScheduleName}>
            {currentScheduleName}
        </div>

        <div class='flex flex-row gap-1'>
            <select class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none'
                    title='Current schedule term'
                    value={currentScheduleTerm}
                    on:change={handleScheduleTermChange}>
                {#each DISPLAY_TERM_OPTIONS as termOption}
                    <option value={termOption}>{termOption}</option>
                {/each}
            </select>

            <input class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none w-20'
                    title='Current schedule year'
                    type='number'
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    bind:value={currentScheduleYear}
                    on:blur={changeScheduleYear}>
        </div>
    </div>

    <div class='max-h-48 overflow-y-auto pr-0.5'>
        {#if groupedNonselectedSchedules.length === 0}
            <div class='text-sm opacity-70 px-1 py-1'>No other schedules</div>
        {/if}

        {#each groupedNonselectedSchedules as scheduleGroup}
            <div class='text-xs font-semibold opacity-70 pt-1 pb-1 px-1'>
                {scheduleGroup.groupLabel}
            </div>
            {#each scheduleGroup.schedules as schedule}
                <div class='flex flex-row items-center gap-1 pb-1'>
                    <button class='text-sm text-left rounded-md px-2 py-1
                                    hover:bg-hoverLight
                                    dark:hover:bg-hoverDark grow truncate'
                            title={'Switch to ' + schedule.scheduleName}
                            on:click={() => changeSchedule(schedule)}>
                        {schedule.scheduleName}
                    </button>
                    <button class='rounded-md p-1 hover:bg-hoverLight
                                    dark:hover:bg-hoverDark'
                            title={'Delete ' + schedule.scheduleName}
                            on:click={() => deleteNonselected(schedule)}>
                        <TrashBinOutline class='w-4 h-4' />
                    </button>
                </div>
            {/each}
        {/each}
    </div>
</div>
