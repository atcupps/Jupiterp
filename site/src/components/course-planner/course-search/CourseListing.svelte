<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
    import SectionListing from "./SectionListing.svelte";
    import { formatCredits, testudoLink } from "../../../lib/course-planner/Formatting";
    import { slide } from "svelte/transition";
    import CourseCondition from "./CourseCondition.svelte";
    import { AngleRightOutline } from "flowbite-svelte-icons";
    import type { Course, Section } from "@jupiterp/jupiterp";

    export let course: Course;

    function pseudoSection(): Section {
        return {
            courseCode: course.courseCode,
            sectionCode: 'N/A',
            instructors: ['Testudo Terrapin 🐢'],
            meetings: ["No Sections"],
            openSeats: 0,
            totalSeats: 0,
            waitlist: 0,
            holdfile: null
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
            <b>{course.courseCode}</b>
        </div>
        <div class='grow text-right text-sm 2xl:text-base align-middle'>
            Credits: {formatCredits(course.minCredits, course.maxCredits)}
        </div>
    </div>

    <!-- Course title -->
    <div class='xl:max-w-[314px] 2xl:max-w-[394px] max-w-[254px]
                    text-sm 2xl:text-base wrap'>
        {course.name}
    </div>

    {#if course.genEds != null && course.genEds.length > 0}
        <div class='w-full flex flex-row justify-start align-center my-1'>
            {#each course.genEds as genEd}
                <a class='text-[0.625rem] 2xl:text-xs text-orange leading-tight
                            font-bold rounded-xl border border-orange px-1 mr-1
                            hover:bg-orange hover:text-bgSecondaryLight 
                            hover:dark:text-bgSecondaryDark transition'
                    href={"https://app.testudo.umd.edu/soc/gen-ed/202601/" + genEd.code}
                    target="_blank"
                    title={"GenEd: " + genEd.name}>
                    {genEd.code}
                </a>
            {/each}
        </div>
    {/if}

    <button class='text-sm 2xl:text-base text-left
                text-secCodesLight hover:text-[#4a5366]
                dark:text-[#8892a8] hover:text-secCodesDark
                w-full flex flex-row content-center'
            title={!showMoreInfo ? "Show more course details" : "Hide course details"}
            on:click={() => {showMoreInfo = !showMoreInfo}}>
        <div class='h-full self-center transition-transform -ml-1' 
             class:rotate-90={showMoreInfo}>
            <AngleRightOutline class='h-4 w-4' />
        </div>
        <span>
            {showMoreInfo ? "Hide details" : "Show details"}
        </span>
    </button>

    {#if showMoreInfo}
        <div class='text-sm 2xl:text-base py-1 font-base flex flex-col leading-tight'
                transition:slide>
            <div class='pb-1'>
                <a href={testudoLink(course.courseCode)} 
                    class='text-orange underline'
                    target='_blank'>
                    View on Testudo
                </a>
            </div>

            {#if course.conditions != null && course.conditions.length > 0}
                {#each course.conditions as condition}
                    <CourseCondition {condition} />
                {/each}
            {/if}

            {#if course.description != null}
                {course.description}
            {/if}
        </div>
    {/if}

    <!-- Sections -->
    {#if course.sections != null && course.sections.length > 0}
        {#each course.sections as section}
            <SectionListing courseCode={course.courseCode}
                section={section}
                        course={course} />
        {/each}
    {:else}
        <SectionListing courseCode={course.courseCode}
            section={pseudoSection()}
            course={course} />
    {/if}
</div>