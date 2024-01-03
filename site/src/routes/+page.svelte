<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->
<script lang="ts">
    import Schedule from './Schedule.svelte';
    import CourseSearch from './CourseSearch.svelte';

    // Load data from `+page.ts`
    export let data;

    // Keep track of chosen sections
    let selectedSections: ScheduleSelection[] = [];
</script>

<div class='flex flex-row w-full' style='height: calc(100% - 80px)'>
    <CourseSearch bind:selections={selectedSections} data={data}/>
    <Schedule bind:selections={selectedSections}/>
</div>