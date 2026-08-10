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
	/** Optional placeholder text for the input element. */
	export let placeholder = "Search courses (e.g. 'MATH140') or @professor";
	/** Bound back to the parent so it can manage focus (mobile activation). */
	export let inputElement: HTMLInputElement | null = null;
	/** Focus/blur handlers for the planner's mobile keyboard activation. */
	export let onFocus: (event: FocusEvent) => void = () => {};
	export let onBlur: (event: FocusEvent) => void = () => {};
	/** Styling for the suggestion dropdown container. */

	let searchResults: Course[] = [];
	SearchResultsStore.subscribe((results) => {
		searchResults = results;
	});

	// Department suggestions shown for ambiguous partial department codes.
	let deptSuggestions: string[] = [];
	DeptSuggestionsStore.subscribe((suggestions) => {
		deptSuggestions = suggestions;
	});

	// Professor suggestions shown when the user types @partial in the search.
	let profSuggestions: string[] = [];

	$: {
		const partial = getProfPartial(searchInput);
		profSuggestions = partial ? matchingStandardizedProfessorNames(partial) : [];
	}

	// Unified suggestion type (exclusive OR): either a prof or a dept
	type Suggestion = { kind: 'prof'; value: string } | { kind: 'dept'; value: string };
	let suggestionItems: Suggestion[] = [];
	let highlightedIndex = -1;

	$: suggestionItems =
		profSuggestions.length > 0
			? profSuggestions.map((name) => ({ kind: 'prof', value: name }))
			: searchInput.length > 0 && deptSuggestions.length > 1
				? deptSuggestions.map((code) => ({ kind: 'dept', value: code }))
				: [];

	$: {
		if (suggestionItems.length === 0) highlightedIndex = -1;
		else if (highlightedIndex >= suggestionItems.length)
			highlightedIndex = suggestionItems.length - 1;
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
		highlightedIndex = -1;
		setSearchResults(searchInput);
	}

	function selectDepartment(dept: string) {
		searchInput = dept;
		highlightedIndex = -1;
		setSearchResults(dept);
	}

	function selectSuggestionByIndex(index: number) {
		const s = suggestionItems[index];
		if (!s) return;
		if (s.kind === 'prof') selectProfessor(s.value);
		else selectDepartment(s.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (suggestionItems.length === 0) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedIndex = (highlightedIndex + 1) % suggestionItems.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : suggestionItems.length - 1;
		} else if (event.key === 'Enter' && highlightedIndex >= 0) {
			event.preventDefault();
			selectSuggestionByIndex(highlightedIndex);
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
		class="w-full rounded-lg border-2 border-solid border-outlineLight bg-transparent px-2 py-0 text-xl placeholder:text-base lg:text-base lg:placeholder:text-sm dark:border-outlineDark"
		autocomplete="off"
		{placeholder}
	/>

	<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />

	<!-- Unified suggestions (professor OR department) -->
	{#if suggestionItems.length > 0}
		<div
			class="overflow-clip border border-outlineLight bg-bgLight shadow-lg dark:border-outlineDark dark:bg-bgDark"
		>
			<div class="custom-scrollbar h-[50svh] max-h-72 min-h-16 overflow-y-auto">
				{#each suggestionItems as item, index}
					<button
						type="button"
						class={'flex w-full ' +
							(item.kind === 'dept' ? 'items-end ' : 'items-center ') +
							'px-3 py-1 text-left text-base transition-colors hover:bg-outlineLight hover:bg-opacity-20 lg:text-sm dark:hover:bg-outlineDark dark:hover:bg-opacity-30'}
						class:bg-outlineLight={highlightedIndex === index}
						class:bg-opacity-20={highlightedIndex === index}
						on:mouseenter={() => (highlightedIndex = index)}
						on:click={() => selectSuggestionByIndex(index)}
					>
						{#if item.kind === 'prof'}
							<span class="grow truncate font-black"
								><span class="font-normal">@</span>{item.value}</span
							>
						{:else}
							<span class="min-w-[17%] shrink-0 font-black">{item.value}</span>
							<span class="grow self-center truncate text-xs italic"
								>{deptCodeToName[item.value]}</span
							>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<slot {searchResults} {isPending} {profSuggestions} />
</div>
