<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import type { Course } from '@jupiterp/jupiterp';
	import { GeneratorRequirementsStore } from '../../stores/GeneratorStores';
	import {
		addRequirement,
		chosenCourseCodes,
		removeRequirement
	} from '../../lib/schedule-generator/WishlistActions';
	import { formatCredits, splitCourseCode } from '../../lib/course-planner/Formatting';
	import CourseSearchBox from '../course-planner/course-search/CourseSearchBox.svelte';

	let searchInput = '';
	let genEdMenuOpen = false;

	let chosenCodes = new Set<string>();
	GeneratorRequirementsStore.subscribe((reqs) => {
		chosenCodes = chosenCourseCodes(reqs);
	});

	function addCourse(course: Course) {
		GeneratorRequirementsStore.update((reqs) => addRequirement(reqs, course));
	}

	function removeCourse(course: Course) {
		GeneratorRequirementsStore.update((reqs) => removeRequirement(reqs, course.courseCode));
	}
</script>

<CourseSearchBox
	bind:searchInput
	bind:genEdMenuOpen
	let:searchResults
	let:isPending
	let:profSuggestions
>
	<!-- Show results whenever there is a query OR an active filter has produced
		results (e.g. selecting a gen-ed with an empty search bar). -->
	{#if searchInput.length > 0 || searchResults.length > 0}
		<div class="custom-scrollbar mt-2 max-h-72 overflow-y-auto">
			{#each searchResults as course (course.courseCode)}
				<div
					class="flex flex-row items-center gap-2 border-b
						border-divBorderLight px-1 py-1 dark:border-divBorderDark"
				>
					<div class="flex grow flex-col overflow-hidden">
						<span class="truncate text-sm font-bold">
							{splitCourseCode(course.courseCode)}
						</span>
						<span class="truncate text-xs opacity-70">
							{course.name}
						</span>
					</div>
					<span class="whitespace-nowrap text-xs opacity-60">
						{formatCredits(course.minCredits, course.maxCredits)} cr
					</span>
					<button
						class="shrink-0 rounded-md border border-orange px-2
							py-0.5 text-xs text-orange hover:bg-orange hover:text-white"
						on:click={() =>
							chosenCodes.has(course.courseCode) ? removeCourse(course) : addCourse(course)}
						title={chosenCodes.has(course.courseCode)
							? 'Remove this course from the generator'
							: 'Add this course to the generator'}
					>
						{chosenCodes.has(course.courseCode) ? 'Remove' : 'Add'}
					</button>
				</div>
			{/each}

			{#if isPending}
				<div class="py-4 text-center text-sm opacity-60">Searching…</div>
			{:else if searchResults.length === 0 && profSuggestions.length === 0}
				<div class="py-4 text-center text-sm opacity-60">No courses found.</div>
			{/if}
		</div>
	{/if}
</CourseSearchBox>
