<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import { tick } from 'svelte';
    import {
        PlusOutline,
        TrashBinOutline,
    } from 'flowbite-svelte-icons';
    import {
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from '../../stores/CoursePlannerStores';
    import {
        TERM_VALUES,
        MIN_SCHEDULE_YEAR,
        getMaxScheduleYear,
    } from '$lib/course-planner/Terms';
    import Modal from '../layout/Modal.svelte';
    import type { StoredSchedule } from '../../types';

    type Term = StoredSchedule['term'];

    interface ScheduleRowEntry {
        schedule: StoredSchedule,
        source: 'current' | 'nonselected',
        nonselectedIndex: number | null,
        displayIndex: number,
        rowKey: string,
    }

    interface ScheduleGroup {
        key: string,
        label: string,
        term: Term,
        year: number,
        rows: ScheduleRowEntry[],
    }

    interface MutableRow {
        schedule: StoredSchedule,
        source: 'current' | 'nonselected',
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

    let createModalOpen = false;
    let createTerm: Term = TERM_VALUES[TERM_VALUES.length - 1];
    let createYear = getMaxScheduleYear();
    let createScheduleName = '';
    let createNameInput: HTMLInputElement;

    const CREATE_MODAL_TERMS: readonly Term[] = TERM_VALUES;

    let openMenuRowKey: string | null = null;

    let draggedDisplayIndex: number | null = null;
    let dragOverRowIndex: number | null = null;
    let dragOverGroupKey: string | null = null;

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

    function toMutableRows(): MutableRow[] {
        return displayRows.map((row) => {
            return {
                schedule: {
                    scheduleName: row.schedule.scheduleName,
                    selections: row.schedule.selections,
                    term: row.schedule.term,
                    year: row.schedule.year,
                },
                source: row.source,
            };
        });
    }

    function applyRows(rows: MutableRow[]) {
        const currentRowIndex = rows.findIndex((row) => row.source === 'current');
        if (currentRowIndex === -1) {
            return;
        }

        CurrentScheduleStore.set(rows[currentRowIndex].schedule);
        NonselectedScheduleStore.set(
            rows
                .filter((row) => row.source === 'nonselected')
                .map((row) => row.schedule)
        );

        currentDisplayIndex = currentRowIndex;
    }

    function getSmartDefaultName(term: Term, year: number): string {
        const inTerm = displayRows.filter((row) => {
            return row.schedule.term === term && row.schedule.year === year;
        }).length;

        const termLabel = `${term} ${year}`;
        if (inTerm === 0) {
            return `${termLabel} – Main`;
        }

        return `${termLabel} – Plan ${inTerm + 1}`;
    }

    function openCreateScheduleModal(term: Term, year: number) {
        createTerm = term;
        createYear = year;
        createScheduleName = makeUniqueName(getSmartDefaultName(term, year));
        createModalOpen = true;

        tick().then(() => {
            createNameInput?.focus();
            createNameInput?.select();
        });
    }

    function closeCreateScheduleModal() {
        createModalOpen = false;
    }

    function submitCreateSchedule() {
        const trimmed = createScheduleName.trim();
        if (trimmed.length === 0) {
            return;
        }

        const clampedYear = Math.max(
            MIN_SCHEDULE_YEAR,
            Math.min(getMaxScheduleYear(), Number(createYear) || createYear)
        );

        const rows = toMutableRows();
        const currentRowIndex = rows.findIndex((row) => row.source === 'current');
        if (currentRowIndex === -1) {
            return;
        }

        rows[currentRowIndex] = {
            ...rows[currentRowIndex],
            source: 'nonselected',
        };

        const insertAfterIndex = rows.reduce((lastIndex, row, index) => {
            if (row.schedule.term === createTerm && row.schedule.year === createYear) {
                return index;
            }
            return lastIndex;
        }, -1);

        const insertIndex = insertAfterIndex >= 0 ? insertAfterIndex + 1 : rows.length;

        rows.splice(insertIndex, 0, {
            schedule: {
                scheduleName: makeUniqueName(trimmed),
                selections: [],
                term: createTerm,
                year: clampedYear,
            },
            source: 'current',
        });

        applyRows(rows);
        closeCreateScheduleModal();
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

    function renameSchedule(entry: ScheduleRowEntry) {
        openMenuRowKey = null;
        const rawName = window.prompt('Rename schedule:', entry.schedule.scheduleName);
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

    function duplicateSchedule(entry: ScheduleRowEntry) {
        openMenuRowKey = null;
        const rows = toMutableRows();
        const currentRowIndex = rows.findIndex((row) => row.source === 'current');
        if (currentRowIndex === -1) {
            return;
        }

        rows[currentRowIndex] = {
            ...rows[currentRowIndex],
            source: 'nonselected',
        };

        rows.splice(entry.displayIndex + 1, 0, {
            source: 'current',
            schedule: {
                scheduleName: makeUniqueName(`${entry.schedule.scheduleName} Copy`),
                selections: entry.schedule.selections,
                term: entry.schedule.term,
                year: entry.schedule.year,
            },
        });

        applyRows(rows);
    }

    function deleteSchedule(entry: ScheduleRowEntry) {
        openMenuRowKey = null;
        const rows = toMutableRows();
        const deleteIndex = entry.displayIndex;
        rows.splice(deleteIndex, 1);

        if (rows.length === 0) {
            CurrentScheduleStore.set({
                scheduleName: 'Schedule 1',
                selections: [],
                term: currentSchedule.term,
                year: currentSchedule.year,
            });
            NonselectedScheduleStore.set([]);
            currentDisplayIndex = 0;
            return;
        }

        const hasCurrent = rows.some((row) => row.source === 'current');
        if (!hasCurrent) {
            const replacementIndex = Math.min(deleteIndex, rows.length - 1);
            rows.forEach((row, index) => {
                row.source = index === replacementIndex ? 'current' : 'nonselected';
            });
        }

        applyRows(rows);
    }

    function toggleGroup(key: string) {
        if (collapsedGroupKeys.includes(key)) {
            collapsedGroupKeys = collapsedGroupKeys.filter((value) => value !== key);
            return;
        }

        collapsedGroupKeys = [...collapsedGroupKeys, key];
    }

    function moveDraggedTo(targetIndex: number, term: Term, year: number) {
        if (draggedDisplayIndex === null) {
            return;
        }

        const rows = toMutableRows();
        const fromIndex = draggedDisplayIndex;

        if (fromIndex < 0 || fromIndex >= rows.length) {
            return;
        }

        const [moved] = rows.splice(fromIndex, 1);
        moved.schedule = {
            ...moved.schedule,
            term,
            year,
        };

        let insertIndex = targetIndex;
        if (insertIndex > fromIndex) {
            insertIndex -= 1;
        }
        insertIndex = Math.max(0, Math.min(insertIndex, rows.length));

        rows.splice(insertIndex, 0, moved);
        applyRows(rows);
    }

    function handleDragStart(event: DragEvent, row: ScheduleRowEntry) {
        draggedDisplayIndex = row.displayIndex;
        dragOverRowIndex = null;
        dragOverGroupKey = null;

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', row.rowKey);
        }
    }

    function handleDragEnd() {
        draggedDisplayIndex = null;
        dragOverRowIndex = null;
        dragOverGroupKey = null;
    }

    function handleRowDragOver(event: DragEvent, row: ScheduleRowEntry) {
        event.preventDefault();
        dragOverRowIndex = row.displayIndex;
        dragOverGroupKey = null;

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    function handleRowDrop(event: DragEvent, row: ScheduleRowEntry) {
        event.preventDefault();
        moveDraggedTo(row.displayIndex, row.schedule.term, row.schedule.year);
        handleDragEnd();
    }

    function handleGroupDragOver(event: DragEvent, group: ScheduleGroup) {
        event.preventDefault();
        dragOverGroupKey = group.key;
        dragOverRowIndex = null;

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    function handleGroupDrop(event: DragEvent, group: ScheduleGroup) {
        event.preventDefault();
        const lastRowIndex = group.rows.length > 0
            ? group.rows[group.rows.length - 1].displayIndex
            : displayRows.length - 1;
        moveDraggedTo(lastRowIndex + 1, group.term, group.year);
        handleDragEnd();
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
                    rowKey: `current-${currentSchedule.scheduleName}-${index}`,
                });
                continue;
            }

            const nonselectedIndex = index < slot ? index : index - 1;
            const nonselected = nonselectedSchedules[nonselectedIndex];
            rows.push({
                schedule: nonselected,
                source: 'nonselected',
                nonselectedIndex,
                displayIndex: index,
                rowKey: `nonselected-${nonselectedIndex}-${nonselected.scheduleName}`,
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

<svelte:window on:click={() => { openMenuRowKey = null; }} />

<div class='flex w-full flex-col'>
    {#if groups.length === 0}
        <div class='text-sm text-gray-500 px-2 py-1'>No schedules yet</div>
    {/if}

    {#each groups as group}
        <section class='mb-2'>
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
                        on:click={() => openCreateScheduleModal(group.term, group.year)}>
                    <PlusOutline class='w-3.5 h-3.5' />
                    Add schedule
                </button>
            </div>

            {#if !collapsedGroupKeys.includes(group.key)}
                <div class='flex flex-col gap-1'
                     role='list'
                     on:dragover={(event) => handleGroupDragOver(event, group)}
                     on:drop={(event) => handleGroupDrop(event, group)}
                     class:bg-hoverLight={dragOverGroupKey === group.key}
                     class:dark:bg-hoverDark={dragOverGroupKey === group.key}>
                    {#each group.rows as row}
                        <div class='relative flex items-center gap-2 rounded px-2 py-1'
                                role='listitem'
                                class:bg-orange={row.source === 'current'}
                                class:opacity-70={draggedDisplayIndex === row.displayIndex}
                                draggable='true'
                                on:dragstart={(event) => handleDragStart(event, row)}
                                on:dragend={handleDragEnd}
                                on:dragover={(event) => handleRowDragOver(event, row)}
                                on:drop={(event) => handleRowDrop(event, row)}>
                            {#if dragOverRowIndex === row.displayIndex && draggedDisplayIndex !== row.displayIndex}
                                <div class='absolute left-1 right-1 -top-0.5 h-0.5 bg-orange' />
                            {/if}

                            <button class='grow truncate text-left text-sm text-gray-700'
                                    class:text-white={row.source === 'current'}
                                    type='button'
                                    on:click={() => selectSchedule(row)}>
                                {row.schedule.scheduleName}
                            </button>

                            <button class='rounded p-1 hover:bg-hoverLight dark:hover:bg-hoverDark'
                                    class:text-white={row.source === 'current'}
                                    type='button'
                                    title='Schedule actions'
                                    on:click|stopPropagation={(event) => {
                                        event.stopPropagation();
                                        openMenuRowKey = openMenuRowKey === row.rowKey
                                            ? null
                                            : row.rowKey;
                                    }}>
                                ⋯
                            </button>

                            {#if openMenuRowKey === row.rowKey}
                                <div class='absolute right-2 top-[calc(100%+2px)] z-20 min-w-28
                                            rounded-md border border-outlineLight dark:border-outlineDark
                                        bg-bgLight dark:bg-bgDark shadow-lg py-1'>
                                    <button class='w-full text-left px-2 py-1 text-xs flex items-center gap-1
                                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                                            type='button'
                                            on:click={() => renameSchedule(row)}>
                                        Rename
                                    </button>
                                    <button class='w-full text-left px-2 py-1 text-xs flex items-center gap-1
                                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                                            type='button'
                                            on:click={() => duplicateSchedule(row)}>
                                        Duplicate
                                    </button>
                                    <button class='w-full text-left px-2 py-1 text-xs flex items-center gap-1
                                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                                            type='button'
                                            on:click={() => deleteSchedule(row)}>
                                        <TrashBinOutline class='w-3.5 h-3.5' />
                                        Delete
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>
    {/each}
</div>

<Modal open={createModalOpen}
       title='Create new schedule'
       on:close={closeCreateScheduleModal}>
    <form class='flex flex-col gap-3'
          on:submit|preventDefault={submitCreateSchedule}>
        <label class='text-sm'>
            <span class='block text-xs opacity-70 mb-1'>Schedule name</span>
            <input class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                            bg-bgLight dark:bg-bgDark px-2 py-1 outline-none'
                   bind:this={createNameInput}
                   bind:value={createScheduleName} />
        </label>

        <div class='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            <label class='text-sm'>
                <span class='block text-xs opacity-70 mb-1'>Term</span>
                <select class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                                bg-bgLight dark:bg-bgDark px-2 py-1 outline-none'
                        bind:value={createTerm}>
                    {#each CREATE_MODAL_TERMS as term}
                        <option value={term}>{term}</option>
                    {/each}
                </select>
            </label>

            <label class='text-sm'>
                <span class='block text-xs opacity-70 mb-1'>Year</span>
                <input class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                                bg-bgLight dark:bg-bgDark px-2 py-1 outline-none'
                        type='number'
                        min={MIN_SCHEDULE_YEAR}
                        max={getMaxScheduleYear()}
                        bind:value={createYear} />
            </label>
        </div>

        <div class='flex items-center justify-end gap-2 pt-1'>
            <button class='rounded-md px-3 py-1 text-sm border
                            border-outlineLight dark:border-outlineDark
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    type='button'
                    on:click={closeCreateScheduleModal}>
                Cancel
            </button>
            <button class='rounded-md px-3 py-1 text-sm border
                            border-outlineLight dark:border-outlineDark
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    type='submit'>
                Create schedule
            </button>
        </div>
    </form>
</Modal>
