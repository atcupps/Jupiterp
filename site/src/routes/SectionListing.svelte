<script lang="ts">
    export let courseCode: string;
    export let section: Section;
    export let selectionsList: ScheduleSelection[] = [];

    let sectionAdded: boolean = false;

    function addSectionToSchedule() {
        if (!sectionAdded) {
            let newSelection: ScheduleSelection = {
                courseCode,
                section
            };
            selectionsList.push(newSelection);
        } else {
            selectionsList
                .splice(
                    selectionsList.findIndex(obj => 
                        obj.section.sec_code === section.sec_code), 
                1);
        }
        sectionAdded = !sectionAdded;
        console.log(selectionsList);
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