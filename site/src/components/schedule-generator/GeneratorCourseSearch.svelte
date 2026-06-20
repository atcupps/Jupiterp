<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import type { Course } from '@jupiterp/jupiterp';
	import { pendingResults, setSearchResults } from '../../lib/course-planner/CourseSearch';
	import { SearchResultsStore } from '../../stores/CoursePlannerStores';
	import { GeneratorRequirementsStore } from '../../stores/GeneratorStores';
	import { formatCredits, splitCourseCode } from '../../lib/course-planner/Formatting';
	import CourseFilters from '../course-planner/course-search/CourseFilters.svelte';

	let genEdMenuOpen = false;
	let searchInput = '';
	let searchResults: Course[] = [];
	SearchResultsStore.subscribe((results) => {
		searchResults = results;
	});

	let chosenCodes = new Set<string>();
	GeneratorRequirementsStore.subscribe((reqs) => {
		chosenCodes = new Set(reqs.map((r) => r.course.courseCode));
	});

	let isPending = false;
	$: if (searchInput.length > 0 && searchResults.length === 0) {
		isPending = pendingResults();
	} else {
		isPending = false;
	}

	function addCourse(course: Course) {
		if (chosenCodes.has(course.courseCode)) {
			return;
		}
		GeneratorRequirementsStore.update((reqs) => [
			...reqs,
			{ course, required: true, pin: { kind: 'none' } }
		]);
	}
</script>

<div class="flex flex-col">
	<input
		type="text"
		bind:value={searchInput}
		on:input={() => setSearchResults(searchInput)}
		placeholder="Search courses (e.g. 'MATH140') or @professor"
		class="w-full rounded-lg border-2 border-solid border-outlineLight
			bg-transparent px-2 py-1 text-base placeholder:text-sm
			focus:outline-none dark:border-outlineDark"
	/>

	<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />

	{#if searchInput.length > 0}
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
							py-0.5 text-xs text-orange enabled:hover:bg-orange
							enabled:hover:text-white disabled:opacity-40"
						disabled={chosenCodes.has(course.courseCode)}
						on:click={() => addCourse(course)}
						title="Add this course to the generator"
					>
						{chosenCodes.has(course.courseCode) ? 'Added' : 'Add'}
					</button>
				</div>
			{/each}

			{#if isPending}
				<div class="py-4 text-center text-sm opacity-60">Searching…</div>
			{:else if searchResults.length === 0}
				<div class="py-4 text-center text-sm opacity-60">No courses found.</div>
			{/if}
		</div>
	{/if}
</div>
