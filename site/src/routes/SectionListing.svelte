<script lang="ts">
    export let courseCode: string;
    export let section: Section;
    export let selectionsList: ScheduleSelection[] = [];

    let newSelection: ScheduleSelection = {
        courseCode,
        section
    };
    let sectionAdded: boolean = 
        selectionsList.some(obj => selectionEquals(obj));

    // In order for Svelte's reactivity to work properly, `selectionsList`
    // needs to be reassigned instead of using `.push` or `.splice`.
    function addSectionToSchedule() {
        if (!sectionAdded) {
            selectionsList = [...selectionsList, newSelection];
        } else {
            const index = selectionsList.findIndex(obj => 
                        selectionEquals(obj));
            if (index !== -1) {
                selectionsList = [
                    ...selectionsList.slice(0, index),
                    ...selectionsList.slice(index + 1)
                ];
            }
        }
        sectionAdded = !sectionAdded;
        console.log(selectionsList);
    }

    function selectionEquals(s: ScheduleSelection): boolean {
        return s.courseCode === courseCode && 
            s.section.sec_code === section.sec_code;
    }
</script>

<li>
    {section.sec_code}
    <button on:click={addSectionToSchedule}>
        {sectionAdded ? 'Remove section' : 'Add section'}
    </button>
    <ul>
        {#each section.instructors as instructor}
            <li>{instructor}</li>
        {/each}
    </ul>
</li>