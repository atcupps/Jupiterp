<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { fade } from "svelte/transition";
    import CourseListing from "./CourseListing.svelte";
    import { 
        getCourseLookup, 
        searchCourses 
    } from "../../../lib/course-planner/CourseSearch";
    import { appendHoveredSection } from "../../../lib/course-planner/Schedule";
    import ScheduleButtons from "../schedule/ScheduleManager.svelte";
    import ScheduleManager from "../schedule/ScheduleManager.svelte";

    export let hoveredSection: ScheduleSelection | null;
    export let selections: ScheduleSelection[];

    // Load profs and depts data
    export let data;
    let depts: Department[] = data.departments;

    // Create course lookup table
    const courseLookup = getCourseLookup(depts);

    // Variable and function for handling course search input
    let searchInput = '';
    let searchResults: Course[] = [];
    function handleInput() {
        // Sorting is done to ensure courses are displayed in
        // alphabetical order
        searchResults = searchCourses(searchInput, courseLookup)
                            .sort((a, b) => {
                                return a.code.localeCompare(b.code);
                            });
    }

    export let profsLookup: Record<string, Professor>;

    // Boolean for toggling search menu on smaller screens
    export let courseSearchSelected: boolean = false;

    $: {
        if (hoveredSection) {
            let index = searchResults.findIndex(course => {
                return hoveredSection && 
                            course.code === hoveredSection.courseCode;
            });
            if (index === -1) {
                hoveredSection = null;
            }
        }
    }

    let totalCredits: number = 0;
    $: if (selections || hoveredSection) {
        totalCredits = 0;
        let selectionsWithHovered = 
                appendHoveredSection(selections, hoveredSection);
        selectionsWithHovered.forEach((selection) => {
            totalCredits += selection.credits;
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
                            lg:h-full course-search visible pt-0.5
                            border-r-2 border-divBorderLight
                            dark:border-divBorderDark border-solid pr-2
                            pl-1 lg:pl-0 lg:ml-1.5 lg:shadow-none
                            bg-bgLight dark:bg-bgDark lg:bg-transparent left-0
                            transition-transform duration-300'
        class:course-search-transition={!courseSearchSelected}
        class:shadow-lg={courseSearchSelected}>

    <div class='border-solid border-b-2 border-divBorderLight dark:border-divBorderDark'>
        <div class='flex flex-row text-xs 2xl:text-sm px-2 lg:px-1'>
            <div>
                Fall 2024
            </div>
            <div class='grow text-right'>
                Credits: {totalCredits}
            </div>
        </div>

        <ScheduleManager bind:selections />
    </div>
    
    <div class='flex flex-col w-full border-solid border-b-2 p-1 lg:px-0
                            border-divBorderLight dark:border-divBorderDark'>
        <input type='text' bind:value={searchInput} on:input={handleInput}
            placeholder='Search course codes, ex: "MATH246"'
            class="border-solid border-2 border-outlineLight 
                            dark:border-outlineDark rounded-lg
                            bg-transparent px-2 w-full text-xl
                            lg:text-base lg:placeholder:text-sm
                            placeholder:text-base">
    </div>

    <div class='grow courses-list overflow-y-scroll overflow-x-none
                px-1 lg:pr-1 lg:pl-0'>
        {#each searchResults as courseMatch (courseMatch.code)}
            <CourseListing course={courseMatch} profs={profsLookup}
                    bind:selections={selections} bind:hoveredSection />
        {/each}
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