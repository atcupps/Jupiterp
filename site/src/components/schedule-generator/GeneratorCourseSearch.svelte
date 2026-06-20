<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import type { Course } from '@jupiterp/jupiterp';
	import {
		deptCodeToName,
		matchingStandardizedProfessorNames,
		pendingResults,
		setSearchResults
	} from '../../lib/course-planner/CourseSearch';
	import { DeptSuggestionsStore, SearchResultsStore } from '../../stores/CoursePlannerStores';
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

	// Department suggestions shown for ambiguous partial department codes.
	let deptSuggestions: string[] = [];
	let highlightedDeptIndex = -1;
	DeptSuggestionsStore.subscribe((suggestions) => {
		deptSuggestions = suggestions;
		if (suggestions.length === 0) {
			highlightedDeptIndex = -1;
		} else if (highlightedDeptIndex >= suggestions.length) {
			highlightedDeptIndex = suggestions.length - 1;
		}
	});

	// Professor suggestions shown when the user types @partial in the search.
	let profSuggestions: string[] = [];
	let highlightedProfIndex = -1;

	/**
	 * Returns the partial professor name from an unquoted @word token in
	 * `input`, or null if no such token is present. Complete @"..." tokens are
	 * ignored since they are already resolved.
	 */
	function getProfPartial(input: string): string | null {
		const withoutQuoted = input.replace(/@"[^"]*"/g, '');
		const match = /@(\S*)/.exec(withoutQuoted);
		return match && match[1].length >= 1 ? match[1] : null;
	}

	$: {
		const partial = getProfPartial(searchInput);
		if (partial) {
			profSuggestions = matchingStandardizedProfessorNames(partial);
			if (profSuggestions.length === 0) {
				highlightedProfIndex = -1;
			} else if (highlightedProfIndex >= profSuggestions.length) {
				highlightedProfIndex = profSuggestions.length - 1;
			}
		} else {
			profSuggestions = [];
			highlightedProfIndex = -1;
		}
	}

	/**
	 * Replaces the @partial token with @"Full Name" (multi-word) or @Name
	 * (single-word) and triggers a new search, mirroring the main planner.
	 */
	function selectProfessor(name: string) {
		const partial = getProfPartial(searchInput);
		if (partial === null) return;
		const token = `@${partial}`;
		const replacement = name.includes(' ') ? `@"${name}"` : `@${name}`;
		searchInput = searchInput.replace(token, replacement);
		highlightedProfIndex = -1;
		setSearchResults(searchInput);
	}

	function selectDepartment(dept: string) {
		searchInput = dept;
		highlightedDeptIndex = -1;
		setSearchResults(dept);
	}

	function handleKeydown(event: KeyboardEvent) {
		// Professor suggestions take priority when visible.
		if (profSuggestions.length > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				highlightedProfIndex = (highlightedProfIndex + 1) % profSuggestions.length;
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				highlightedProfIndex =
					highlightedProfIndex > 0 ? highlightedProfIndex - 1 : profSuggestions.length - 1;
			} else if (event.key === 'Enter' && highlightedProfIndex >= 0) {
				event.preventDefault();
				selectProfessor(profSuggestions[highlightedProfIndex]);
			}
			return;
		}

		if (deptSuggestions.length <= 1 || searchInput.length <= 1) {
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedDeptIndex = (highlightedDeptIndex + 1) % deptSuggestions.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedDeptIndex =
				highlightedDeptIndex > 0 ? highlightedDeptIndex - 1 : deptSuggestions.length - 1;
		} else if (event.key === 'Enter' && highlightedDeptIndex >= 0) {
			event.preventDefault();
			selectDepartment(deptSuggestions[highlightedDeptIndex]);
		}
	}

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
		on:keydown={handleKeydown}
		placeholder="Search courses (e.g. 'MATH140') or @professor"
		class="w-full rounded-lg border-2 border-solid border-outlineLight
			bg-transparent px-2 py-1 text-base placeholder:text-sm
			focus:outline-none dark:border-outlineDark"
	/>

	<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />

	<!-- Professor suggestions (shown when @partial is detected) -->
	{#if profSuggestions.length > 0}
		<div
			class="mt-2 overflow-hidden rounded-lg border border-outlineLight
				dark:border-outlineDark"
		>
			{#each profSuggestions as profName, index}
				<button
					type="button"
					class="flex w-full items-center px-3 py-1 text-left text-sm
						transition-colors hover:bg-outlineLight hover:bg-opacity-20
						dark:hover:bg-outlineDark dark:hover:bg-opacity-30"
					class:bg-outlineLight={highlightedProfIndex === index}
					class:bg-opacity-20={highlightedProfIndex === index}
					on:mouseenter={() => (highlightedProfIndex = index)}
					on:click={() => selectProfessor(profName)}
				>
					<span class="grow truncate font-black">@{profName}</span>
				</button>
			{/each}
		</div>
		<!-- Department suggestions -->
	{:else if searchInput.length > 0 && deptSuggestions.length > 1}
		<div
			class="mt-2 overflow-hidden rounded-lg border border-outlineLight
				dark:border-outlineDark"
		>
			{#each deptSuggestions as deptOption, index}
				<button
					type="button"
					class="flex w-full items-end px-3 py-1 text-left text-sm
						transition-colors hover:bg-outlineLight hover:bg-opacity-20
						dark:hover:bg-outlineDark dark:hover:bg-opacity-30"
					class:bg-outlineLight={highlightedDeptIndex === index}
					class:bg-opacity-20={highlightedDeptIndex === index}
					on:mouseenter={() => (highlightedDeptIndex = index)}
					on:click={() => selectDepartment(deptOption)}
				>
					<span class="min-w-[17%] shrink-0 font-black">{deptOption}</span>
					<span class="inline-block grow truncate text-xs italic">
						{deptCodeToName[deptOption]}
					</span>
				</button>
			{/each}
		</div>
	{/if}

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
			{:else if searchResults.length === 0 && profSuggestions.length === 0}
				<div class="py-4 text-center text-sm opacity-60">No courses found.</div>
			{/if}
		</div>
	{/if}
</div>
