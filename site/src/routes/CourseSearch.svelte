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
        getProfsLookup, 
        searchCourses 
    } from "./courseSearch";

    export let hoveredSection: ScheduleSelection | null;
    export let selections: ScheduleSelection[];

    // Load profs and depts data
    export let data;
    let depts: Department[] = data.departments;
    let professors: Professor[] = data.professors;

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

    // Create a professor lookup table
    const profsLookup = getProfsLookup(professors);

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
                            dark:border-divBorderDark border-solid py-2 pr-2
                            pl-1 lg:pl-0 lg:ml-1.5 lg:shadow-none
                            bg-bgLight dark:bg-bgDark lg:bg-transparent left-0
                            transition-transform duration-300'
        class:course-search-transition={!courseSearchSelected}
        class:shadow-lg={courseSearchSelected}>
    <div class='w-full border-solid border-b-2 px-1 lg:px-0
                            border-divBorderLight dark:border-divBorderDark'>
        <input type='text' bind:value={searchInput} on:input={handleInput}
            placeholder='Search course codes, ex: "THET285"'
            class="border-solid border-2 border-outlineLight 
                            dark:border-outlineDark  rounded-lg
                            bg-transparent px-2 mb-2 w-full
                            placeholder:text-sm">
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