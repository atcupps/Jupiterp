<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { 
        formatClasstime, 
        formatInstructors, 
        formatLocation, 
        splitCourseCode
    } from '../../../lib/course-planner/Formatting';
    import { getColorFromNumber } from '../../../lib/course-planner/ClassMeetingUtils';
    import { afterUpdate } from 'svelte';
    import Tooltip from './Tooltip.svelte';
    import { CurrentScheduleStore } from '../../../stores/CoursePlannerStores';
    import type {
        ClassMeetingExtended,
        ScheduleSelection,
        SelectionDifferences
    } from '../../../types';

    export let meeting: ClassMeetingExtended;
    export let earliestClassStart: number = 0;
    export let latestClassEnd: number = 0;
    let boundDiff: number;
    $: boundDiff = latestClassEnd - earliestClassStart;

    export let isInOther: boolean;

    let selections: ScheduleSelection[];
    let scheduleName: string;
    CurrentScheduleStore.subscribe((stored) => {
        selections = stored.selections;
        scheduleName = stored.scheduleName;
    });

    const differences: SelectionDifferences = meeting.differences;
    const instructorsChange = differences.instructors;
    const numClassMeetingsChange = differences.numMeetings;
    const meetingsTypeChange = differences.meetingType;
    const meetingTimeChange = differences.meetingTime;
    const meetingLocChange = differences.meetingLocation;

    let formattedInstructors: string = formatInstructors(meeting.instructors);
    let formattedTime: string;
    let secCode: string;
    let decStartTime: number;
    let decEndTime: number;
    let hasLocation: boolean = true;
    let location: string;

    $: if (meeting.meeting != null) {
        secCode = meeting.sectionCode;
        if (typeof meeting.meeting !== 'string') {
            formattedTime = formatClasstime(meeting.meeting.classtime);
            decStartTime = meeting.meeting.classtime.start;
            decEndTime = meeting.meeting.classtime.end;
            if (meeting.meeting.location.room != null) {
                location = formatLocation(meeting.meeting.location);
            }
            else if (meeting.meeting.location.building === "OnlineSync") {
                location = "ONLINE";
            } else {
                location = meeting.meeting.location.building;
            }
        } else {
            hasLocation = false;
            switch (meeting.meeting) {
                case 'TBA':
                    formattedTime = 'TBA';
                    break;
                case 'OnlineAsync':
                    formattedTime = 'ONLINE ASYNC';
                    break;
                case 'Unknown':
                    formattedTime = 'UNKNOWN TIME';
                    break;
                case 'Unspecified':
                    formattedTime = 'UNSPECIFIED TIME';
                    break;
            }
            secCode = meeting.sectionCode;
        }
    }

    let elt: HTMLButtonElement;
    let innerHeight: number;
    let innerWidth: number;
    let h: number;
    let w: number;
    $: if (elt || innerHeight || innerWidth) {
        afterUpdate(() => {
            w = elt.offsetWidth;
            h = elt.offsetHeight;  
        });
    }

    let fontSize: number;
    $: if (document.documentElement) {
        fontSize = 
            parseInt(
                getComputedStyle(document.documentElement)
                .fontSize
                .substring(0, 2)
            ) / 16;
    }

    function removeCourseByClassMeeting() {
        const index = selections.findIndex(obj =>
            selectionEqualsByCode(obj)
        );
        if (index !== -1) {
            CurrentScheduleStore.set({
                scheduleName,
                selections: [
                    ...selections.slice(0, index),
                    ...selections.slice(index + 1)
                ]
            });
        }
    }

    function selectionEqualsByCode(s: ScheduleSelection): boolean {
        return s.course.courseCode === meeting.courseCode 
                && s.section.sectionCode === secCode;
    }

    export let showCourseInfo: string | null;
    export let showSectionInfo: string | null;

    function toggleCourseInfo() {
        if (showCourseInfo !== null 
                && showCourseInfo === meeting.courseCode
                && showSectionInfo === meeting.sectionCode) {
            showCourseInfo = null;
        } else {
            showCourseInfo = meeting.courseCode;
            showSectionInfo = meeting.sectionCode;
        }
    }

</script>

<svelte:window bind:innerHeight bind:innerWidth />

<button class='absolute w-full justify-center text-black 
                flex flex-col rounded-lg pb-1 justify-items-center'
        bind:this={elt} on:click={toggleCourseInfo}
        style=' top: {(decStartTime - earliestClassStart) / boundDiff * 100}%;
                height: {(decEndTime - decStartTime) / boundDiff * 100}%;
                background-color: {getColorFromNumber(meeting.colorNumber)};  
                opacity: {meeting.hover ? 0.4 : 1.0};
                width: {(1 / meeting.conflictTotal) * 100}%;
                left: {
                    ((meeting.conflictIndex - 1) / meeting.conflictTotal) * 100
                }%;'
        class:otherCategoryClassMeeting={isInOther}
        title='Click to show more course info'>

    <!-- x button to remove course -->
    {#if !meeting.hover}
        <button class='absolute h-4 w-4 top-0 right-0
                        2xl:top-1 2xl:right-1 justify-center'
                on:click={removeCourseByClassMeeting}
                title='Remove course from schedule'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"
                class='absolute h-2 w-2 2xl:h-3 2xl:w-3 top-[50%] left-[50%]'
                style='transform: translateX(-50%) translateY(-50%);'>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
        </button>
    {/if}

    {#if w >= 72}
        <!-- Meeting course codes, instructors, etc. will only show up
            if the height of the classtime is great enough to fit them -->
        {#if h > 1.5 * fontSize || isInOther}
            <div class='w-full text-base font-semibold font-sans rounded-t-lg
                        translucentGray truncate min-h-[1.5rem] items-middle
                        flex justify-center items-center'
                    class:text-sm={w < 120}
                    class:text-xs={w < 104}
                    class:rounded-b-lg={h < 1.75 * fontSize}>
                <span>{meeting.courseCode}</span>
            </div>
        {/if}
        <div class='w-full grow font-thin 2xl:font-normal 
                                                    text-xs font-sans px-2'>
            {#if h - (24 * fontSize) > (64 * fontSize) || isInOther}
                <div class='truncate static'  
                                class:underline={instructorsChange}
                                class:decoration-dotted={instructorsChange}>
                    {#if instructorsChange}
                        <Tooltip text={'⚠ ' + formattedInstructors}
                        tooltipText='Instructors have changed since 
                                            you last visited Jupiterp.' />
                    {:else}
                        {formattedInstructors}
                    {/if}
                </div>
            {/if}
            {#if h - (24 * fontSize) > (48 * fontSize) || isInOther}
                <div class='truncate static'
                                class:underline={meetingTimeChange 
                                                        || meetingsTypeChange}
                                class:decoration-dotted={meetingTimeChange 
                                                        || meetingsTypeChange}>
                    {#if meetingTimeChange}
                        <Tooltip text={'⚠ ' + formattedTime}
                            tooltipText='Class meeting time has changed since 
                                                you last visited Jupiterp.' />
                    {:else if meetingsTypeChange}
                        <Tooltip text={'⚠ ' + formattedTime}
                            tooltipText='Meeting type has changed since you
                                            last visited Jupiterp.' />
                    {:else}
                        {formattedTime}
                    {/if}
                </div>
            {/if}
            {#if h - (24 * fontSize) > (32 * fontSize) || isInOther}
                <div class='truncate static'>
                    Section {secCode}
                </div>
            {/if}
            {#if h - (24 * fontSize) > (16 * fontSize) && hasLocation}
                <div class='truncate static'
                                class:underline={meetingLocChange}
                                class:decoration-dotted={meetingLocChange}>
                    {#if meetingLocChange}
                        <Tooltip text={'⚠ ' + location} 
                            tooltipText='Class location has changed since 
                                                you last visited Jupiterp.' />
                    {:else}
                        {location}
                    {/if}
                </div>
            {/if}
        </div>
    {:else}
        
    <div class='w-full text-base font-semibold font-sans
                    ont-sans rounded-t-lg text-wrap break-words'
        class:rounded-b-lg={h < 1.75 * fontSize}>
        {splitCourseCode(meeting.courseCode)}
    </div>
    {/if}
</button>

<style>
    .translucentGray {
        background-color: rgba(0, 0, 0, 0.07)
    }

    .otherCategoryClassMeeting {
        position: relative;
        margin-bottom: 8px;
    }
</style>