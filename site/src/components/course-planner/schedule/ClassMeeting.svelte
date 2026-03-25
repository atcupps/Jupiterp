<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import {
		formatClasstime,
		formatInstructors,
		formatLocation,
		splitCourseCode
	} from '../../../lib/course-planner/Formatting';
	import { getColorFromNumber } from '../../../lib/course-planner/ClassMeetingUtils';
	import { afterUpdate } from 'svelte';
	import Tooltip from './Tooltip.svelte';
	import { CourseInfoPairStore, CurrentScheduleStore } from '../../../stores/CoursePlannerStores';
	import type {
		ClassMeetingExtended,
		CourseSectionPair,
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
			} else if (meeting.meeting.location.building === 'OnlineSync') {
				location = 'ONLINE';
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
				case 'No Sections':
					formattedTime = 'NO SECTIONS';
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
		fontSize = parseInt(getComputedStyle(document.documentElement).fontSize.substring(0, 2)) / 16;
	}

	function removeCourseByClassMeeting() {
		const index = selections.findIndex((obj) => selectionEqualsByCode(obj));
		if (index !== -1) {
			CurrentScheduleStore.set({
				scheduleName,
				selections: [...selections.slice(0, index), ...selections.slice(index + 1)]
			});
		}
	}

	function selectionEqualsByCode(s: ScheduleSelection): boolean {
		return s.course.courseCode === meeting.courseCode && s.section.sectionCode === secCode;
	}

	let courseInfoPair: CourseSectionPair | null;
	CourseInfoPairStore.subscribe((val) => {
		courseInfoPair = val;
	});

	function toggleCourseInfo() {
		if (
			courseInfoPair !== null &&
			courseInfoPair.courseCode === meeting.courseCode &&
			courseInfoPair.sectionCode === meeting.sectionCode
		) {
			CourseInfoPairStore.set(null);
		} else {
			CourseInfoPairStore.set({
				courseCode: meeting.courseCode,
				sectionCode: meeting.sectionCode
			});
		}
	}
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<button
	class="absolute flex w-full flex-col
                justify-center justify-items-center rounded-lg pb-1 text-black"
	bind:this={elt}
	on:click={toggleCourseInfo}
	style=" top: {((decStartTime - earliestClassStart) / boundDiff) * 100}%;
                height: {((decEndTime - decStartTime) / boundDiff) * 100}%;
                background-color: {getColorFromNumber(meeting.colorNumber)};  
                opacity: {meeting.hover ? 0.4 : 1.0};
                width: {(1 / meeting.conflictTotal) * 100}%;
                left: {((meeting.conflictIndex - 1) / meeting.conflictTotal) * 100}%;"
	class:otherCategoryClassMeeting={isInOther}
	title="Click to show more course info"
>
	<!-- x button to remove course -->
	{#if !meeting.hover}
		<button
			class="absolute right-0 top-0 h-4 w-6 items-center justify-center overflow-clip hover:text-orange 2xl:right-1 2xl:top-1"
			on:click={removeCourseByClassMeeting}
			title="Remove course from schedule"
		>
			<!-- BUG: Not display unless width is 24  -->
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="absolute left-1 top-0"
				><path
					fill="currentColor"
					d="m12 13.4l-2.917 2.925q-.277.275-.704.275t-.704-.275q-.275-.275-.275-.7t.275-.7L10.6 12L7.675 9.108Q7.4 8.831 7.4 8.404t.275-.704q.275-.275.7-.275t.7.275L12 10.625L14.892 7.7q.277-.275.704-.275t.704.275q.3.3.3.713t-.3.687L13.375 12l2.925 2.917q.275.277.275.704t-.275.704q-.3.3-.712.3t-.688-.3z"
				/></svg
			>
		</button>
	{/if}

	{#if w >= 72}
		<!-- Meeting course codes, instructors, etc. will only show up
            if the height of the classtime is great enough to fit them -->
		{#if h > 1.5 * fontSize || isInOther}
			<div
				class="translucentGray items-middle flex min-h-[1.5rem] w-full
                        items-center justify-center truncate rounded-t-lg
                        font-sans text-base font-semibold"
				class:text-sm={w < 120}
				class:text-xs={w < 104}
				class:rounded-b-lg={h < 1.5 * fontSize}
			>
				<span>{meeting.courseCode}</span>
			</div>
		{/if}
		<div class="w-full grow px-2 font-sans text-xs font-thin 2xl:font-normal">
			{#if h - 24 * fontSize > 64 * fontSize || isInOther}
				<div
					class="static truncate"
					class:underline={instructorsChange}
					class:decoration-dotted={instructorsChange}
				>
					{#if instructorsChange}
						<Tooltip
							text={'⚠ ' + formattedInstructors}
							tooltipText="Instructors have changed since you last visited Jupiterp."
						/>
					{:else}
						{formattedInstructors}
					{/if}
				</div>
			{/if}
			{#if h - 24 * fontSize > 48 * fontSize || isInOther}
				<div
					class="static truncate"
					class:underline={meetingTimeChange || meetingsTypeChange}
					class:decoration-dotted={meetingTimeChange || meetingsTypeChange}
				>
					{#if meetingTimeChange}
						<Tooltip
							text={'⚠ ' + formattedTime}
							tooltipText="Class meeting time has changed since you last visited Jupiterp."
						/>
					{:else if meetingsTypeChange}
						<Tooltip
							text={'⚠ ' + formattedTime}
							tooltipText="Meeting type has changed since you last visited Jupiterp."
						/>
					{:else}
						{formattedTime}
					{/if}
				</div>
			{/if}
			{#if h - 24 * fontSize > 32 * fontSize || isInOther}
				<div class="static truncate">
					Section {secCode}
				</div>
			{/if}
			{#if h - 24 * fontSize > 16 * fontSize && hasLocation}
				<div
					class="static truncate"
					class:underline={meetingLocChange}
					class:decoration-dotted={meetingLocChange}
				>
					{#if meetingLocChange}
						<Tooltip
							text={'⚠ ' + location}
							tooltipText="Class location has changed since you last visited Jupiterp."
						/>
					{:else}
						{location}
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="w-full text-wrap break-words rounded-t-lg font-sans text-xs font-semibold"
			class:rounded-b-lg={h < 1.5 * fontSize}
		>
			{splitCourseCode(meeting.courseCode)}
		</div>
	{/if}
</button>

<style>
	.translucentGray {
		background-color: rgba(0, 0, 0, 0.07);
	}

	.otherCategoryClassMeeting {
		position: relative;
		margin-bottom: 8px;
	}
</style>
