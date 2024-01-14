<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import SectionListing from "./SectionListing.svelte";
    import { formatCredits } from "./formatting";

    export let course: Course;
    export let profs: Record<string, Professor>;
    export let selections: ScheduleSelection[];
</script>

<div class='px-2 my-2 bg-bgSecondaryLight dark:bg-bgSecondaryDark 
            rounded-lg border-2 border-outlineLight dark:border-outlineDark 
            border-solid flex flex-col'>
    
    <!-- Course code and credit count -->
    <div class='flex flex-row align-middle'>
        <div class='grow text-left align-middle'>
            <b>{course.code}</b>
        </div>
        <div class='grow text-right text-sm 2xl:text-base align-middle'>
            Credits: {formatCredits(course.credits)}
        </div>
    </div>

    <!-- Course title -->
    <div class='max-w-[314px] 2xl:max-w-[394px] text-sm 2xl:text-base truncate'>
        {course.name}
    </div>

    <!-- Sections -->
    {#if course.sections != null}
        {#each course.sections as section}
            <SectionListing courseCode={course.code} profs={profs}
                section={section} bind:selectionsList={selections} />
        {/each}
    {:else}
        No sections
    {/if}
</div>