<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang="ts">
    import SectionListing from "./SectionListing.svelte";
    import { formatCredits } from "../../../lib/course-planner/Formatting";

    export let course: Course;

    function getMinCredits(credits: CreditCount): number {
        if ('Amount' in credits) {
            return credits.Amount
        } else {
            return credits.Range[0];
        }
    }

    function pseudoSection(): Section {
        return {
            sec_code: 'N/A',
            instructors: ['Testudo Terrapin 🐢'],
            class_meetings: ['No Class Meetings']
        }
    }
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
    <div class='xl:max-w-[314px] 2xl:max-w-[394px] max-w-[254px]
                    text-sm 2xl:text-base wrap'>
        {course.name}
    </div>

    <!-- Sections -->
    {#if course.sections != null}
        {#each course.sections as section}
            <SectionListing courseCode={course.code}
                section={section}
                        course={course}
                        minCredits={getMinCredits(course.credits)} />
        {/each}
    {:else}
        <SectionListing courseCode={course.code}
            section={pseudoSection()}
                        course={course}
                        minCredits={getMinCredits(course.credits)} />
    {/if}
</div>