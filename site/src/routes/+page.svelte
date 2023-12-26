<script lang="ts">
    import { ptLinkFromSlug } from './professors';
    import { formatClasstime } from './formatting';
    import { getCourseLookup, searchCourses } from './courseSearch';
    import CourseListing from './CourseListing.svelte';

    // Load profs and depts data from `+page.ts`
    export let data;
    let professors: Professor[] = data.professors;
    let depts: Department[] = data.departments;

    // Create course lookup table
    const courseLookup = getCourseLookup(depts);

    // Variable and function for handling course search input
    let searchInput = '';
    let searchResults: Course[] = [];
    function handleInput() {
        searchResults = searchCourses(searchInput, courseLookup);
    }
</script>

<h1>Jupiterp</h1>

<p>The ultimate course schedule planning tool for UMD students.</p>

<input type="text" bind:value={searchInput} on:input={handleInput}>

{#each searchResults as courseMatch}
    <CourseListing course={courseMatch}/>
{/each}