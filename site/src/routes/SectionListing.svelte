<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

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
    }

    function selectionEquals(s: ScheduleSelection): boolean {
        return s.courseCode === courseCode && 
            s.section.sec_code === section.sec_code;
    }
</script>

<li class='py-1'>
    {section.sec_code}
    <button on:click={addSectionToSchedule}
        class='bg-slate-200 rounded px-1'>
        {sectionAdded ? 'Remove section' : 'Add section'}
    </button>
    <ul class='list-disc list-inside pl-4'>
        {#each section.instructors as instructor}
            <li>{instructor}</li>
        {/each}
    </ul>
</li>