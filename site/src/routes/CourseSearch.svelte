<script lang='ts'>
    import CourseListing from "./CourseListing.svelte";
    import { getCourseLookup, getProfsLookup, searchCourses } from "./courseSearch";

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
</script>

<div class='flex flex-col min-w-[320px]
        h-full border-r-2 border-divBorderLight dark:border-divBorderDark border-solid py-2 pr-2'>
    <div class='w-full border-solid border-b-2 border-divBorderLight dark:border-divBorderDark'>
        <input type="text" bind:value={searchInput} on:input={handleInput}
            class="border-solid border-2 border-outlineLight dark:border-outlineDark 
                    rounded-lg bg-transparent px-2 mb-2 w-full">
    </div>
    <div class='grow overflow-y-scroll overflow-x-none pr-1'>
        {#each searchResults as courseMatch (courseMatch.code)}
            <CourseListing course={courseMatch} profs={profsLookup} bind:selections={selections}/>
        {/each}
    </div>
</div>