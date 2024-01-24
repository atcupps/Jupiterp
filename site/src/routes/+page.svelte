<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import Schedule from './Schedule.svelte';
    import CourseSearch from './CourseSearch.svelte';
    import { onMount } from 'svelte';
    import { retrieveCourses } from './courseLoad';

    // Load data from `+page.ts`
    export let data;

    // Keep track of chosen sections
    let selectedSections: ScheduleSelection[];

    // Retreive `selectedSections` from client local storage
    onMount(() => {
        try {
            if (typeof window !== 'undefined') {
                const storedData = localStorage.getItem('selectedSections');
                if (storedData) {
                    selectedSections = retrieveCourses(JSON.parse(storedData), data.departments);
                } else {
                    selectedSections = [];
                }
            }
        } catch {
            selectedSections = [];
        }
    });

    // Reactive statement to save to local storage whenever selectedSections changes
    $: if (selectedSections) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedSections', jsonifySections(selectedSections));
        }
    }

    function jsonifySections(sections: ScheduleSelection[]): string {
        let finalSelections: ScheduleSelection[] = [];
        for (let section of sections) {
            if (!section.hover) {
                finalSelections.push(section);
            }
        }
        return JSON.stringify(finalSelections);
    }
</script>

<div class='flex flex-row w-full overflow-y-scroll' 
        style='height: calc(100% - 3rem)'>
    <CourseSearch bind:selections={selectedSections} data={data}/>
    <Schedule bind:selections={selectedSections}/>
</div>