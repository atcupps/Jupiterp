<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import {
		getClasstimeBounds,
		schedulify,
		appendHoveredSection
	} from '../../../lib/course-planner/Schedule';
	import ScheduleDay from './ScheduleDay.svelte';
	import ScheduleBackground from './ScheduleBackground.svelte';
	import { formatCredits, testudoLink } from '../../../lib/course-planner/Formatting';
	import { afterUpdate } from 'svelte';
	import InstructorListing from '../course-search/InstructorListing.svelte';
	import {
		HoveredSectionStore,
		CurrentScheduleStore,
		CourseInfoPairStore
	} from '../../../stores/CoursePlannerStores';
	import MeetingListing from '../course-search/MeetingListing.svelte';
	import SeatData from '../course-search/SeatData.svelte';
	import CourseCondition from '../course-search/CourseCondition.svelte';
	import type { Schedule, ScheduleSelection } from '../../../types';
	import type { CourseBasic, Section } from '@jupiterp/jupiterp';

	let hoveredSection: ScheduleSelection | null = null;
	let selections: ScheduleSelection[] = [];

	let schedule: Schedule = schedulify(appendHoveredSection(selections, hoveredSection));

	HoveredSectionStore.subscribe((stored) => {
		hoveredSection = stored;
		schedule = schedulify(appendHoveredSection(selections, hoveredSection));
	});

	CurrentScheduleStore.subscribe((stored) => {
		selections = stored.selections;
		schedule = schedulify(appendHoveredSection(selections, hoveredSection));
	});

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
		let index = selections.findIndex((selection) => {
			return (
				selection.course.courseCode === showCourseInfo &&
				selection.section.sectionCode === showSectionInfo
			);
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
</script>

<svelte:window bind:innerWidth />

<div
	class="-pl-3 relative order-1 flex h-[calc(100svh-11rem)] min-h-80 w-full flex-row overflow-auto text-center text-lg font-medium text-black lg:order-2 lg:mr-1 lg:h-full dark:text-white"
>
	<div
		class="relative grid grow pl-8"
		style="height:calc(100% - 1.5rem)"
		class:grid-cols-5={schedule.other.length == 0}
		class:grid-cols-6={schedule.other.length > 0}
		bind:this={elt}
	>
		<!-- Background lines for the schedule -->
		<!-- format-check exempt 2 -->
		<div
			class="absolute bottom-0 left-[4px] top-6 z-0"
			style="width: calc({schedule.other.length == 0 ? '100%' : '83.3%'} - 8px);"
		>
			<ScheduleBackground
				bind:earliest={earliestClassStart}
				bind:latest={latestClassEnd}
				bind:h={bgHeight}
			/>
		</div>

		<!-- ClassTimes by day -->
		<ScheduleDay
			name="Mon"
			classes={schedule.monday}
			bind:earliestClassStart
			bind:latestClassEnd
			bind:bgHeight
		/>
		<ScheduleDay
			name="Tue"
			classes={schedule.tuesday}
			bind:earliestClassStart
			bind:latestClassEnd
			bind:bgHeight
		/>
		<ScheduleDay
			name="Wed"
			classes={schedule.wednesday}
			bind:earliestClassStart
			bind:latestClassEnd
			bind:bgHeight
		/>
		<ScheduleDay
			name="Thu"
			classes={schedule.thursday}
			bind:earliestClassStart
			bind:latestClassEnd
			bind:bgHeight
		/>
		<ScheduleDay
			name="Fri"
			classes={schedule.friday}
			bind:earliestClassStart
			bind:latestClassEnd
			bind:bgHeight
		/>

		<!-- 'Other' classes (OnlineAsync, Unspecified) -->
		{#if schedule.other.length > 0}
			<ScheduleDay name="Other" classes={schedule.other} type="Other" {bgHeight} />
		{/if}
	</div>

	<!-- Course info panel -->
	{#if showCourseInfo !== null && courseInfoCourse !== null && courseInfoSection !== null}
		<div
			class="absolute bottom-0 z-10 w-full rounded-xl
        border-2 border-outlineLight bg-bgSecondaryLight
        px-2 py-1 text-left shadow-md dark:border-outlineDark dark:bg-bgSecondaryDark"
		>
			<!-- X Button to get rid of course info -->
			<button
				class="absolute right-0 top-0 h-7 w-7 justify-center 2xl:right-1 2xl:top-1"
				on:click={() => {
					CourseInfoPairStore.set(null);
				}}
				title="Hide course info panel"
			>
				<!-- format-check exempt 7 -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 384 512"
					class="absolute left-[50%] top-[50%] h-5 w-5
                    fill-black stroke-black 2xl:h-6 2xl:w-6
                    dark:fill-white dark:stroke-white"
					style="transform: translateX(-50%) translateY(-50%);"
				>
					<!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
						d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"
					/></svg
				>
			</button>

			<!-- Course info -->
			<div class="text-lg 2xl:text-xl" style="width: calc(100% - 1.5rem);">
				<span class="font-bold">
					{courseInfoCourse.courseCode}
				</span>
				<span class="font-normal">
					- {courseInfoCourse.name}
				</span>
				<span
					class="mx-1 text-base font-normal text-orange
                                    underline 2xl:text-lg"
				>
					<a href={testudoLink(courseInfoCourse.courseCode)} target="_blank"> (view on Testudo) </a>
				</span>
			</div>

			<div class="text-sm 2xl:text-base">
				{formatCredits(courseInfoCourse.minCredits, courseInfoCourse.maxCredits)} credits | Section {courseInfoSection.sectionCode}
			</div>

			{#if courseInfoCourse.genEds != null && courseInfoCourse.genEds.length > 0}
				<div class="text-sm 2xl:text-base">
					<span class="font-black underline"> GenEds: </span>
					{courseInfoCourse.genEds.map((g) => g.code).join(', ')}
				</div>
			{/if}

			{#each courseInfoSection.instructors as instructor}
				<InstructorListing {instructor} profsHover={false} removeHoverSection={() => {}} />
			{/each}

			<div class="text-sm 2xl:text-base">
				{#each courseInfoSection.meetings as meeting}
					<MeetingListing
						{meeting}
						condensed={true}
						locationHover={false}
						removeHoverSection={() => {}}
					/>
				{/each}
			</div>

			<SeatData section={courseInfoSection} />

			<div class="text-base leading-5 2xl:text-lg">
				{#if courseInfoCourse.conditions != null && courseInfoCourse.conditions.length > 0}
					<div class="pb-2 text-sm 2xl:text-base">
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
</div>
