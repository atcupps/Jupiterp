<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    type Term = 'Fall' | 'Winter' | 'Spring' | 'Summer';

    interface ScheduleOption {
        id: string,
        label: string,
    }

    export let activeScheduleName: string;
    export let activeTerm: Term;
    export let activeYear: number;
    export let credits: number;
    export let schedules: ScheduleOption[] = [];
    export let activeScheduleId: string = '';
    export let filtersActiveCount: number = 0;

    export let onChangeSchedule: (id: string) => void;
    export let onChangeTerm: (term: Term) => void;
    export let onChangeYear: (year: number) => void;
    export let onOpenFilters: () => void;
    export let onClearFilters: () => void;
    export let onCreateSchedule: () => void;
    export let onDuplicateSchedule: () => void;
    export let onDeleteSchedule: () => void;

    export let minYear: number = 2022;
    export let maxYear: number = new Date().getFullYear();

    const TERMS: Term[] = ['Fall', 'Winter', 'Spring', 'Summer'];

    function handleYearChange(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const parsed = Number(target.value);
        if (!Number.isInteger(parsed)) {
            target.value = String(activeYear);
            return;
        }

        const clamped = Math.max(minYear, Math.min(maxYear, parsed));
        onChangeYear(clamped);
    }

    function handleScheduleChange(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        onChangeSchedule(target.value);
    }
</script>

<section class='rounded-xl border border-outlineLight dark:border-outlineDark
                bg-bgSecondaryLight dark:bg-bgSecondaryDark p-3 mb-2 shadow-sm'>
    <header class='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div class='min-w-0'>
            <h2 class='text-lg font-semibold truncate'>
                {activeScheduleName}
            </h2>
            <p class='text-xs opacity-70'>
                {activeTerm} {activeYear}
            </p>
        </div>

        <div class='flex flex-wrap items-center gap-2'>
            <span class='text-xs rounded-full px-2.5 py-1 border
                        border-outlineLight dark:border-outlineDark
                        bg-bgLight dark:bg-bgDark'>
                Credits: {credits}
            </span>
            <button class='text-xs rounded-md px-2 py-1 border
                            border-outlineLight dark:border-outlineDark
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    on:click={onCreateSchedule}>
                Create Schedule
            </button>
            <button class='text-xs rounded-md px-2 py-1 border
                            border-outlineLight dark:border-outlineDark
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    on:click={onDuplicateSchedule}>
                Duplicate
            </button>
            <button class='text-xs rounded-md px-2 py-1 border
                            border-outlineLight dark:border-outlineDark
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    on:click={onDeleteSchedule}>
                Delete
            </button>
        </div>
    </header>

    <section class='mt-3 rounded-lg border border-divBorderLight dark:border-divBorderDark
                    p-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-wrap'>
        <div class='min-w-[14rem] grow'>
            <label class='text-xs opacity-70 block mb-1' for='schedule-picker'>
                Schedule
            </label>
            <select class='w-full bg-bgLight dark:bg-bgDark rounded-md px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none'
                    id='schedule-picker'
                    value={activeScheduleId}
                    on:change={handleScheduleChange}>
                {#each schedules as schedule}
                    <option value={schedule.id}>{schedule.label}</option>
                {/each}
            </select>
        </div>

        <div>
            <label class='text-xs opacity-70 block mb-1' for='term-selector'>
                Term
            </label>
            <div class='inline-flex rounded-md border border-outlineLight
                        dark:border-outlineDark overflow-hidden'
                id='term-selector'
                role='group'
                aria-label='Term selector'>
                {#each TERMS as term}
                    <button class='px-2 py-1 text-xs border-r border-outlineLight
                                    dark:border-outlineDark last:border-r-0
                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                            class:bg-hoverLight={activeTerm === term}
                            class:dark:bg-hoverDark={activeTerm === term}
                            aria-pressed={activeTerm === term}
                            on:click={() => onChangeTerm(term)}>
                        {term}
                    </button>
                {/each}
            </div>
        </div>

        <div>
            <label class='text-xs opacity-70 block mb-1' for='year-selector'>
                Year
            </label>
            <input class='w-24 bg-bgLight dark:bg-bgDark rounded-md px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none'
                    id='year-selector'
                    type='number'
                    min={minYear}
                    max={maxYear}
                    value={activeYear}
                    on:blur={handleYearChange}>
        </div>

        <div class='lg:ml-auto flex items-end gap-2'>
            <button class='text-xs rounded-md px-2 py-1 border
                            border-outlineLight dark:border-outlineDark
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    on:click={onOpenFilters}>
                Filters ({filtersActiveCount})
            </button>
            {#if filtersActiveCount > 0}
                <button class='text-xs underline opacity-80 hover:opacity-100'
                        on:click={onClearFilters}>
                    Clear
                </button>
            {/if}
        </div>
    </section>
</section>
