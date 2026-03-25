<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import CourseListing from './CourseListing.svelte';
	import {
		deptCodeToName,
		pendingResults,
		setSearchResults
	} from '../../../lib/course-planner/CourseSearch';
	import { appendHoveredSection } from '../../../lib/course-planner/Schedule';
	import {
		HoveredSectionStore,
		CurrentScheduleStore,
		SearchResultsStore,
		DeptSuggestionsStore
	} from '../../../stores/CoursePlannerStores';
	import ScheduleSelector from './ScheduleSelector.svelte';
	import type { Course } from '@jupiterp/jupiterp';
	import type { ScheduleSelection } from '../../../types';
	import CourseFilters from './CourseFilters.svelte';
	import SolarSystemLoader from './SolarSystemLoader.svelte';

	const FILTER_SCROLL_COLLAPSE_THRESHOLD = 100;

	let hoveredSection: ScheduleSelection | null;
	HoveredSectionStore.subscribe((hovered) => {
		hoveredSection = hovered;
	});

	let selections: ScheduleSelection[] = [];
	CurrentScheduleStore.subscribe((stored) => {
		selections = stored.selections;
	});

	// Variable and function for handling course search input
	let searchInput = '';
	let searchResults: Course[] = [];
	SearchResultsStore.subscribe((results) => {
		searchResults = results;
	});
	let deptSuggestions: string[] = [];
	let highlightedSuggestionIndex = -1;
	DeptSuggestionsStore.subscribe((suggestions) => {
		deptSuggestions = suggestions;
		if (suggestions.length === 0) {
			highlightedSuggestionIndex = -1;
		} else if (highlightedSuggestionIndex >= suggestions.length) {
			highlightedSuggestionIndex = suggestions.length - 1;
		}
	});

	let isPendingResults = false;
	$: if (searchInput.length > 0 && searchResults.length === 0) {
		isPendingResults = pendingResults();
	} else {
		isPendingResults = false;
	}

	let genEdMenuOpen = false;

	function selectDepartment(dept: string) {
		searchInput = dept;
		highlightedSuggestionIndex = -1;
		setSearchResults(dept);
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (deptSuggestions.length <= 1 || searchInput.length <= 1) {
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedSuggestionIndex =
				highlightedSuggestionIndex + 1 < deptSuggestions.length
					? highlightedSuggestionIndex + 1
					: 0;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedSuggestionIndex =
				highlightedSuggestionIndex > 0
					? highlightedSuggestionIndex - 1
					: deptSuggestions.length - 1;
		} else if (event.key === 'Enter') {
			if (highlightedSuggestionIndex >= 0 && highlightedSuggestionIndex < deptSuggestions.length) {
				event.preventDefault();
				selectDepartment(deptSuggestions[highlightedSuggestionIndex]);
			}
		}
	}

	$: if (searchInput.length <= 1 || deptSuggestions.length <= 1) {
		highlightedSuggestionIndex = -1;
	}

	$: {
		if (hoveredSection) {
			let index = searchResults.findIndex((course) => {
				return hoveredSection && course.courseCode === hoveredSection.section.courseCode;
			});
			if (index === -1) {
				HoveredSectionStore.set(null);
			}
		}
	}

	let totalCredits: number = 0;
	$: if (selections || hoveredSection) {
		totalCredits = 0;
		let selectionsWithHovered = appendHoveredSection(selections, hoveredSection);
		selectionsWithHovered.forEach((selection) => {
			totalCredits += selection.course.minCredits;
		});
	}

	let scrollAcc = 0;
	function handleResultsScroll(event: WheelEvent) {
		if (!genEdMenuOpen) {
			return;
		}

		scrollAcc += event.deltaY;
		if (scrollAcc < 0) {
			scrollAcc = 0;
		}
		if (scrollAcc >= FILTER_SCROLL_COLLAPSE_THRESHOLD) {
			genEdMenuOpen = false;
			scrollAcc = 0;
		}
	}
</script>

<!-- Course Search -->
<div
	class="order-2 min-h-80 w-full flex-col border-solid border-divBorderLight bg-bgLight pt-1 lg:order-1 dark:border-divBorderDark dark:bg-bgDark"
>
	<div class="px-1">
		<div class="ml-1 flex flex-row pb-1 text-xs 2xl:text-sm">
			<div>Fall 2026</div>
			<div class="grow text-right">
				Credits: {totalCredits}
			</div>
		</div>

		<ScheduleSelector />

		<div
			class="relative flex w-full flex-col border-b-2 border-t-2 border-solid border-divBorderLight dark:border-divBorderDark"
		>
			<!-- Course search box -->
			<input
				type="text"
				bind:value={searchInput}
				on:input={() => {
					setSearchResults(searchInput);
				}}
				on:keydown={handleSearchKeydown}
				placeholder="Search course codes, ex: 'MATH140'"
				class="w-full rounded-lg border-2
                            border-solid border-outlineLight
                            bg-transparent px-2 py-0 text-xl
                            placeholder:text-base lg:text-base
                            lg:placeholder:text-sm dark:border-outlineDark"
			/>

			<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />
		</div>
	</div>
	<!-- Course search results & dept suggestions -->
	<div
		class="px-1 courses-list h-[calc(100svh-11rem)] overflow-y-scroll pb-2 lg:h-[100svh-3rem]"
		on:wheel={handleResultsScroll}
	>
		<!-- Department suggestions dropdown -->
		{#if searchInput.length > 0 && deptSuggestions.length > 1}
			<div
				class="mt-2 rounded-lg border border-outlineLight bg-bgLight shadow-lg dark:border-outlineDark dark:bg-bgDark"
			>
				{#each deptSuggestions as deptOption, index}
					<button
						type="button"
						class={`flex w-full items-end px-3 py-1 text-left text-base transition-colors hover:bg-outlineLight hover:bg-opacity-20 lg:text-sm dark:hover:bg-outlineDark dark:hover:bg-opacity-30 
							${highlightedSuggestionIndex === index ? `bg-outlineLight bg-opacity-20 dark:bg-outlineDark dark:bg-opacity-30` : ''}`}
						on:mouseenter={() => {
							highlightedSuggestionIndex = index;
						}}
						on:click={() => selectDepartment(deptOption)}
					>
						<span class="min-w-[17%] shrink-0 font-black">
							{deptOption}
						</span>
						<span
							class="inline-block grow
                                    truncate text-xs italic"
						>
							{deptCodeToName[deptOption]}
						</span>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Course search results -->
		{#each searchResults as courseMatch (courseMatch.courseCode)}
			<CourseListing course={courseMatch} />
		{/each}

		{#if isPendingResults}
			<div class="flex items-center justify-center py-8">
				<SolarSystemLoader size={120} color="currentColor" />
			</div>
		{/if}
	</div>
</div>
