<script lang="ts">
    export let course: Course;
    export let sections: Section[];

    let displaySections = false;

    function toggleSections() {
        displaySections = !displaySections;
    }

    function addSectionToSchedule(newSection: Section) {
        sections.push(newSection);
        console.log(sections);
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
                    <li>
                        {section.sec_code}
                        <button on:click={addSectionToSchedule(section.class_meetings)}>
                            Add section
                        </button>
                        <ul>
                            {#each section.instructors as instructor}
                                <li>{instructor}</li>
                            {/each}
                        </ul>
                    </li>
                {/each}
            {:else}
                <li>No sections</li>
            {/if}
        </ul>
    {/if}
</div>