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
        formatLocation 
    } from './formatting';
    import { getColorFromNumber, timeToNumber } from './classMeeting';
    import { afterUpdate } from 'svelte';
    import Tooltip from './Tooltip.svelte';

    export let meeting: ClassMeetingExtended;
    export let earliestClassStart: number = 0;
    export let latestClassEnd: number = 0;
    let boundDiff: number;
    $: boundDiff = latestClassEnd - earliestClassStart;

    export let isInOther: boolean;

    export let selections: ScheduleSelection[];

    const differences: string[] = meeting.differences;
    const instructorsChange: boolean = differences.includes('Instructors');
    const numClassMeetingsChange: boolean = differences.includes('Number of class meetings');
    const meetingsTypeChange: boolean = differences.includes('Type of meeting');
    const meetingTimeChange: boolean = numClassMeetingsChange ||
                                differences.includes('Meeting time');
    const meetingLocChange: boolean = differences.includes('Meeting location');

    let formattedInstructors: string = formatInstructors(meeting.instructors);
    let formattedTime: string;
    let secCode: string;
    let decStartTime: number;
    let decEndTime: number;
    let hasLocation: boolean = true;
    let location: string;

    $: if (meeting.meeting != null) {
        secCode = meeting.secCode;
        if (typeof meeting.meeting !== 'string') {
            if ('OnlineSync' in meeting.meeting) {
                formattedTime = formatClasstime(meeting.meeting.OnlineSync);
                decStartTime = timeToNumber(meeting.meeting.OnlineSync.start_time);
                decEndTime = timeToNumber(meeting.meeting.OnlineSync.end_time);
                location = 'ONLINE';
            } else {
                const inPerson = meeting.meeting.InPerson;
                if (inPerson.classtime != null) {
                    formattedTime = formatClasstime(inPerson.classtime);
                    decStartTime = timeToNumber(inPerson.classtime.start_time);
                    decEndTime = timeToNumber(inPerson.classtime.end_time);
                } else {
                    throw Error('Null classtime for ClassMeeting');
                }

                if (inPerson.location != null) {
                    location = formatLocation(inPerson.location);
                } else {
                    location = 'Location TBA';
                }
            }
        } else {
            hasLocation = false;
            if (meeting.meeting === 'OnlineAsync') {
                formattedTime = 'ONLINE ASYNC';
            }
            else {
                formattedTime = meeting.meeting;
            }
            secCode = meeting.secCode;
        }
    }

    let elt: HTMLButtonElement;
    let innerHeight: number;
    let h: number;
    $: if (elt || innerHeight) {
        afterUpdate(() => {
            h = elt.offsetHeight;  
        });
    }

    let fontSize: number;
    $: if (document.documentElement) {
        fontSize = 
            parseInt(
                getComputedStyle(document.documentElement).fontSize.substring(0, 2)
            ) / 16;
    }

    function removeCourseByClassMeeting() {
        const index = selections.findIndex(obj =>
            selectionEqualsByCode(obj)
        );
        if (index !== -1) {
            selections = [
                ...selections.slice(0, index),
                ...selections.slice(index + 1)
            ];
        }
    }

    function selectionEqualsByCode(s: ScheduleSelection): boolean {
        return s.courseCode === meeting.course &&
            s.section.sec_code === secCode;
    }

    export let showCourseInfo: string | null;

    function toggleCourseInfo() {
        if (showCourseInfo !== null || showCourseInfo === meeting.course) {
            showCourseInfo = null;
        } else {
            showCourseInfo = meeting.course;
        }
    }
    
</script>

<svelte:window bind:innerHeight />

<button class='absolute w-full justify-center text-black 
                flex flex-col rounded-lg pb-1 justify-items-center'
        bind:this={elt} on:click={toggleCourseInfo}
        style=' top: {(decStartTime - earliestClassStart) / boundDiff * 100}%;
                height: {(decEndTime - decStartTime) / boundDiff * 100}%;
                background-color: {getColorFromNumber(meeting.colorNumber)};
                opacity: {meeting.hover ? 0.4 : 1.0};
                width: {(1 / meeting.conflictTotal) * 100}%;
                left: {((meeting.conflictIndex - 1) / meeting.conflictTotal) * 100}%;'
        class:otherCategoryClassMeeting={isInOther}>
    
    <!-- x button to remove course -->
    {#if !meeting.hover}
        <button class='absolute h-4 w-4 top-0 right-0
                        2xl:top-1 2xl:right-1 justify-center'
                on:click={removeCourseByClassMeeting}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"
                class='absolute h-2 w-2 2xl:h-3 2xl:w-3 top-[50%] left-[50%]'
                style='transform: translateX(-50%) translateY(-50%);'>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
        </button>
    {/if}

    <!-- Meeting course codes, instructors, etc. will only show up
         if the height of the classtime is great enough to fit them -->
    {#if h > 1.5 * fontSize || isInOther}
        <div class='w-full text-base font-semibold font-sans rounded-t-lg 
                            courseCode truncate min-h-[1.5rem]'
                class:rounded-b-lg={h < 1.75 * fontSize}>
            {meeting.course}
        </div>
    {/if}
    <div class='w-full grow font-thin 2xl:font-normal text-xs font-sans px-2'>
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
</button>

<style>
    .courseCode {
        background-color: rgba(0, 0, 0, 0.07)
    }

    .otherCategoryClassMeeting {
        position: relative;
        margin-bottom: 8px;
    }
</style>