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
		matchingStandardizedProfessorNames,
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
	import type { ScheduleBlock, ScheduleSelection } from '../../../types';
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
	import CustomUserEvents from './CustomUserEvents.svelte';

	const FILTER_SCROLL_COLLAPSE_THRESHOLD = 100;
	let searchResultsElement: HTMLDivElement;
	let blockSearchInputPointer = !plannerState.isDesktop;

	let hoveredSection: ScheduleSelection | null;
	HoveredSectionStore.subscribe((hovered) => {
		hoveredSection = hovered;
	});

	let selections: ScheduleBlock[] = [];
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

	// Professor suggestions shown when the user types @partial in the search box
	let profSuggestions: string[] = [];
	let highlightedProfSuggestionIndex = -1;

	/**
	 * Returns the partial professor name from an unquoted @word token in
	 * `input`, or null if no such token is present. Complete @"..." tokens
	 * are ignored since they are already resolved.
	 * @param input Raw search input string
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
				highlightedProfSuggestionIndex = -1;
			} else if (highlightedProfSuggestionIndex >= profSuggestions.length) {
				highlightedProfSuggestionIndex = profSuggestions.length - 1;
			}
		} else {
			profSuggestions = [];
			highlightedProfSuggestionIndex = -1;
		}
	}

	/**
	 * Selects a professor from the suggestions list, replacing the @partial
	 * token in the search input with @"Full Name" (multi-word) or @Name
	 * (single-word), then triggers a new search.
	 * @param name The standardized professor name to insert
	 */
	function selectProfessor(name: string) {
		const partial = getProfPartial(searchInput);
		if (partial === null) return;

		const token = `@${partial}`;
		const replacement = name.includes(' ') ? `@"${name}"` : `@${name}`;
		searchInput = searchInput.replace(token, replacement);
		highlightedProfSuggestionIndex = -1;
		setSearchResults(searchInput);
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		// Professor suggestions take priority when visible
		if (profSuggestions.length > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				highlightedProfSuggestionIndex =
					highlightedProfSuggestionIndex + 1 < profSuggestions.length
						? highlightedProfSuggestionIndex + 1
						: 0;
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				highlightedProfSuggestionIndex =
					highlightedProfSuggestionIndex > 0
						? highlightedProfSuggestionIndex - 1
						: profSuggestions.length - 1;
			} else if (event.key === 'Enter') {
				if (highlightedProfSuggestionIndex >= 0) {
					event.preventDefault();
					selectProfessor(profSuggestions[highlightedProfSuggestionIndex]);
				}
			}
			return;
		}

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
		let selectionsWithHovered: ScheduleBlock[] = appendHoveredSection(selections, hoveredSection);
		selectionsWithHovered.forEach((selection) => {
			if ('course' in selection) {
				totalCredits += selection.course.minCredits;
			}
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
			<div class="relative pt-1">
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
					placeholder="Search courses (e.g. 'MATH140') or @professor"
					class="w-full rounded-lg border-2 border-solid border-outlineLight bg-transparent px-2 py-0 text-xl placeholder:text-base lg:text-base lg:placeholder:text-sm dark:border-outlineDark"
				/>
			</div>

			<CourseFilters bind:showGenEdMenu={genEdMenuOpen} />
		</div>
	</div>
	<!-- Course search results & dept suggestions [min-height: 20rem - 7.75rem = 12.25rem]-->
	<!-- IDK what but [height: min-height (12.25rem) - 1.5rem = 10.75rem] -->
	<div
		id="planner-search-results"
		class="chain-scroll-only custom-scrollbar h-[calc(100svh-10.75rem)] min-h-[12.25rem] overflow-y-scroll px-1 focus:outline-none lg:h-auto lg:min-h-0"
		bind:this={searchResultsElement}
		use:chainScroll={{
			parent: plannerState.chainScrollParent,
			enabled: !plannerState.isDesktop,
			element: searchResultsElement
		}}
		on:wheel={handleResultsScroll}
	>
		<!-- Professor suggestions dropdown (shown when @partial is detected) -->
		{#if profSuggestions.length > 0}
			<div
				class="mt-2 rounded-lg border border-outlineLight bg-bgLight shadow-lg dark:border-outlineDark dark:bg-bgDark"
			>
				{#each profSuggestions as profName, index}
					<button
						type="button"
						class={`flex w-full items-center px-3 py-1 text-left text-base transition-colors hover:bg-outlineLight hover:bg-opacity-20 lg:text-sm dark:hover:bg-outlineDark dark:hover:bg-opacity-30
							${highlightedProfSuggestionIndex === index ? `bg-outlineLight bg-opacity-20 dark:bg-outlineDark dark:bg-opacity-30` : ''}`}
						on:mouseenter={() => {
							highlightedProfSuggestionIndex = index;
						}}
						on:click={() => selectProfessor(profName)}
					>
						<span class="grow truncate font-black">@{profName}</span>
					</button>
				{/each}
			</div>
			<!-- Department suggestions dropdown -->
		{:else if searchInput.length > 0 && deptSuggestions.length > 1}
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

	<CustomUserEvents />
</div>
