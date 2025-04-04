<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang="ts">
    import SectionListing from "./SectionListing.svelte";
    import { formatCredits, getMinCredits, testudoLink } from "../../../lib/course-planner/Formatting";
    import { slide } from "svelte/transition";

    export let course: Course;

    function pseudoSection(): Section {
        return {
            sec_code: 'N/A',
            instructors: ['Testudo Terrapin 🐢'],
            class_meetings: ['No Class Meetings']
        }
    }

    let showMoreInfo: boolean = false;
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

    <button class='text-xs 2xl:text-sm text-left hover:text-outlineDark
                text-secCodesLight dark:text-secCodesDark'
            on:click={() => {showMoreInfo = !showMoreInfo}}>
        {showMoreInfo ? "Show less" : "Show more"}
    </button>

    {#if showMoreInfo}
        <div class='text-xs 2xl:text-sm py-1'
                transition:slide>
            <a href={testudoLink(course.code)} 
                class='text-orange underline'
                target='_blank'>
                View on Testudo
            </a>
            <br>
            {course.description}
        </div>
    {/if}

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