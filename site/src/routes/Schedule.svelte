<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang="ts">
    import { 
        getClasstimeBounds, schedulify, appendHoveredSection 
    } from './schedule';
    import ScheduleDay from './ScheduleDay.svelte';
    import ScheduleBackground from './ScheduleBackground.svelte';
    import { getCourseLookup } from './courseSearch';

    export let hoveredSection: ScheduleSelection | null;
    export let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(
        appendHoveredSection(selections, hoveredSection)
    );

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
    }

    let showCourseInfo: string | null = null;
    let courseInfoCourse: Course | null = null;
    $: if (showCourseInfo !== null) {
        let index = selections.findIndex(selection => {
            return selection.courseCode === showCourseInfo;
        });
        if (index === -1) {
            throw Error('Clicked course not found in selections');
        } else {
            courseInfoCourse = selections[index].course;
            console.log(courseInfoCourse);
        }
    }
</script>

<div class='h-full w-full flex flex-row px-2 font-medium overflow-x-scroll
            text-lg text-center text-black dark:text-white overflow-y-scroll'>
    <div class='grid grow relative pl-8 min-w-[768px]'
         style='height: calc(100% - 1.75rem);'
            class:grid-cols-5={schedule.other.length == 0}
            class:grid-cols-6={schedule.other.length > 0}>
        
        <!-- Background lines for the schedule -->
        <div class='absolute timelines z-0 h-full top-[1.75rem]' 
                style='width: {schedule.other.length == 0 ? '100%' : '83.3%'};;'>
            <ScheduleBackground bind:earliest={earliestClassStart}
                                bind:latest={latestClassEnd} 
                                bind:h={bgHeight}/>
        </div>

        <!-- ClassTimes by day -->
        <ScheduleDay name='Mon' classes={schedule.monday} 
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd 
            bind:bgHeight
            bind:showCourseInfo />
        <ScheduleDay name='Tue' classes={schedule.tuesday}
        bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            bind:showCourseInfo />
        <ScheduleDay name='Wed' classes={schedule.wednesday}
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            bind:showCourseInfo />
        <ScheduleDay name='Thu' classes={schedule.thursday}
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            bind:showCourseInfo />
        <ScheduleDay name='Fri' classes={schedule.friday}
            bind:selections={selections}
            bind:earliestClassStart
            bind:latestClassEnd  
            bind:bgHeight
            bind:showCourseInfo />

        <!-- 'Other' classes (OnlineAsync, Unspecified) -->
        {#if schedule.other.length > 0}
            <ScheduleDay name='Other' classes={schedule.other} type='Other'
                {bgHeight}
            bind:selections={selections}
            bind:showCourseInfo />
        {/if}
    </div>

    {#if showCourseInfo !== null && courseInfoCourse !== null}
        <div class='absolute w-full h-[4rem] bottom-0 z-10'>
            {courseInfoCourse.code}
        </div>
    {/if}
</div>