<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import SectionListing from './SectionListing.svelte';
	import { formatCredits, testudoLink } from '../../../lib/course-planner/Formatting';
	import { slide } from 'svelte/transition';
	import CourseCondition from './CourseCondition.svelte';
	import { AngleRightOutline } from 'flowbite-svelte-icons';
	import type { Course, Section } from '@jupiterp/jupiterp';

	export let course: Course;

	function pseudoSection(): Section {
		return {
			courseCode: course.courseCode,
			sectionCode: 'N/A',
			instructors: ['Testudo Terrapin 🐢'],
			meetings: ['No Sections'],
			openSeats: 0,
			totalSeats: 0,
			waitlist: 0,
			holdfile: null
		};
	}

	let showMoreInfo: boolean = false;

	let isSticky: boolean = false;

	function updateSticky() {
		isSticky = window.innerHeight > 480;
	}

	window.addEventListener('resize', updateSticky);
	updateSticky();

	function scrollToCourseTop(event: MouseEvent) {
		const button = event.currentTarget as HTMLElement | null;
		const container = button?.closest('[id^="results-"]') as HTMLElement | null;
		container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<div
	id="results-{course.courseCode}"
	class="my-2 flex scroll-mt-2 flex-col rounded-lg border-2 border-solid border-outlineLight bg-bgSecondaryLight px-2 dark:border-outlineDark dark:bg-bgSecondaryDark"
>
	<div
		class="top-0 z-10 -mb-[2px] border-b-2 border-solid border-outlineLight bg-bgSecondaryLight px-2
           dark:border-outlineDark dark:bg-bgSecondaryDark"
		style="position: {isSticky ? 'sticky' : 'static'}"
	>
		<button
			on:click={scrollToCourseTop}
			class="w-full text-left"
			title="Scroll to top of course listing"
		>
			<!-- Course code and credit count -->
			<div class="flex flex-row align-middle">
				<div class="grow text-left align-middle">
					<b>{course.courseCode}</b>
				</div>
				<div class="grow text-right align-middle text-sm 2xl:text-base">
					Credits: {formatCredits(course.minCredits, course.maxCredits)}
				</div>
			</div>

			<!-- Course title -->
			<div class="wrap max-w-[254px] text-sm xl:max-w-[314px] 2xl:max-w-[394px] 2xl:text-base">
				{course.name}
			</div>

			{#if course.genEds != null && course.genEds.length > 0}
				<div class="align-center my-1 flex w-full flex-row justify-start">
					{#each course.genEds as genEd}
						<!-- format-check exempt 5 -->
						<a
							class="mr-1 rounded-xl border border-orange
                            px-1 text-[0.625rem] font-bold leading-tight text-orange transition
                            hover:bg-orange hover:text-bgSecondaryLight
                            2xl:text-xs hover:dark:text-bgSecondaryDark"
							href={`https://app.testudo.umd.edu/soc/gen-ed/202608/` + genEd.code}
							target="_blank"
							title={'GenEd: ' + genEd.name}
						>
							{genEd.code}
						</a>
					{/each}
				</div>
			{/if}
		</button>

		<button
			class="flex w-full flex-row content-center text-left text-sm text-secCodesLight hover:text-secCodesDark 2xl:text-base dark:text-[#8892a8]"
			title={!showMoreInfo ? 'Show more course details' : 'Hide course details'}
			on:click={() => {
				showMoreInfo = !showMoreInfo;
			}}
		>
			<div class="-ml-1 h-full self-center transition-transform" class:rotate-90={showMoreInfo}>
				<AngleRightOutline class="h-4 w-4" />
			</div>
			<span>
				{showMoreInfo ? 'Hide details' : 'Show details'}
			</span>
		</button>

		{#if showMoreInfo}
			<div
				class="font-base flex flex-col
                    py-1 text-sm leading-tight 2xl:text-base"
				transition:slide
			>
				<div class="pb-1">
					<a href={testudoLink(course.courseCode)} class="text-orange underline" target="_blank">
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
	</div>
	<!-- Sections -->
	{#if course.sections != null && course.sections.length > 0}
		{#each course.sections as section}
			<SectionListing courseCode={course.courseCode} {section} {course} />
		{/each}
	{:else}
		<SectionListing courseCode={course.courseCode} section={pseudoSection()} {course} />
	{/if}
</div>
