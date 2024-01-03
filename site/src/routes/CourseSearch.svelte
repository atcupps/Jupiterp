<script lang='ts'>
    import CourseListing from "./CourseListing.svelte";
    import { getCourseLookup, searchCourses } from "./courseSearch";

    export let selections: ScheduleSelection[];

    // Load profs and depts data
    export let data;
    // let professors: Professor[] = data.professors; (not currently used)
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
</script>

<div class='flex flex-col w-[360px] h-full border-r-2 border-divBorderLight dark:border-divBorderDark border-solid py-2 pr-2'>
    <input type="text" bind:value={searchInput} on:input={handleInput}
        class="border-solid border-2 border-outlineLight dark:border-outlineDark rounded-lg bg-transparent px-2">
    <div class='grow overflow-scroll'>
        {#each searchResults as courseMatch (courseMatch.code)}
            <CourseListing course={courseMatch} bind:selections={selections}/>
        {/each}
    </div>
</div>