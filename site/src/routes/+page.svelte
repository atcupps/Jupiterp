<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import { getCourseLookup, searchCourses } from './courseSearch';
    import CourseListing from './CourseListing.svelte';
    import Schedule from './Schedule.svelte';

    // These imports currently not used but may be in future
    // import { ptLinkFromSlug } from './professors';
    // import { formatClasstime } from './formatting';

    // Load profs and depts data from `+page.ts`
    export let data;
    // let professors: Professor[] = data.professors; (not currently used)
    let depts: Department[] = data.departments;

    // Create course lookup table
    const courseLookup = getCourseLookup(depts);

    // Variable and function for handling course search input
    let searchInput = '';
    let searchResults: Course[] = [];
    function handleInput() {
        searchResults = searchCourses(searchInput, courseLookup);
    }

    // Keep track of chosen sections
    let selectedSections: ScheduleSelection[] = [];
</script>

<h1>Jupiterp</h1>

<p>The ultimate course schedule planning tool for UMD students.</p>

<input type="text" bind:value={searchInput} on:input={handleInput}>

<Schedule bind:selections={selectedSections}/>

{#each searchResults as courseMatch}
    <CourseListing course={courseMatch} bind:selections={selectedSections}/>
{/each}