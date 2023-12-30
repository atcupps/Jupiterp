<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import SectionListing from "./SectionListing.svelte";

    export let course: Course;
    export let selections: ScheduleSelection[];

    let displaySections = false;
    displaySections = false;

    function toggleSections() {
        displaySections = !displaySections;
    }
</script>

<div>
    {course.code}
    <button on:click={toggleSections}>
        {displaySections ? 'Hide sections' : 'Show sections'}
    </button>

    {#if displaySections}
        <ul>
            {#if course.sections != null}
                {#each course.sections as section}
                    <SectionListing courseCode={course.code} 
                        section={section} bind:selectionsList={selections} />
                {/each}
            {:else}
                <li>No sections</li>
            {/if}
        </ul>
    {/if}
</div>