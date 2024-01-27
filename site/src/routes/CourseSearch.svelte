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
    let courseSearchSelected: boolean = false;
</script>

<!-- Button to toggle course search on mobile -->
<button class='fixed h-5 w-5 top-3 left-5 visible lg:hidden z-[51]'
        on:click={() => {courseSearchSelected = !courseSearchSelected}}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
            class='visible h-full w-full transition 
                    fill-textLight dark:fill-textDark'
            class:hidden={courseSearchSelected}>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"
            class='visible h-full w-full transition 
                    fill-textLight dark:fill-textDark'
            class:hidden={!courseSearchSelected}>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
</button>

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
                            ml-1 lg:ml-1.5 lg:shadow-none
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
                    bind:selections={selections}/>
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