<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
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
	import { createCourseSearchActivationController } from '../../../lib/course-planner/CourseSearchActivation';
	import { chainScroll } from '../../../lib/course-planner/ChainScroll';
	import { PlannerState } from '../../../stores/CoursePlannerStores';

	let plannerState: { isDesktop: boolean; chainScrollParent: HTMLElement | null } = {
		isDesktop: false,
		chainScrollParent: null
	};
	PlannerState.subscribe((state: { isDesktop: boolean; chainScrollParent: HTMLElement | null }) => {
		plannerState = state;
	});

	const FILTER_SCROLL_COLLAPSE_THRESHOLD = 100;
	let searchResultsElement: HTMLDivElement;
	let blockSearchInputPointer = !plannerState.isDesktop;

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
	let searchInputElement: HTMLInputElement | null = null;
	let keyboardPrimeElement: HTMLInputElement | null = null;
	let searchActivationInProgress = false;
	let suppressSearchBlurReset = false;
	$: if (plannerState.isDesktop) {
		blockSearchInputPointer = false;
	}

	const searchActivation = createCourseSearchActivationController({
		isDesktop: () => plannerState.isDesktop,
		blockSearchInputPointer: () => blockSearchInputPointer,
		setBlockSearchInputPointer: (value: boolean) => {
			blockSearchInputPointer = value;
		},
		searchActivationInProgress: () => searchActivationInProgress,
		setSearchActivationInProgress: (value: boolean) => {
			searchActivationInProgress = value;
		},
		suppressSearchBlurReset: () => suppressSearchBlurReset,
		setSuppressSearchBlurReset: (value: boolean) => {
			suppressSearchBlurReset = value;
		},
		searchInputElement: () => searchInputElement,
		keyboardPrimeElement: () => keyboardPrimeElement,
		scrollToSearch
	});

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

	function scrollToSearch() {
		const searchElement = document.getElementById('planner-course-search');
		if (!searchElement) {
			return;
		}

		searchElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<!-- Course Search -->
<div
	class="order-2 min-h-80 w-full flex-col border-solid border-divBorderLight bg-bgLight lg:order-1 lg:grid lg:h-[100svh-3rem] lg:grid-cols-1 lg:grid-rows-[auto_minmax(0,1fr)] dark:border-divBorderDark dark:bg-bgDark"
>
	<!-- Course search input and filters [height of 7.5rem] -->
	<div id="planner-course-search" class="px-1 pt-1">
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
			<div class="relative">
				<!-- Mobile keyboard prime input: used to make the mobile keyboard appear -->
				<input
					type="text"
					id="mobile-keyboard-prime"
					bind:this={keyboardPrimeElement}
					tabindex="-1"
					autocomplete="off"
					class="pointer-events-none fixed left-0 top-0 h-0 w-0 opacity-0"
				/>
				<input
					type="text"
					id="planner-course-search-input"
					bind:this={searchInputElement}
					bind:value={searchInput}
					on:focus={searchActivation.handleSearchFocus}
					on:blur={searchActivation.handleSearchBlur}
					on:input={() => {
						setSearchResults(searchInput);
					}}
					on:keydown={handleSearchKeydown}
					placeholder="Search course codes, ex: 'MATH140'"
					class="w-full rounded-lg border-2 border-solid border-outlineLight bg-transparent px-2 py-0 text-xl placeholder:text-base lg:text-base lg:placeholder:text-sm dark:border-outlineDark"
				/>
			</div>

			<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />
		</div>
	</div>
	<!-- Course search results & dept suggestions [min-height: 20rem - 7.5rem = 12.75rem]-->
	<div
		id="planner-search-results"
		class="chain-scroll-only custom-scrollbar h-[calc(100svh-10.5rem)] min-h-[12.75rem] overflow-y-scroll px-1 focus:outline-none lg:h-auto lg:min-h-0"
		bind:this={searchResultsElement}
		use:chainScroll={{
			parent: plannerState.chainScrollParent,
			enabled: !plannerState.isDesktop,
			element: searchResultsElement
		}}
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
						<span class="inline-block grow truncate text-xs italic">
							{deptCodeToName[deptOption]}
						</span>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Course search results -->
		{#each searchResults as courseMatch (courseMatch.courseCode)}
			<CourseListing course={courseMatch} isDesktop={plannerState.isDesktop} />
		{/each}

		{#if isPendingResults}
			<div class="flex items-center justify-center py-8">
				<SolarSystemLoader size={120} color="currentColor" />
			</div>
		{/if}
	</div>
</div>
