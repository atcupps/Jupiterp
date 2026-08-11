<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { run } from 'svelte/legacy';
  import { untrack } from 'svelte';

  import CourseListing from './CourseListing.svelte';
  import { pendingResults } from '../../../lib/course-planner/CourseSearch';
  import { appendHoveredSection } from '../../../lib/course-planner/Schedule';
  import { HoveredSectionStore, CurrentScheduleStore, SearchResultsStore } from '../../../stores/CoursePlannerStores';
  import ScheduleSelector from './ScheduleSelector.svelte';
  import type { Course } from '@jupiterp/jupiterp';
  import type { ScheduleBlock, ScheduleSelection } from '../../../types';
  import CourseSearchBox from './CourseSearchBox.svelte';
  import SolarSystemLoader from './SolarSystemLoader.svelte';
  import { createCourseSearchActivationController } from '../../../lib/course-planner/CourseSearchActivation';
  import { chainScroll } from '../../../lib/course-planner/ChainScroll';
  import { PlannerState } from '../../../stores/CoursePlannerStores';
  import CustomUserEvents from './CustomUserEvents.svelte';

  let plannerState: { isDesktop: boolean; chainScrollParent: HTMLElement | null } = $state({
    isDesktop: false,
    chainScrollParent: null,
  });
  PlannerState.subscribe((state: { isDesktop: boolean; chainScrollParent: HTMLElement | null }) => {
    plannerState = state;
  });

  const FILTER_SCROLL_COLLAPSE_THRESHOLD = 100;
  let searchResultsElement: HTMLDivElement | null = $state(null);
  // Seeded once from the initial layout, then owned by the activation
  // controller. This must NOT be $derived: the controller clears it when the
  // user taps the search box on mobile, and a derived would recompute that
  // override away on the next PlannerState update. `untrack` makes the
  // read-once intent explicit; the `run` block below still clears it on
  // desktop.
  let blockSearchInputPointer = $state(untrack(() => !plannerState.isDesktop));

  let hoveredSection: ScheduleSelection | null = $state(null);
  HoveredSectionStore.subscribe((hovered) => {
    hoveredSection = hovered;
  });

  let selections: ScheduleBlock[] = $state([]);
  CurrentScheduleStore.subscribe((stored) => {
    selections = stored.selections;
  });

  // Variable and function for handling course search input
  let searchInput = $state('');
  let searchResults: Course[] = $state([]);
  SearchResultsStore.subscribe((results) => {
    searchResults = results;
  });

  let isPendingResults = $state(false);
  run(() => {
    if (searchInput.length > 0 && searchResults.length === 0) {
      isPendingResults = pendingResults();
    } else {
      isPendingResults = false;
    }
  });

  let genEdMenuOpen = $state(false);
  let searchInputElement: HTMLInputElement | null = $state(null);
  let keyboardPrimeElement: HTMLInputElement | null = $state(null);
  let searchActivationInProgress = false;
  let suppressSearchBlurReset = false;
  run(() => {
    if (plannerState.isDesktop) {
      blockSearchInputPointer = false;
    }
  });

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
    scrollToSearch,
  });

  // export let courseSearchSelected: boolean = false;

  run(() => {
    if (hoveredSection) {
      let index = searchResults.findIndex((course) => {
        return hoveredSection && course.courseCode === hoveredSection.section.courseCode;
      });
      if (index === -1) {
        HoveredSectionStore.set(null);
      }
    }
  });

  let totalCredits: number = $state(0);
  run(() => {
    if (selections || hoveredSection) {
      totalCredits = 0;
      let selectionsWithHovered: ScheduleBlock[] = appendHoveredSection(selections, hoveredSection);
      selectionsWithHovered.forEach((selection) => {
        if ('course' in selection) {
          totalCredits += selection.course.minCredits;
        }
      });
    }
  });

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
  class="bg-bg-primary order-2 min-h-80 w-full flex-col border-solid lg:order-1 lg:grid lg:h-[100svh-3rem] lg:max-h-[100svh-3rem] lg:grid-cols-1 lg:grid-rows-[auto_minmax(0,1fr)]"
>
  <!-- Course search input and filters [height of 7.5rem] -->
  <div id="planner-course-search" class="px-1 pt-1">
    <div class="ml-1 flex flex-row pb-1 text-xs 2xl:text-sm">
      <div>Fall 2026</div>
      <div class="grow text-right">Credits: {totalCredits}</div>
    </div>
    <ScheduleSelector />
    <div class="relative flex w-full flex-col border-b-2 border-t-2 border-solid pt-1">
      <!-- Course search box (input, filters, and dept/prof suggestions) -->
      <CourseSearchBox
        bind:searchInput
        bind:genEdMenuOpen
        bind:inputElement={searchInputElement}
        inputId="planner-course-search-input"
        onFocus={searchActivation.handleSearchFocus}
        onBlur={searchActivation.handleSearchBlur}
      >
        <!-- Mobile keyboard prime input: used to make the mobile keyboard appear -->
        {#snippet beforeInput()}
          <input
            bind:this={keyboardPrimeElement}
            id="mobile-keyboard-prime"
            type="text"
            tabindex="-1"
            autocomplete="off"
            class="pointer-events-none fixed left-0 top-0 h-0 w-0 opacity-0"
          />
        {/snippet}
      </CourseSearchBox>
    </div>
  </div>
  <!-- Course search results & dept suggestions [min-height: 20rem - 7.75rem = 12.25rem]-->
  <!-- IDK what but [height: min-height (12.25rem) - 1.5rem = 10.75rem] -->
  <div
    bind:this={searchResultsElement}
    id="planner-search-results"
    class="chain-scroll-only custom-scrollbar min-h-49 focus:outline-hidden h-[calc(100svh-10.75rem)] overflow-y-scroll px-1 lg:h-auto lg:min-h-0"
    use:chainScroll={{
      parent: plannerState.chainScrollParent,
      enabled: !plannerState.isDesktop,
      element: searchResultsElement,
    }}
    onwheel={handleResultsScroll}
  >
    <!-- Course search results -->
    {#each searchResults as courseMatch (courseMatch.courseCode)}
      <CourseListing course={courseMatch} isDesktop={plannerState.isDesktop} />
    {/each}
    {#if isPendingResults}
      <div class="flex items-center justify-center py-8">
        <SolarSystemLoader size={120} />
      </div>
    {/if}
  </div>

  <CustomUserEvents />
</div>
