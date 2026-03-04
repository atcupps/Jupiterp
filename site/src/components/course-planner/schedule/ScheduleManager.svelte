<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import {
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from '../../../stores/CoursePlannerStores';
    import { uniqueScheduleName } from '$lib/course-planner/ScheduleSelector';
    import { MIN_SCHEDULE_YEAR, getMaxScheduleYear } from '$lib/course-planner/Terms';
    import type { StoredSchedule } from '../../../types';

    export let sidebarWidth = 300;

    type Term = StoredSchedule['term'];
    type ContextTarget = 'background' | 'group' | 'row';

    interface Row {
        id: string,
        schedule: StoredSchedule,
        isCurrent: boolean,
    }

    interface Group {
        key: string,
        label: string,
        term: Term,
        year: number,
        rows: Row[],
    }

    const TERM_ORDER: Record<Term, number> = {
        Fall: 4,
        Spring: 3,
        Winter: 2,
        Summer: 1,
    };

    let currentSchedule: StoredSchedule = {
        scheduleName: 'Schedule 1',
        selections: [],
        term: 'Fall',
        year: getMaxScheduleYear(),
    };
    let nonselectedSchedules: StoredSchedule[] = [];

    CurrentScheduleStore.subscribe((stored) => {
        currentSchedule = stored;
    });

    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    let collapsedGroupKeys: string[] = [];

    let contextOpen = false;
    let contextX = 0;
    let contextY = 0;
    let contextTarget: ContextTarget = 'background';
    let contextRowId: string | null = null;
    let contextTerm: Term = 'Fall';
    let contextYear = getMaxScheduleYear();

    let editRowId: string | null = null;
    let editName = '';
    let editTerm: Term = 'Fall';
    let editYear = getMaxScheduleYear();

    let draggedRowId: string | null = null;

    function clampYear(year: number): number {
        const max = getMaxScheduleYear();
        return Math.max(MIN_SCHEDULE_YEAR, Math.min(max, year));
    }

    function rowCredits(schedule: StoredSchedule): number {
        let total = 0;
        for (const selection of schedule.selections) {
            total += selection.course.minCredits;
        }
        return total;
    }

    function parseNonselectedIndex(rowId: string): number | null {
        if (!rowId.startsWith('nonselected-')) {
            return null;
        }

        const raw = rowId.replace('nonselected-', '');
        const parsed = Number(raw);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed >= nonselectedSchedules.length) {
            return null;
        }
        return parsed;
    }

    $: rows = [
        {
            id: 'current',
            schedule: currentSchedule,
            isCurrent: true,
        },
        ...nonselectedSchedules.map((schedule, index) => {
            return {
                id: `nonselected-${index}`,
                schedule,
                isCurrent: false,
            };
        })
    ];

    $: {
        const grouped = new Map<string, Group>();
        for (const row of rows) {
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
            return TERM_ORDER[b.term] - TERM_ORDER[a.term];
        });
    }

    let groups: Group[] = [];

    function setCurrentSchedule(next: StoredSchedule) {
        CurrentScheduleStore.set(next);
    }

    function setNonselectedSchedules(next: StoredSchedule[]) {
        NonselectedScheduleStore.set(next);
    }

    function selectSchedule(rowId: string) {
        if (rowId === 'current') {
            return;
        }

        const targetIndex = parseNonselectedIndex(rowId);
        if (targetIndex === null) {
            return;
        }

        const target = nonselectedSchedules[targetIndex];
        const oldCurrent = currentSchedule;

        const updated = [...nonselectedSchedules];
        updated.splice(targetIndex, 1);
        updated.unshift(oldCurrent);

        setNonselectedSchedules(updated);
        setCurrentSchedule(target);
    }

    function createSchedule(term: Term, year: number, suggestedName = 'New schedule') {
        const oldCurrent = currentSchedule;
        const updated = [oldCurrent, ...nonselectedSchedules];
        const nextName = uniqueScheduleName(suggestedName, 'New ', updated);

        setNonselectedSchedules(updated);
        setCurrentSchedule({
            scheduleName: nextName,
            selections: [],
            term,
            year: clampYear(year),
        });
        editRowId = 'current';
        editName = nextName;
        editTerm = term;
        editYear = clampYear(year);
    }

    function duplicateRow(rowId: string) {
        const source = rowId === 'current'
            ? currentSchedule
            : nonselectedSchedules[parseNonselectedIndex(rowId) ?? -1];
        if (!source) {
            return;
        }

        const updated = [
            {
                scheduleName: source.scheduleName,
                selections: source.selections,
                term: source.term,
                year: source.year,
            },
            ...nonselectedSchedules,
        ];

        setNonselectedSchedules(updated);
        setCurrentSchedule({
            scheduleName: uniqueScheduleName(source.scheduleName, 'Copy of ', updated),
            selections: source.selections,
            term: source.term,
            year: source.year,
        });
    }

    function deleteRow(rowId: string) {
        if (rowId === 'current') {
            if (nonselectedSchedules.length === 0) {
                setCurrentSchedule({
                    scheduleName: 'Schedule 1',
                    selections: [],
                    term: currentSchedule.term,
                    year: currentSchedule.year,
                });
                return;
            }

            const [nextCurrent, ...remaining] = nonselectedSchedules;
            setNonselectedSchedules(remaining);
            setCurrentSchedule(nextCurrent);
            return;
        }

        const index = parseNonselectedIndex(rowId);
        if (index === null) {
            return;
        }

        const updated = [...nonselectedSchedules];
        updated.splice(index, 1);
        setNonselectedSchedules(updated);
    }

    function confirmDeleteRow(rowId: string) {
        if (!window.confirm('Delete this schedule? This cannot be undone.')) {
            return;
        }
        deleteRow(rowId);
    }

    function startInlineEdit(row: Row) {
        editRowId = row.id;
        editName = row.schedule.scheduleName;
        editTerm = row.schedule.term;
        editYear = row.schedule.year;
    }

    function cancelInlineEdit() {
        editRowId = null;
    }

    function saveInlineEdit() {
        if (!editRowId) {
            return;
        }

        const nextNameRaw = editName.trim().length > 0 ? editName.trim() : 'New schedule';
        const nextYear = clampYear(editYear);

        if (editRowId === 'current') {
            setCurrentSchedule({
                scheduleName: nextNameRaw,
                selections: currentSchedule.selections,
                term: editTerm,
                year: nextYear,
            });
            editRowId = null;
            return;
        }

        const index = parseNonselectedIndex(editRowId);
        if (index === null) {
            editRowId = null;
            return;
        }

        const updated = [...nonselectedSchedules];
        updated[index] = {
            scheduleName: nextNameRaw,
            selections: updated[index].selections,
            term: editTerm,
            year: nextYear,
        };
        setNonselectedSchedules(updated);
        editRowId = null;
    }

    function toggleGroup(groupKey: string) {
        if (collapsedGroupKeys.includes(groupKey)) {
            collapsedGroupKeys = collapsedGroupKeys.filter((key) => key !== groupKey);
            return;
        }

        collapsedGroupKeys = [...collapsedGroupKeys, groupKey];
    }

    function openContextMenu(event: MouseEvent, target: ContextTarget, term: Term,
                            year: number, rowId: string | null = null) {
        event.preventDefault();
        contextOpen = true;
        contextX = event.clientX;
        contextY = event.clientY;
        contextTarget = target;
        contextRowId = rowId;
        contextTerm = term;
        contextYear = year;
    }

    function closeContextMenu() {
        contextOpen = false;
    }

    function handleContextAction(action: 'new' | 'rename' | 'change' | 'duplicate' | 'delete') {
        if (action === 'new') {
            createSchedule(contextTerm, contextYear);
        } else if (contextRowId) {
            if (action === 'rename' || action === 'change') {
                const row = rows.find((item) => item.id === contextRowId);
                if (row) {
                    startInlineEdit(row);
                }
            } else if (action === 'duplicate') {
                duplicateRow(contextRowId);
            } else if (action === 'delete') {
                deleteRow(contextRowId);
            }
        }

        closeContextMenu();
    }

    function startRowDrag(rowId: string) {
        draggedRowId = rowId;
    }

    function dropOnRow(targetRowId: string) {
        if (!draggedRowId || draggedRowId === targetRowId) {
            return;
        }

        const fromIndex = parseNonselectedIndex(draggedRowId);
        const toIndex = parseNonselectedIndex(targetRowId);
        if (fromIndex === null || toIndex === null) {
            draggedRowId = null;
            return;
        }

        const updated = [...nonselectedSchedules];
        const [moved] = updated.splice(fromIndex, 1);
        const adjustedTarget = fromIndex < toIndex ? toIndex - 1 : toIndex;
        updated.splice(adjustedTarget, 0, moved);
        setNonselectedSchedules(updated);
        draggedRowId = null;
    }

    function dropOnGroup(group: Group) {
        if (!draggedRowId) {
            return;
        }

        const fromIndex = parseNonselectedIndex(draggedRowId);
        if (fromIndex === null) {
            draggedRowId = null;
            return;
        }

        const updated = [...nonselectedSchedules];
        const [moved] = updated.splice(fromIndex, 1);
        const rewritten: StoredSchedule = {
            scheduleName: moved.scheduleName,
            selections: moved.selections,
            term: group.term,
            year: group.year,
        };
        updated.push(rewritten);
        setNonselectedSchedules(updated);
        draggedRowId = null;
    }

    function onYearEditInput(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const parsed = Number(target.value);
        if (!Number.isInteger(parsed)) {
            return;
        }
        editYear = parsed;
    }

</script>

<svelte:window on:click={closeContextMenu} />

<div class='w-full h-full flex flex-col'>
    <div class='flex flex-row items-center gap-2 pb-2'>
        <button class='rounded-md px-3 py-1 text-sm border
                        border-outlineLight dark:border-outlineDark
                        hover:bg-hoverLight dark:hover:bg-hoverDark'
                class:add-schedule-button={true}
                on:click={() => createSchedule(currentSchedule.term, currentSchedule.year)}>
            + New Schedule
        </button>
    </div>

    <div class='h-full min-h-0'>
        <section class='schedule-list-pane rounded-xl border border-outlineLight dark:border-outlineDark
                bg-bgSecondaryLight dark:bg-bgSecondaryDark p-2
            overflow-y-auto min-h-0 shrink-0'
            style='width: {Math.max(180, Math.min(560, sidebarWidth))}px;'
                role='group'
                on:contextmenu={(event) => {
                    openContextMenu(
                        event,
                        'background',
                        currentSchedule.term,
                        currentSchedule.year
                    );
                }}>
            {#each groups as group}
                <div class='mb-2 rounded-lg border border-divBorderLight
                            dark:border-divBorderDark'>
                    <button class='w-full text-left px-2 py-1 text-sm font-semibold
                                    hover:bg-hoverLight dark:hover:bg-hoverDark
                                    flex items-center justify-between'
                            on:click={() => toggleGroup(group.key)}
                            on:contextmenu={(event) => {
                                openContextMenu(event, 'group', group.term, group.year);
                            }}>
                        <span>{group.label}</span>
                        <span class='text-xs opacity-70'>
                            {collapsedGroupKeys.includes(group.key) ? '+' : '-'}
                        </span>
                    </button>

                    {#if !collapsedGroupKeys.includes(group.key)}
                        <div class='p-1'
                            role='group'
                            on:dragover|preventDefault
                            on:drop={() => dropOnGroup(group)}>
                            {#each group.rows as row}
                                <div class='rounded-md border px-2 py-1 mb-1
                                            border-outlineLight dark:border-outlineDark
                                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                                    role='group'
                                    class:bg-hoverLight={row.isCurrent}
                                    class:dark:bg-hoverDark={row.isCurrent}
                                    draggable={!row.isCurrent}
                                    on:dragstart={() => startRowDrag(row.id)}
                                    on:dragover|preventDefault
                                    on:drop={() => dropOnRow(row.id)}
                                    on:contextmenu={(event) => {
                                        openContextMenu(
                                            event,
                                            'row',
                                            row.schedule.term,
                                            row.schedule.year,
                                            row.id
                                        );
                                    }}>

                                    {#if editRowId === row.id}
                                        <div class='flex flex-col gap-1'>
                                            <input class='text-sm rounded px-2 py-1 border
                                                            border-outlineLight dark:border-outlineDark
                                                            bg-bgLight dark:bg-bgDark outline-none'
                                                bind:value={editName}>
                                            <div class='flex flex-row gap-1'>
                                                <select class='text-xs rounded px-1 py-1 border
                                                                border-outlineLight dark:border-outlineDark
                                                                bg-bgLight dark:bg-bgDark outline-none'
                                                        bind:value={editTerm}>
                                                    <option value='Fall'>Fall</option>
                                                    <option value='Winter'>Winter</option>
                                                    <option value='Spring'>Spring</option>
                                                    <option value='Summer'>Summer</option>
                                                </select>
                                                <input class='text-xs rounded px-1 py-1 border
                                                                border-outlineLight dark:border-outlineDark
                                                                bg-bgLight dark:bg-bgDark outline-none w-20'
                                                        type='number'
                                                        min={MIN_SCHEDULE_YEAR}
                                                        max={getMaxScheduleYear()}
                                                        value={editYear}
                                                        on:input={onYearEditInput}>
                                                <input class='text-xs rounded px-1 py-1 border
                                                        border-outlineLight dark:border-outlineDark
                                                        bg-bgLight dark:bg-bgDark outline-none w-20 opacity-75'
                                                    type='number'
                                                    value={rowCredits(row.schedule)}
                                                    disabled>
                                            </div>
                                            <div class='flex flex-row gap-1'>
                                                <button class='text-xs rounded px-2 py-1 border
                                                                border-outlineLight dark:border-outlineDark
                                                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                                                        on:click={saveInlineEdit}>
                                                    Save
                                                </button>
                                                <button class='text-xs rounded px-2 py-1 border
                                                                border-outlineLight dark:border-outlineDark
                                                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                                                        on:click={cancelInlineEdit}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    {:else}
                                        <button class='w-full text-left'
                                                on:click={() => selectSchedule(row.id)}>
                                            <div class='text-sm font-semibold truncate'>
                                                {row.schedule.scheduleName}
                                                {#if row.isCurrent}
                                                    <span class='text-[11px] ml-1 px-1.5 py-0.5 rounded-full
                                                                    border border-outlineLight dark:border-outlineDark'>Now viewing</span>
                                                {/if}
                                            </div>
                                            <div class='text-xs opacity-70'>
                                                {row.schedule.term} {row.schedule.year} ·
                                                Credits {rowCredits(row.schedule)}
                                            </div>
                                        </button>
                                        <div class='mt-1 flex flex-row gap-1'>
                                            <button class='text-xs rounded px-2 py-1 border
                                                            border-outlineLight dark:border-outlineDark
                                                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                                                    on:click={() => startInlineEdit(row)}>
                                                Edit
                                            </button>
                                            <button class='text-xs rounded px-2 py-1 border
                                                            border-outlineLight dark:border-outlineDark
                                                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                                                    class:delete-button={true}
                                                    on:click={() => confirmDeleteRow(row.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </section>
    </div>

    {#if contextOpen}
        <div class='schedule-context-menu fixed z-[80] rounded-md border border-outlineLight
                    dark:border-outlineDark bg-bgLight dark:bg-bgDark
                    shadow-lg py-1 text-sm'
            role='menu'
            tabindex='-1'
            style='left: {contextX}px; top: {contextY}px;'
            on:mousedown|stopPropagation>
            {#if contextTarget === 'background' || contextTarget === 'group'}
                <button class='block w-full text-left px-3 py-1
                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                        on:click={() => handleContextAction('new')}>
                    New schedule in this semester
                </button>
            {/if}

            {#if contextTarget === 'row'}
                <button class='block w-full text-left px-3 py-1
                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                        on:click={() => handleContextAction('rename')}>
                    Rename
                </button>
                <button class='block w-full text-left px-3 py-1
                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                        on:click={() => handleContextAction('change')}>
                    Change term/year
                </button>
                <button class='block w-full text-left px-3 py-1
                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                        on:click={() => handleContextAction('duplicate')}>
                    Duplicate
                </button>
                <button class='block w-full text-left px-3 py-1
                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                        on:click={() => handleContextAction('delete')}>
                    Delete
                </button>
            {/if}
        </div>
    {/if}
</div>
