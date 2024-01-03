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

<div class='p-1 pl-2 my-2 bg-bgSecondaryLight rounded-lg border-2 border-outlineLight border-solid'>
    <b>{course.code}</b>
    <button on:click={toggleSections} class='bg-orange rounded px-1'>
        {displaySections ? 'Hide sections' : 'Show sections'}
    </button>

    {#if displaySections}
        <ul class='list-disc list-inside pl-4'>
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