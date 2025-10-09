<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang="ts">
    import { 
        getClasstimeBounds, schedulify, appendHoveredSection 
    } from '../../../lib/course-planner/Schedule';
    import ScheduleDay from './ScheduleDay.svelte';
    import ScheduleBackground from './ScheduleBackground.svelte';
    import { formatCredits, testudoLink } from '../../../lib/course-planner/Formatting';
    import { afterUpdate } from 'svelte';
    import InstructorListing from '../course-search/InstructorListing.svelte';
    import {
        HoveredSectionStore,
        CurrentScheduleStore,
        CourseInfoPairStore,
    } from '../../../stores/CoursePlannerStores';
    import MeetingListing from '../course-search/MeetingListing.svelte';
    import SeatData from '../course-search/SeatData.svelte';
    import CourseCondition from '../course-search/CourseCondition.svelte';
    import type { Schedule, ScheduleSelection } from '../../../types';
    import type { CourseBasic, Section } from '@jupiterp/jupiterp';

    let hoveredSection: ScheduleSelection | null = null;
    let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(
        appendHoveredSection(selections, hoveredSection)
    );

    HoveredSectionStore.subscribe((stored) => { 
        hoveredSection = stored;
        schedule = schedulify(
            appendHoveredSection(selections, hoveredSection)
        );
    });

    CurrentScheduleStore.subscribe((stored) => {
        selections = stored.selections;
        schedule = schedulify(
            appendHoveredSection(selections, hoveredSection)
        );
    })

    let bgHeight: number;

    // Keep track of the range of times to display on the Schedule
    let earliestClassStart: number = 8;
    let latestClassEnd: number = 16;

    // In order for Svelte to recreate `schedule` reactively as the user
    // selects new classes, this if block is needed to run `schedulify`
    // if `selections` changes.
    $: if (selections || hoveredSection) {
        const selectionsWithHovered = appendHoveredSection(selections, hoveredSection);
        schedule = schedulify(selectionsWithHovered);
        if (selectionsWithHovered.length === 0) {
            earliestClassStart = 8;
            latestClassEnd = 16;
        } else {
            const bounds = getClasstimeBounds(schedule);
            earliestClassStart = bounds.earliestStart;
            latestClassEnd = bounds.latestEnd;
            const boundDiff = latestClassEnd - earliestClassStart;
            if (boundDiff < 8) {
                earliestClassStart -= Math.floor((8 - boundDiff) / 2);
                latestClassEnd += Math.floor((8 - boundDiff) / 2);
            }
        }
        if (earliestClassStart === -5 && latestClassEnd === 5) {
            earliestClassStart = 8;
            latestClassEnd = 16;
        }
    }

    let showCourseInfo: string | null = null;
    let showSectionInfo: string | null = null;
    let courseInfoCourse: CourseBasic | null = null;
    let courseInfoSection: Section | null = null;

    CourseInfoPairStore.subscribe((pair) => {
        if (pair === null) {
            showCourseInfo = null;
            showSectionInfo = null;
        } else {
            showCourseInfo = pair.courseCode;
            showSectionInfo = pair.sectionCode;
        }
    });

    $: if (showCourseInfo !== null) {
        let index = selections.findIndex(selection => {
            return selection.course.courseCode === showCourseInfo
                && selection.section.sectionCode === showSectionInfo;
        });
        if (index === -1) {
            showCourseInfo = null;
            showSectionInfo = null;
            courseInfoCourse = null;
            courseInfoSection = null;
        } else {
            courseInfoCourse = selections[index].course;
            courseInfoSection = selections[index].section;
        }
    }

    let elt: HTMLDivElement;
    let innerWidth: number;
    let infoPanelLeft: number;
    let infoPanelWidth: number;
    $: if (elt || innerWidth) {
        afterUpdate(() => {
            infoPanelLeft = elt.getBoundingClientRect().left;
            infoPanelWidth = elt.getBoundingClientRect().right - infoPanelLeft;
        });
    }
</script>

<svelte:window bind:innerWidth />

<div class='h-full w-full flex flex-row px-2 font-medium overflow-x-scroll
            text-lg text-center text-black dark:text-white overflow-y-scroll'>
    <div class='grid grow relative pl-8'
         style='height: calc(100% - 1.75rem);'
         class:grid-cols-5={schedule.other.length == 0}
         class:grid-cols-6={schedule.other.length > 0}
         bind:this={elt}
    >
        
        <!-- Background lines for the schedule -->
        <div class='absolute timelines z-0 h-full top-[1.75rem]' 
                style='width: {schedule.other.length == 0 ? '100%' : '83.3%'};;'>
            <ScheduleBackground bind:earliest={earliestClassStart}
                                bind:latest={latestClassEnd} 
                                bind:h={bgHeight}/>
        </div>

        <!-- ClassTimes by day -->
        <ScheduleDay name='Mon' classes={schedule.monday} 
            bind:earliestClassStart
            bind:latestClassEnd 
            bind:bgHeight
            />
        <ScheduleDay name='Tue' classes={schedule.tuesday}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            />
        <ScheduleDay name='Wed' classes={schedule.wednesday}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            />
        <ScheduleDay name='Thu' classes={schedule.thursday}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            />
        <ScheduleDay name='Fri' classes={schedule.friday}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            />

        <!-- 'Other' classes (OnlineAsync, Unspecified) -->
        {#if schedule.other.length > 0}
            <ScheduleDay name='Other' classes={schedule.other} type='Other'
                {bgHeight}
            />
        {/if}
    </div>
</div>

<!-- Course info panel -->
{#if showCourseInfo !== null 
    && courseInfoCourse !== null 
    && courseInfoSection !== null}
<div class='absolute z-10 shadow-md bottom-[0.75rem]
        rounded-xl border-2 border-outlineLight
        dark:border-outlineDark bg-bgSecondaryLight
        dark:bg-bgSecondaryDark text-left px-2 py-1'
     style='max-width: calc(100vw - 72px);
        left: {infoPanelLeft}px;
        width: {infoPanelWidth}px;'>

    <!-- X Button to get rid of course info -->
    <button class='absolute h-7 w-7 top-0 right-0
            2xl:top-1 2xl:right-1 justify-center'
            on:click={() => { CourseInfoPairStore.set(null); }}
            title='Hide course info panel'>
        <svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 384 512"
            class='absolute h-5 w-5 2xl:h-6 2xl:w-6 
                    top-[50%] left-[50%] stroke-black fill-black 
                    dark:stroke-white dark:fill-white'
            style='transform: translateX(-50%) translateY(-50%);'>
            <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
    </button>

    <!-- Course info -->
    <div class='text-lg 2xl:text-xl'
            style='width: calc(100% - 1.75rem);'>
        <span class='font-bold'>
            {courseInfoCourse.courseCode}
        </span>
        <span class='font-normal'>
            - {courseInfoCourse.name}
        </span>
        <span class='text-base 2xl:text-lg font-normal mx-1
                                    text-orange underline'>
            <a href={testudoLink(courseInfoCourse.courseCode)} 
                                            target='_blank'>
                (view on Testudo)
            </a>
        </span>
    </div>

    <div class='text-sm 2xl:text-base'>
        {formatCredits(
            courseInfoCourse.minCredits, courseInfoCourse.maxCredits
        )} credits |
        Section {courseInfoSection.sectionCode}
    </div>

    {#if courseInfoCourse.genEds != null && courseInfoCourse.genEds.length > 0}
        <div class='text-sm 2xl:text-base'>
            <span class='font-black underline'>
                GenEds:
            </span>
            {courseInfoCourse.genEds.map((g) => g.code).join(', ')}
        </div>
    {/if}

    {#each courseInfoSection.instructors as instructor}
        <InstructorListing instructor={instructor}
                            profsHover={false}
                            removeHoverSection={() => {}} />
    {/each}

    <div class='text-sm 2xl:text-base'>
        {#each courseInfoSection.meetings as meeting}
            <MeetingListing meeting={meeting} condensed={true}
                locationHover={false} removeHoverSection={() => {}} />
        {/each}
    </div>

    <SeatData section={courseInfoSection} />

    <div class='text-base 2xl:text-lg leading-5'>
        {#if courseInfoCourse.conditions != null && courseInfoCourse.conditions.length > 0}
            <div class='text-sm 2xl:text-base pb-2'>
                {#each courseInfoCourse.conditions as condition}
                    <CourseCondition {condition} />
                {/each}
            </div>
        {/if}
        {#if courseInfoCourse.description != null}
            {courseInfoCourse.description}
        {/if}
    </div>
</div>
{/if}