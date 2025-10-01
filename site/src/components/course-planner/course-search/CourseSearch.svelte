<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { fade } from "svelte/transition";
    import CourseListing from "./CourseListing.svelte";
    import { deptCodeToName, pendingResults, setSearchResults } from "../../../lib/course-planner/CourseSearch";
    import { appendHoveredSection } from "../../../lib/course-planner/Schedule";
    import {
        HoveredSectionStore, 
        CurrentScheduleStore,
        SearchResultsStore,
        DeptSuggestionsStore
    } from "../../../stores/CoursePlannerStores";
    import ScheduleSelector from "./ScheduleSelector.svelte";
    import type { Course } from "@jupiterp/jupiterp";
    import type { ScheduleSelection } from "../../../types";

    let hoveredSection: ScheduleSelection | null;
    HoveredSectionStore.subscribe((hovered) => { hoveredSection = hovered });

    let selections: ScheduleSelection[] = [];
    CurrentScheduleStore.subscribe((stored) => { selections = stored.selections });

    // Variable and function for handling course search input
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
            if (highlightedSuggestionIndex >= 0 && highlightedSuggestionIndex < deptSuggestions.length) {
                event.preventDefault();
                selectDepartment(deptSuggestions[highlightedSuggestionIndex]);
            }
        }
    }

    $: if (searchInput.length <= 1 || deptSuggestions.length <= 1) {
        highlightedSuggestionIndex = -1;
    }

    // Boolean for toggling search menu on smaller screens
    export let courseSearchSelected: boolean = false;

    $: {
        if (hoveredSection) {
            let index = searchResults.findIndex(course => {
                return hoveredSection && 
                            course.courseCode === hoveredSection.section.courseCode;
            });
            if (index === -1) {
                HoveredSectionStore.set(null);
            }
        }
    }

    let totalCredits: number = 0;
    $: if (selections || hoveredSection) {
        totalCredits = 0;
        let selectionsWithHovered = 
                appendHoveredSection(selections, hoveredSection);
        selectionsWithHovered.forEach((selection) => {
            totalCredits += selection.course.minCredits;
        })
    }
</script>

<!-- Layer to exit course search if user taps on the Schedule -->
<!-- Using this method to avoid having to listen to a variable on Schedule -->
{#if courseSearchSelected}
    <button class='fixed w-full bg-black bg-opacity-20 z-[51]
                    lg:hidden'
            style='height: calc(100% - 3rem);'
        in:fade={{ duration: 150 }}
        out:fade={{ duration: 150 }} 
        on:click={() => courseSearchSelected = false}/>
{/if}

<!-- Course Search -->
<div class='lg:flex flex-col xl:min-w-[320px] 2xl:min-w-[400px] 2xl:text-lg
                            lg:min-w-[260px] w-[300px] z-[52] fixed lg:static
                            lg:h-full course-search visible
                            border-r-2 border-divBorderLight
                            dark:border-divBorderDark border-solid py-1 pr-2
                            pl-1 lg:pl-0 lg:ml-1.5 lg:shadow-none
                            bg-bgLight dark:bg-bgDark lg:bg-transparent left-0
                            transition-transform duration-300'
        class:course-search-transition={!courseSearchSelected}
        class:shadow-lg={courseSearchSelected}>
    
    <div class='flex flex-row text-xs ml-1 pb-1 2xl:text-sm'>
        <div>
            Spring 2026
        </div>
        <div class='grow text-right'>
            Credits: {totalCredits}
        </div>
    </div>

    <ScheduleSelector />

    <div class='flex flex-col w-full border-solid relative
                            border-b-2 border-t-2 p-1 lg:px-0
                            border-divBorderLight dark:border-divBorderDark'>
        <input type='text' 
            bind:value={searchInput}
            on:input={() => {setSearchResults(searchInput)}}
            on:keydown={handleSearchKeydown}
            placeholder='Search course codes, ex: "MATH140"'
            class="border-solid border-2 border-outlineLight 
                            dark:border-outlineDark rounded-lg
                            bg-transparent px-2 w-full text-xl
                            lg:text-base lg:placeholder:text-sm
                            placeholder:text-base">
        {#if searchInput.length > 0 && deptSuggestions.length > 1}
            <div class='absolute left-1 right-1 top-full mt-2 rounded-lg border
                        border-outlineLight dark:border-outlineDark
                        bg-bgLight dark:bg-bgDark shadow-lg z-[60]'>
                {#each deptSuggestions as deptOption, index}
                    <button type='button'
                        class={`flex w-full text-left px-3 py-1 text-base lg:text-sm transition-colors
                                hover:bg-outlineLight hover:bg-opacity-20 items-end
                                dark:hover:bg-outlineDark dark:hover:bg-opacity-30 
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
    </div>
    <div class='grow courses-list overflow-y-scroll overflow-x-none
                px-1 lg:pr-1 lg:pl-0'>
        {#each searchResults as courseMatch (courseMatch.courseCode)}
            <CourseListing course={courseMatch} />
        {/each}

        {#if isPendingResults}
            <div class='flex justify-center py-4' aria-live='polite'>
                <span class='h-8 w-8 animate-spin text-center'>
                    Loading...
                </span>
            </div>
        {/if}
    </div>
</div>

<style>
    @media screen and (max-width: 1023px) {
        .course-search {
            height: calc(100svh - 3rem);
        }

        .courses-list {
            height: calc(100svh - 3rem - 2.54166667rem - 2px);
        }

        .course-search-transition {
            transition-property: transform;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
            transform: translateX(calc(-100% - 2px));
        }
    }
</style>
