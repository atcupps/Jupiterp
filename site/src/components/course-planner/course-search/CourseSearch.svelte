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
		DeptSuggestionsStore,
		UserEventsStore
	} from '../../../stores/CoursePlannerStores';
	import ScheduleSelector from './ScheduleSelector.svelte';
	import type { Course } from '@jupiterp/jupiterp';
	import type { ScheduleSelection, UserEvent } from '../../../types';
	import CourseFilters from './CourseFilters.svelte';
	import SolarSystemLoader from './SolarSystemLoader.svelte';
	import UserEventModal from './UserEventModal.svelte';

	const FILTER_SCROLL_COLLAPSE_THRESHOLD = 100;

	let hoveredSection: ScheduleSelection | null;
	HoveredSectionStore.subscribe((hovered) => {
		hoveredSection = hovered;
	});

	let selections: ScheduleSelection[] = [];
	CurrentScheduleStore.subscribe((stored) => {
		selections = stored.selections;
	});

	// subscribe to user events store
	let userEvents: UserEvent[] = [];
	UserEventsStore.subscribe((stored) => {
		userEvents = stored;
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

	let showCustomEventModal = false;

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

	// function to add user event from UserEventModal
	function addUserEvent(event: UserEvent) {
		const usedColors = [
			...selections.map((s) => s.colorNumber),
			...userEvents.map((e) => e.colorNumber)
		].sort((a, b) => a - b);
		let color = 0;
		for (const c of usedColors) {
			if (c === color) color++;
			else break;
		}
		event.colorNumber = color;

		const updatedCurrentSelections = [...selections];
		CurrentScheduleStore.update((current) => {
			return {
				scheduleName: current.scheduleName,
				selections: [...current.selections, event]
			};
		});

		// CurrentScheduleStore.set({
		// 	scheduleName: scheduleName,
		// 	selections: updatedCurrentSelections
		// });

		// UserEventsStore.update((events) => [...events, event]);
	}

	$: if (searchInput.length <= 1 || deptSuggestions.length <= 1) {
		highlightedSuggestionIndex = -1;
	}

	// Boolean for toggling search menu on smaller screens
	export let courseSearchSelected: boolean = false;

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

<!-- Layer to exit course search if user taps on the Schedule -->
<!-- Using this method to avoid having to listen to a variable on Schedule -->
{#if courseSearchSelected}
	<button
		class="fixed z-[51] w-full bg-black bg-opacity-20
                    lg:hidden"
		style="height: calc(100% - 3rem);"
		in:fade={{ duration: 150 }}
		out:fade={{ duration: 150 }}
		on:click={() => (courseSearchSelected = false)}
	/>
{/if}

<!-- Course Search -->
<div
	class="course-search visible fixed left-0 z-[52]
                            flex w-[300px] flex-col border-r-2 border-solid
                            border-divBorderLight bg-bgLight py-1
                            pl-1 pr-2
                            transition-transform duration-300 lg:static lg:ml-1.5
                            lg:h-full lg:min-w-[260px] lg:bg-transparent lg:pl-0
                            lg:shadow-none xl:min-w-[320px] 2xl:min-w-[400px] 2xl:text-lg
                            dark:border-divBorderDark dark:bg-bgDark"
	class:course-search-transition={!courseSearchSelected}
	class:shadow-lg={courseSearchSelected}
>
	<div class="ml-1 flex flex-row pb-1 text-xs 2xl:text-sm">
		<div>Fall 2026</div>
		<div class="grow text-right">
			Credits: {totalCredits}
		</div>
	</div>

	<ScheduleSelector />

	<div
		class="relative flex w-full flex-col border-b-2
                            border-t-2 border-solid border-divBorderLight p-1
                            lg:px-0 dark:border-divBorderDark"
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

	<!-- Course search results & dept suggestions -->
	<div
		class="courses-list overflow-x-none grow overflow-y-scroll
                px-1 lg:pl-0 lg:pr-1"
		on:wheel={handleResultsScroll}
	>
		<!-- Department suggestions dropdown -->
		{#if searchInput.length > 0 && deptSuggestions.length > 1}
			<div
				class="mt-2 rounded-lg border
                        border-outlineLight bg-bgLight
                        shadow-lg dark:border-outlineDark dark:bg-bgDark"
			>
				{#each deptSuggestions as deptOption, index}
					<button
						type="button"
						class={`flex w-full items-end px-3 py-1
                                text-left text-base transition-colors
                                hover:bg-outlineLight
                                hover:bg-opacity-20 lg:text-sm
                                dark:hover:bg-outlineDark
                                dark:hover:bg-opacity-30 
                                ${
																	highlightedSuggestionIndex === index
																		? `bg-outlineLight bg-opacity-20
                                    dark:bg-outlineDark dark:bg-opacity-30`
																		: ''
																}`}
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

	<!-- custom event adding -->
	<div
		class="mx-2 mb-2 mt-2 flex items-center
				justify-center rounded-lg border border-outlineLight bg-bgLight
				shadow-lg dark:border-outlineDark dark:bg-bgDark"
	>
		<button
			class="bg-primary hover:bg-primaryHover rounded px-2 py-2 text-white"
			type="button"
			on:click={() => {
				showCustomEventModal = true;
			}}
		>
			Add custom event...
		</button>
	</div>
</div>

{#if showCustomEventModal}
	<UserEventModal
		onClose={() => (showCustomEventModal = false)}
		onSubmit={(event) => addUserEvent(event)}
	/>
{/if}

<style>
	@media screen and (max-width: 1023px) {
		.course-search {
			height: calc(100svh - 3rem);
		}

		.course-search-transition {
			transition-property: transform;
			transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
			transition-duration: 150ms;
			transform: translateX(calc(-100% - 2px));
		}
	}
</style>
