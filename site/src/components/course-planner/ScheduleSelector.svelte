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
    } from 'flowbite-svelte-icons';
    import {
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from '../../stores/CoursePlannerStores';
    import type { StoredSchedule } from '../../types';

    type Term = StoredSchedule['term'];

    interface ScheduleRowEntry {
        schedule: StoredSchedule,
        source: 'current' | 'nonselected',
        nonselectedIndex: number | null,
        displayIndex: number,
    }

    interface ScheduleGroup {
        key: string,
        label: string,
        term: Term,
        year: number,
        rows: ScheduleRowEntry[],
    }

    const TERM_SORT_ORDER: Record<Term, number> = {
        Summer: 1,
        Winter: 2,
        Spring: 3,
        Fall: 4,
    };

    let currentSchedule: StoredSchedule = {
        scheduleName: 'Schedule 1',
        selections: [],
        term: 'Fall',
        year: new Date().getFullYear(),
    };

    let nonselectedSchedules: StoredSchedule[] = [];

    CurrentScheduleStore.subscribe((stored) => {
        currentSchedule = stored;
    });

    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    let collapsedGroupKeys: string[] = [];
    let currentDisplayIndex = 0;

    function makeUniqueName(baseName: string): string {
        const trimmed = baseName.trim();
        const defaultName = trimmed.length > 0 ? trimmed : 'New schedule';
        const allNames = new Set<string>([
            currentSchedule.scheduleName,
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

    function createNewSchedule(term: Term, year: number) {
        const rawName = window.prompt('Name this new schedule:', 'New schedule');
        if (rawName === null) {
            return;
        }

        const insertIndex = Math.max(
            0,
            Math.min(currentDisplayIndex, nonselectedSchedules.length)
        );

        const updated = [...nonselectedSchedules];
        updated.splice(insertIndex, 0, currentSchedule);
        NonselectedScheduleStore.set(updated);

        CurrentScheduleStore.set({
            scheduleName: makeUniqueName(rawName),
            selections: [],
            term,
            year,
        });
    }

    function selectSchedule(entry: ScheduleRowEntry) {
        if (entry.source !== 'nonselected' || entry.nonselectedIndex === null) {
            return;
        }

        const nextCurrent = nonselectedSchedules[entry.nonselectedIndex];
        const updated = [...nonselectedSchedules];
        updated[entry.nonselectedIndex] = currentSchedule;

        NonselectedScheduleStore.set(updated);
        CurrentScheduleStore.set(nextCurrent);
        currentDisplayIndex = entry.displayIndex;
    }

    function editSchedule(entry: ScheduleRowEntry) {
        const rawName = window.prompt('Edit schedule name:', entry.schedule.scheduleName);
        if (rawName === null) {
            return;
        }

        const nextName = rawName.trim();
        if (nextName.length === 0) {
            return;
        }

        if (entry.source === 'current') {
            CurrentScheduleStore.set({
                ...currentSchedule,
                scheduleName: nextName,
            });
            return;
        }

        if (entry.nonselectedIndex === null) {
            return;
        }

        const updated = [...nonselectedSchedules];
        updated[entry.nonselectedIndex] = {
            ...updated[entry.nonselectedIndex],
            scheduleName: nextName,
        };
        NonselectedScheduleStore.set(updated);
    }

    function deleteSchedule(entry: ScheduleRowEntry) {
        if (entry.source === 'nonselected') {
            if (entry.nonselectedIndex === null) {
                return;
            }

            const updated = [...nonselectedSchedules];
            updated.splice(entry.nonselectedIndex, 1);
            NonselectedScheduleStore.set(updated);

            if (entry.nonselectedIndex < currentDisplayIndex) {
                currentDisplayIndex = Math.max(0, currentDisplayIndex - 1);
            }
            return;
        }

        if (nonselectedSchedules.length === 0) {
            CurrentScheduleStore.set({
                scheduleName: 'Schedule 1',
                selections: [],
                term: currentSchedule.term,
                year: currentSchedule.year,
            });
            currentDisplayIndex = 0;
            return;
        }

        const replacementIndex = Math.min(
            currentDisplayIndex,
            nonselectedSchedules.length - 1
        );
        const replacement = nonselectedSchedules[replacementIndex];

        const updated = [...nonselectedSchedules];
        updated.splice(replacementIndex, 1);
        NonselectedScheduleStore.set(updated);

        CurrentScheduleStore.set(replacement);
        currentDisplayIndex = replacementIndex;
    }

    function toggleGroup(key: string) {
        if (collapsedGroupKeys.includes(key)) {
            collapsedGroupKeys = collapsedGroupKeys.filter((value) => value !== key);
            return;
        }

        collapsedGroupKeys = [...collapsedGroupKeys, key];
    }

    $: {
        if (currentDisplayIndex > nonselectedSchedules.length) {
            currentDisplayIndex = nonselectedSchedules.length;
        }
    }

    let displayRows: ScheduleRowEntry[] = [];
    $: {
        const slot = Math.max(0, Math.min(currentDisplayIndex, nonselectedSchedules.length));
        const rows: ScheduleRowEntry[] = [];

        for (let index = 0; index < nonselectedSchedules.length + 1; index += 1) {
            if (index === slot) {
                rows.push({
                    schedule: currentSchedule,
                    source: 'current',
                    nonselectedIndex: null,
                    displayIndex: index,
                });
                continue;
            }

            const nonselectedIndex = index < slot ? index : index - 1;
            rows.push({
                schedule: nonselectedSchedules[nonselectedIndex],
                source: 'nonselected',
                nonselectedIndex,
                displayIndex: index,
            });
        }

        displayRows = rows;
    }

    let groups: ScheduleGroup[] = [];
    $: {
        const grouped = new Map<string, ScheduleGroup>();

        for (const row of displayRows) {
            const key = `${row.schedule.year}-${row.schedule.term}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    key,
                    label: `${row.schedule.term} ${row.schedule.year}`,
                    term: row.schedule.term,
                    year: row.schedule.year,
                    rows: [],
                });
            }

            grouped.get(key)?.rows.push(row);
        }

        groups = Array.from(grouped.values()).sort((a, b) => {
            if (a.year !== b.year) {
                return b.year - a.year;
            }

            return TERM_SORT_ORDER[b.term] - TERM_SORT_ORDER[a.term];
        });
    }
</script>

<div class='flex w-full flex-col'>
    {#if groups.length === 0}
        <div class='text-sm text-gray-500 px-2 py-1'>No schedules yet</div>
    {/if}

    {#each groups as group}
        <div class='mb-2'>
            <div class='flex items-center justify-between px-1 py-1'>
                <button class='inline-flex items-center gap-1 text-sm text-gray-500'
                        type='button'
                        on:click={() => toggleGroup(group.key)}>
                    <span class='w-4 text-left'>
                        {collapsedGroupKeys.includes(group.key) ? '▸' : '▾'}
                    </span>
                    <span>{group.label}</span>
                </button>

                <button class='inline-flex items-center gap-1 rounded px-2 py-1 text-xs
                                text-gray-600 hover:bg-hoverLight dark:hover:bg-hoverDark'
                        type='button'
                        on:click={() => createNewSchedule(group.term, group.year)}>
                    <PlusOutline class='w-3.5 h-3.5' />
                    Add schedule
                </button>
            </div>

            {#if !collapsedGroupKeys.includes(group.key)}
                <div class='flex flex-col gap-1'>
                    {#each group.rows as row}
                        <div class='flex items-center gap-2 rounded px-2 py-1'
                                class:bg-orange={row.source === 'current'}>
                            <button class='grow truncate text-left text-sm text-gray-700'
                                    class:text-white={row.source === 'current'}
                                    type='button'
                                    on:click={() => selectSchedule(row)}>
                                {row.schedule.scheduleName}
                            </button>

                            <button class='rounded px-2 py-0.5 text-xs text-gray-700
                                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                                    class:text-white={row.source === 'current'}
                                    type='button'
                                    on:click={() => editSchedule(row)}>
                                Edit
                            </button>

                            <button class='ml-auto rounded p-1 hover:bg-hoverLight dark:hover:bg-hoverDark'
                                    type='button'
                                    title={'Delete ' + row.schedule.scheduleName}
                                    on:click={() => deleteSchedule(row)}>
                                <TrashBinOutline
                                    class={`w-4 h-4 ${
                                        row.source === 'current' ? 'text-white' : ''
                                    }`} />
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>
