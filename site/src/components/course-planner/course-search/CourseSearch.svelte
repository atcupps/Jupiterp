<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import { onMount } from 'svelte';
    import CourseListing from "./CourseListing.svelte";
    import ScheduleSelector from "../ScheduleSelector.svelte";
    import {
        deptCodeToName,
        pendingResults,
        setSearchResults
    } from "../../../lib/course-planner/CourseSearch";
    import {
        HoveredSectionStore,
        SearchResultsStore,
        DeptSuggestionsStore,
    } from "../../../stores/CoursePlannerStores";
    import type { Course } from "@jupiterp/jupiterp";
    import type { ScheduleSelection } from "../../../types";
    import CourseFilters from "./CourseFilters.svelte";
    import SolarSystemLoader from "../SolarSystemLoader.svelte";

    const FILTER_SCROLL_COLLAPSE_THRESHOLD = 100;
    const MIN_SCHEDULE_PANE_HEIGHT = 140;
    const MIN_RESULTS_PANE_HEIGHT = 180;
    const SPLIT_HANDLE_HEIGHT = 8;

    export let sidebarWidth: number = 300;

    let hoveredSection: ScheduleSelection | null;
    HoveredSectionStore.subscribe((hovered) => { hoveredSection = hovered });

    let searchInput = '';
    let searchResults: Course[] = [];
    SearchResultsStore.subscribe((results) => { searchResults = results });

    let deptSuggestions: string[] = [];
    let highlightedSuggestionIndex = -1;
    DeptSuggestionsStore.subscribe((suggestions) => {
        deptSuggestions = suggestions;
        if (suggestions.length === 0) {
            highlightedSuggestionIndex = -1;
        } else if (highlightedSuggestionIndex >= suggestions.length) {
            highlightedSuggestionIndex = suggestions.length - 1;
        }
    });

    let isPendingResults = false;
    $: if (searchInput.length > 0 && searchResults.length === 0) {
        isPendingResults = pendingResults();
    } else {
        isPendingResults = false;
    }

    let genEdMenuOpen = false;
    let courseSearchSplitContainer: HTMLDivElement;
    let schedulePaneHeight = 360;
    let resizingSchedulePane = false;

    onMount(() => {
        if (!courseSearchSplitContainer) {
            return;
        }

        schedulePaneHeight = Math.round(
            courseSearchSplitContainer.getBoundingClientRect().height / 2
        );
        clampSchedulePaneHeight(schedulePaneHeight);
    });

    function clampSchedulePaneHeight(nextHeight: number) {
        if (!courseSearchSplitContainer) {
            return;
        }

        const bounds = courseSearchSplitContainer.getBoundingClientRect();
        const maxSchedulePaneHeight = Math.max(
            MIN_SCHEDULE_PANE_HEIGHT,
            bounds.height - MIN_RESULTS_PANE_HEIGHT - SPLIT_HANDLE_HEIGHT
        );
        schedulePaneHeight = Math.max(
            MIN_SCHEDULE_PANE_HEIGHT,
            Math.min(maxSchedulePaneHeight, nextHeight)
        );
    }

    function startSchedulePaneResize(event: MouseEvent) {
        event.preventDefault();
        resizingSchedulePane = true;
    }

    function stopSchedulePaneResize() {
        resizingSchedulePane = false;
    }

    function onSchedulePaneResize(event: MouseEvent) {
        if (!resizingSchedulePane || !courseSearchSplitContainer) {
            return;
        }

        const bounds = courseSearchSplitContainer.getBoundingClientRect();
        const proposedHeight = event.clientY - bounds.top;
        clampSchedulePaneHeight(proposedHeight);
    }

    function selectDepartment(dept: string) {
        searchInput = dept;
        highlightedSuggestionIndex = -1;
        setSearchResults(dept);
    }

    function handleSearchKeydown(event: KeyboardEvent) {
        if (deptSuggestions.length <= 1 || searchInput.length <= 1) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            highlightedSuggestionIndex =
                highlightedSuggestionIndex + 1 < deptSuggestions.length
                    ? highlightedSuggestionIndex + 1
                    : 0;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            highlightedSuggestionIndex =
                highlightedSuggestionIndex > 0
                    ? highlightedSuggestionIndex - 1
                    : deptSuggestions.length - 1;
        } else if (event.key === 'Enter') {
            if (highlightedSuggestionIndex >= 0 &&
                    highlightedSuggestionIndex < deptSuggestions.length) {
                event.preventDefault();
                selectDepartment(deptSuggestions[highlightedSuggestionIndex]);
            }
        }
    }

    $: if (searchInput.length <= 1 || deptSuggestions.length <= 1) {
        highlightedSuggestionIndex = -1;
    }

    $: {
        if (hoveredSection) {
            const index = searchResults.findIndex((course) => {
                return hoveredSection &&
                    course.courseCode === hoveredSection.section.courseCode;
            });
            if (index === -1) {
                HoveredSectionStore.set(null);
            }
        }
    }

    let scrollAcc = 0;
    function handleResultsScroll(event: WheelEvent) {
        if (!genEdMenuOpen) {
            return;
        }

        scrollAcc += event.deltaY;
        if (scrollAcc < 0) {
            scrollAcc = 0;
        }
        if (scrollAcc >= FILTER_SCROLL_COLLAPSE_THRESHOLD) {
            genEdMenuOpen = false;
            scrollAcc = 0;
        }
    }
</script>

<svelte:window on:mousemove={onSchedulePaneResize}
    on:mouseup={stopSchedulePaneResize} />

<div class='flex flex-col 2xl:text-lg
                w-[var(--sidebar-width)] min-w-[var(--sidebar-width)] max-w-[var(--sidebar-width)]
                h-full course-search
                            border-r-2 border-divBorderLight
                            dark:border-divBorderDark border-solid py-1 pr-2
                pl-1 shadow-none
                bg-bgLight dark:bg-bgDark'
    style='--sidebar-width: {Math.max(180, Math.min(560, sidebarWidth))}px;'
    >

    <div class='flex grow min-h-0 flex-col'
        bind:this={courseSearchSplitContainer}
        class:select-none={resizingSchedulePane}>

        <div class='bg-white dark:bg-bgDark px-2 py-2 mb-1 overflow-y-auto
                    min-h-[140px]'
            style='height: {schedulePaneHeight}px;'>
            <div class='w-full rounded-md px-2 py-1 text-sm'>
                <span class='font-semibold'>Schedules</span>
            </div>

            <div class='pt-2'>
                <ScheduleSelector />
            </div>
        </div>

        <button class='flex h-2 w-full cursor-row-resize items-center justify-center
                        rounded-sm transition-colors
                        hover:bg-hoverLight dark:hover:bg-hoverDark'
                type='button'
                aria-label='Resize schedules and course search panes'
                on:mousedown={startSchedulePaneResize}>
            <div class='h-px w-full bg-divBorderLight dark:bg-divBorderDark
                        transition-colors' />
        </button>

        <div class='flex min-h-0 grow flex-col w-full border-solid relative
                            border-b-2 border-t-2 p-1
                            border-divBorderLight dark:border-divBorderDark'>
            <input type='text'
                bind:value={searchInput}
                on:input={() => {setSearchResults(searchInput)}}
                on:keydown={handleSearchKeydown}
                placeholder='Search course codes, ex: "MATH140"'
                class='border-solid border-2 border-outlineLight
                            dark:border-outlineDark rounded-lg
                            bg-transparent px-2 w-full text-xl
                            lg:text-base lg:placeholder:text-sm
                            placeholder:text-base py-0'>

            <CourseFilters bind:showGenEdMenu={genEdMenuOpen} />
        </div>

        <div class='grow min-h-0 courses-list overflow-y-scroll overflow-x-none
                px-1'
            on:wheel={handleResultsScroll}>

            {#if searchInput.length > 0 && deptSuggestions.length > 1}
                <div class='mt-2 rounded-lg border
                        border-outlineLight dark:border-outlineDark
                        bg-bgLight dark:bg-bgDark shadow-lg'>
                    {#each deptSuggestions as deptOption, index}
                        <button type='button'
                        class={`flex w-full text-left px-3 py-1
                                text-base lg:text-sm transition-colors
                                hover:bg-outlineLight
                                hover:bg-opacity-20 items-end
                                dark:hover:bg-outlineDark
                                dark:hover:bg-opacity-30
                                ${highlightedSuggestionIndex === index ?
                                    `bg-outlineLight bg-opacity-20
                                    dark:bg-outlineDark dark:bg-opacity-30`
                                    : ''}`}
                            on:mouseenter={() => { highlightedSuggestionIndex = index; }}
                            on:click={() => selectDepartment(deptOption)}>
                            <span class='font-black min-w-[17%] shrink-0'>
                                {deptOption}
                            </span>
                            <span class='text-xs inline-block italic grow truncate'>
                                {deptCodeToName[deptOption]}
                            </span>
                        </button>
                    {/each}
                </div>
            {/if}

            {#each searchResults as courseMatch (courseMatch.courseCode)}
                <CourseListing course={courseMatch} />
            {/each}

            {#if isPendingResults}
                <div class='flex justify-center items-center py-8'>
                    <SolarSystemLoader size={120} color='currentColor' />
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
</style>
