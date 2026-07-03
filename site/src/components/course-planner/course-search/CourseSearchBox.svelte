<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<!--
	Shared course-search box: the search input, filters, and professor/department
	suggestion dropdowns used by both the main planner (CourseSearch.svelte) and
	the schedule generator (GeneratorCourseSearch.svelte). The owning component
	supplies the results rendering via the default slot.
-->
<script lang="ts">
	import {
		deptCodeToName,
		matchingStandardizedProfessorNames,
		pendingResults,
		setSearchResults
	} from '../../../lib/course-planner/CourseSearch';
	import {
		applyProfessorSelection,
		getProfPartial
	} from '../../../lib/course-planner/CourseSuggestions';
	import { DeptSuggestionsStore, SearchResultsStore } from '../../../stores/CoursePlannerStores';
	import type { Course } from '@jupiterp/jupiterp';
	import CourseFilters from './CourseFilters.svelte';

	/** Current search text. Two-way bound so the parent can read/clear it. */
	export let searchInput = '';
	/** Whether the gen-ed filter menu is open; forwarded to CourseFilters. */
	export let genEdMenuOpen = false;
	/** Optional id for the input element (the planner relies on this). */
	export let inputId: string | undefined = undefined;
	/** Styling for the input element; defaults to the generator's sizing. */
	export let inputClass =
		'w-full rounded-lg border-2 border-solid border-outlineLight bg-transparent px-2 py-1 ' +
		'text-base placeholder:text-sm focus:outline-none dark:border-outlineDark';
	export let placeholder = "Search courses (e.g. 'MATH140') or @professor";
	/** Bound back to the parent so it can manage focus (mobile activation). */
	export let inputElement: HTMLInputElement | null = null;
	/** Focus/blur handlers for the planner's mobile keyboard activation. */
	export let onFocus: (event: FocusEvent) => void = () => {};
	export let onBlur: (event: FocusEvent) => void = () => {};
	/** Styling for the suggestion dropdown container. */
	export let dropdownClass =
		'custom-scrollbar mt-2 max-h-72 overflow-y-auto rounded-lg border ' +
		'border-outlineLight bg-bgLight shadow-lg ' +
		'dark:border-outlineDark dark:bg-bgDark';

	let searchResults: Course[] = [];
	SearchResultsStore.subscribe((results) => {
		searchResults = results;
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

	$: if (searchInput.length <= 1 || deptSuggestions.length <= 1) {
		highlightedDeptIndex = -1;
	}

	// Whether the most recent search is still awaiting results.
	let isPending = false;
	$: if (searchInput.length > 0 && searchResults.length === 0) {
		isPending = pendingResults();
	} else {
		isPending = false;
	}

	/**
	 * Replaces the @partial token with @"Full Name" (multi-word) or @Name
	 * (single-word) and triggers a new search.
	 * @param name The standardized professor name to insert
	 */
	function selectProfessor(name: string) {
		if (getProfPartial(searchInput) === null) return;
		searchInput = applyProfessorSelection(searchInput, name);
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
</script>

<div class="relative flex w-full flex-col">
	<slot name="before-input" />
	<input
		type="text"
		id={inputId}
		bind:this={inputElement}
		bind:value={searchInput}
		on:focus={onFocus}
		on:blur={onBlur}
		on:input={() => setSearchResults(searchInput)}
		on:keydown={handleKeydown}
		{placeholder}
		class={inputClass}
	/>

	<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />

	<!-- Professor suggestions (shown when @partial is detected) -->
	{#if profSuggestions.length > 0}
		<div class={dropdownClass}>
			{#each profSuggestions as profName, index}
				<button
					type="button"
					class="flex w-full items-center px-3 py-1 text-left text-base
						transition-colors hover:bg-outlineLight hover:bg-opacity-20
						lg:text-sm dark:hover:bg-outlineDark dark:hover:bg-opacity-30"
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
		<div class={dropdownClass}>
			{#each deptSuggestions as deptOption, index}
				<button
					type="button"
					class="flex w-full items-end px-3 py-1 text-left text-base
						transition-colors hover:bg-outlineLight hover:bg-opacity-20
						lg:text-sm dark:hover:bg-outlineDark dark:hover:bg-opacity-30"
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

	<slot {searchResults} {isPending} {profSuggestions} />
</div>
