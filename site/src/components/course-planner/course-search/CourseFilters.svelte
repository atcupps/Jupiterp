<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
    import { GenEd } from "@jupiterp/jupiterp";
    import {
        AdjustmentsHorizontalOutline,
        AngleDownOutline,
        CloseOutline
    } from "flowbite-svelte-icons";
    import { slide } from "svelte/transition";
    import type { FilterParams } from "../../../types";
    import {
        CourseSearchFilterStore,
        CurrentScheduleStore,
        ResolvedSearchTermYearStore,
        type ResolvedSearchTermYear,
    } from "../../../stores/CoursePlannerStores";
    import {
        matchingStandardizedProfessorNames
    } from "$lib/course-planner/CourseSearch";

    export let appliedFiltersCount = 0;
    export let showFiltersMenu = false;
    export let showHeaderButton = true;
    export let resetNonce = 0;
    let previousResetNonce = resetNonce;
    export let showGenEdMenu = false;
    let genEdSelections: GenEd[] = [];
    let onlyOpenSections = false;
    let instructor: string = '';
    let matchingInstructors: string[] = [];
    let searchTerm: '' | 'Fall' | 'Winter' | 'Spring' | 'Summer' = '';
    let scheduleTerm: 'Fall' | 'Winter' | 'Spring' | 'Summer' = 'Fall';
    let scheduleYear: number = new Date().getFullYear();
    let hasInitializedScheduleTerm = false;
    let resolvedSearchTermYear: ResolvedSearchTermYear | null = null;

    CurrentScheduleStore.subscribe((stored) => {
        const nextScheduleTerm = stored.term;
        const nextScheduleYear = stored.year;

        if (!hasInitializedScheduleTerm) {
            scheduleTerm = nextScheduleTerm;
            scheduleYear = nextScheduleYear;
            searchTerm = nextScheduleTerm;
            hasInitializedScheduleTerm = true;
            return;
        }

        const wasUsingScheduleTerm = searchTerm === scheduleTerm;
        scheduleTerm = nextScheduleTerm;
        scheduleYear = nextScheduleYear;
        if (wasUsingScheduleTerm) {
            searchTerm = nextScheduleTerm;
        }
    });

    ResolvedSearchTermYearStore.subscribe((value) => {
        resolvedSearchTermYear = value;
    });

    $: termOverrideActive = searchTerm.length > 0 && searchTerm !== scheduleTerm;

    const defaultMinCredits = 0;
    const defaultMaxCredits = 20;
    let minCredits: number = defaultMinCredits;
    let maxCredits: number = defaultMaxCredits;

    $: if (resetNonce !== previousResetNonce) {
        previousResetNonce = resetNonce;
        resetFilters();
    }

    $: {
        const params: FilterParams = {
            serverSideFilters: {},
            clientSideFilters: {}
        };
        appliedFiltersCount = 0;

        if (genEdSelections.length > 0) {
            appliedFiltersCount += 1;
            params.serverSideFilters.genEds = genEdSelections
                                .sort((a, b) => a.code.localeCompare(b.code));
        }
        if (minCredits !== 0) {
            appliedFiltersCount += 1;
            params.clientSideFilters.minCredits = minCredits;
        }
        if (maxCredits !== 20) {
            appliedFiltersCount += 1;
            params.clientSideFilters.maxCredits = maxCredits;
        }
        if (onlyOpenSections) {
            appliedFiltersCount += 1;
            params.clientSideFilters.onlyOpen = onlyOpenSections;
        }
        if (termOverrideActive) {
            appliedFiltersCount += 1;
            params.clientSideFilters.searchTerm =
                searchTerm as 'Fall' | 'Winter' | 'Spring' | 'Summer';
        }
        if (instructor.trim().length > 0) {
            appliedFiltersCount += 1;
            matchingInstructors = 
                matchingStandardizedProfessorNames(instructor);
            if (matchingInstructors.length == 1) {
                console.log(matchingInstructors[0]);
                params.serverSideFilters.instructor = matchingInstructors[0];
            }
            else {
                params.serverSideFilters.instructor = undefined;
            }
        } else {
            matchingInstructors = [];
        }

        if (appliedFiltersCount > 0) {
            CourseSearchFilterStore.set({
                ...params,
            });
        } else {
            CourseSearchFilterStore.set({
                serverSideFilters: {},
                clientSideFilters: {}
            });
        }
    }

    function resetFilters() {
        genEdSelections = [];
        minCredits = defaultMinCredits;
        maxCredits = defaultMaxCredits;
        onlyOpenSections = false;
        instructor = '';
        searchTerm = scheduleTerm;
    }
</script>

<div class="flex w-full flex-col
            text-secCodesLight dark:text-[#8892a8]">
    <!-- Filters button -->
    {#if showHeaderButton}
        <div class="flex flex-row items-center gap-1 justify-between
                    px-1 py-0.5 mt-1">
            <button class="grow flex flex-row
                        text-sm items-center rounded-md
                        hover:text-textLight dark:hover:text-textDark"
                    title="Show/hide course search filters"
                    on:click={() => { showFiltersMenu = !showFiltersMenu }}>
                <AdjustmentsHorizontalOutline class="w-4 h-4 mr-1" />
                <!-- format-check exempt 1 -->
                {appliedFiltersCount} filter{appliedFiltersCount === 1 ? '' : 's'} applied
            </button>

            <button class="text-right text-sm
                        hover:text-textLight dark:hover:text-textDark"
                    on:click={resetFilters}
                    title="Clear all filters">
                Clear filters
            </button>
        </div>
    {/if}

    <!-- Filters menu -->
    {#if showFiltersMenu}
        <div class="flex w-full flex-col px-2 py-1 mx-1 my-1 gap-2 text-xs"
            transition:slide>

            <!-- Gen-Eds -->
            <div class="flex flex-row text-xs">
                <span class="whitespace-nowrap min-w-16">
                    Gen-Eds:
                </span>
                
                <div class="flex flex-col grow">
                    <!-- Gen-Ed buttons -->
                    <div class="flex flex-row items-center w-full">
                        <!-- Show/hide gen-eds menu button -->
                         <!-- format-check exempt 21 10 -->
                        <button class="text-left flex flex-row grow
                                    hover:bg-hoverLight dark:hover:bg-divBorderDark
                                    items-center rounded-l-md h-full
                                    border-l border-t border-b border-1
                                    border-secCodesLight dark:border-divBorderDark
                                    focus-visible:ring"
                                title="Show/hide Gen Ed selection menu"
                                on:click={() => { showGenEdMenu = !showGenEdMenu }}>
                            <span class="px-0.5 border-r border-1
                                        border-secCodesDark dark:border-divBorderDark
                                        h-full content-center">
                                <AngleDownOutline class="w-4 h-4" />
                            </span>
                            <span class="px-1 bg-bgLight dark:bg-bgDark w-full">
                                {#if Array.from(genEdSelections).length === 0}
                                    Select Gen Eds
                                {:else}
                                    {Array.from(genEdSelections)
                                        .map(g => g.code).join(', ')}
                                {/if}
                            </span>
                        </button>
                        
                        <!-- Clear gen-ed filters -->
                        <button class="rounded-r-md self-end px-0.5
                                    border border-1 h-full
                                    border-secCodesDark
                                    dark:border-divBorderDark
                                    hover:bg-hoverLight
                                    hover:dark:bg-hoverDark"
                                title="Clear Gen Ed filters"
                                on:click={() => { genEdSelections = []; }}>
                            <CloseOutline class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Gen Ed checkbox menu -->
                    {#if showGenEdMenu}
                        <div class="flex flex-col gap-2
                                    mt-1 py-2"
                             transition:slide={{ duration: 350 }}>

                            <!-- Individual gen-ed checkbox -->
                            <!-- format-check exempt 25 15 -->
                            {#each GenEd.list() as genEd}
                                <div class="flex flex-row items-center">
                                    <input type="checkbox"
                                        checked={genEdSelections.includes(genEd)}
                                        id={"gened-" + genEd.code}
                                        class="mr-2 mt-0.5 rounded-md text-orange
                                            border-secCodesDark dark:border-divBorderDark
                                            bg-divBorderLight dark:bg-divBorderDark
                                            focus:ring-orange
                                            hover:cursor-pointer" 
                                        on:click={() => {
                                            if (genEdSelections.includes(genEd)) {
                                                genEdSelections = 
                                                    genEdSelections.filter(g => g !== genEd);
                                            } else {
                                                genEdSelections = [...genEdSelections, genEd];
                                            }
                                        }}/>
                                    <label for={"gened-" + genEd.code}
                                        class="text-xs hover:cursor-pointer">
                                        {genEd.code} - {genEd.name}
                                    </label>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Credits -->
            <div class="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <!-- Min credits -->
                <div class="flex flex-row items-center text-xs">
                    <span class="min-w-16">
                        Min credits: 
                    </span>
                    <input
                        type="number" min="0" 
                        step="1" max="20" placeholder="0"
                        bind:value={minCredits}
                        class="border border-secCodesDark
                                dark:border-divBorderDark
                                rounded-md w-12 px-1 py-0 text-xs
                                bg-bgLight dark:bg-bgDark
                                focus:outline-none focus:ring
                                text-sm"/>
                </div>

                <!-- Max credits -->
                <div class="flex flex-row items-center text-xs">
                    <span class="min-w-16">
                        Max credits: 
                    </span>
                    <input
                        type="number" min="0" max="20"
                        step="1" placeholder="10"
                        bind:value={maxCredits}
                        class="border border-secCodesDark
                                dark:border-divBorderDark
                                rounded-md w-12 px-1 py-0
                                bg-bgLight dark:bg-bgDark text-xs
                                focus:outline-none focus:ring
                                text-sm"/>
                </div>
            </div>

            <!-- Instructor -->
            <div class="flex flex-row text-xs">
                <span class="min-w-16">
                    Instructor:
                </span>
                <div class="flex flex-col grow">
                    <!-- Instructor input box -->
                    <div class="flex flex-row grow">
                        <div class="grow border-l border-t
                                    border-b border-secCodesDark
                                    dark:border-divBorderDark rounded-l-md">
                            <input class="rounded-l-md border-none
                                            w-full px-2 py-0 text-xs
                                            focus:outline-none focus:ring
                                            bg-bgLight dark:bg-bgDark"
                                type="text" placeholder="Instructor name"
                                bind:value={instructor} />
                        </div>
                        
                        <button class="rounded-r-md self-end px-0.5
                                        border border-1 h-full
                                        border-secCodesDark
                                        dark:border-divBorderDark
                                        hover:bg-hoverLight
                                        hover:dark:bg-hoverDark"
                                    title="Clear Gen Ed filters"
                                    on:click={() => { instructor = '';}}>
                            <CloseOutline class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Matching instructors list -->
                    {#if (matchingInstructors.length > 1) ||
                            (matchingInstructors.length == 1 
                                && matchingInstructors[0] !== instructor)}
                        <div class="w-full flex flex-col max-h-40
                                    overflow-y-auto mt-1 rounded-md
                                    border border-outlineLight
                                    dark:border-outlineDark
                                    bg-bgLight dark:bg-bgDark
                                    shadow-lg z-[60]">
                            {#each matchingInstructors as profName}
                                <button class="px-2 py-1 text-left
                                            hover:bg-outlineLight
                                            hover:bg-opacity-20
                                            dark:hover:bg-outlineDark
                                            dark:hover:bg-opacity-30
                                            cursor-pointer"
                                    on:click={
                                        () => { instructor = profName; }
                                    }>
                                    {profName}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Search term -->
            <div class="flex flex-row text-xs">
                <span class="min-w-16">
                    Term:
                </span>
                <div class="flex flex-col grow">
                    <select class="border border-secCodesDark
                                    dark:border-divBorderDark
                                    rounded-md px-2 py-1 text-xs
                                    bg-bgLight dark:bg-bgDark
                                    focus:outline-none focus:ring"
                            bind:value={searchTerm}>
                        <option value="Fall">Fall</option>
                        <option value="Winter">Winter</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                    </select>

                    {#if termOverrideActive}
                        <div class="mt-1 text-[11px] leading-tight opacity-80">
                            {#if resolvedSearchTermYear}
                                Using {resolvedSearchTermYear.term} {resolvedSearchTermYear.year}
                                ({resolvedSearchTermYear.semester})
                            {:else}
                                Using {searchTerm} {scheduleYear} (fallback)
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Total class size -->
            <!-- Considering this, add later potentially -->

            <!-- Only open sections -->
            <div class="flex flex-row items-center text-xs">
                <input type="checkbox" id="only-open-sections"
                    class="mr-2 rounded-md text-orange
                        border-secCodesDark dark:border-divBorderDark
                        bg-divBorderLight dark:bg-divBorderDark
                        focus:ring-orange
                        hover:cursor-pointer"
                    bind:checked={onlyOpenSections} />
                <label for="only-open-sections"
                    class="text-xs hover:cursor-pointer">
                    Only show open sections
                </label>
            </div>
        </div>
    {/if}
</div>
