<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import InstructorListing from './InstructorListing.svelte';
  import MeetingListing from './MeetingListing.svelte';
  import {
    HoveredSectionStore,
    CurrentScheduleStore,
    CourseInfoPairStore,
    CourseSearchFilterStore,
  } from '../../../stores/CoursePlannerStores';
  import SeatData from './SeatData.svelte';
  import type { Section, CourseBasic } from '@jupiterp/jupiterp';
  import type { ScheduleBlock, ScheduleSelection } from '../../../types';
  import { noDifferences } from '$lib/course-planner/Schedule';
  import { firstAvailableColor } from '$lib/course-planner/ColorSelector';

  export let courseCode: string;
  export let section: Section;
  export let course: CourseBasic;
  export let isDesktop: boolean;

  let hoveredSection: ScheduleSelection | null;
  HoveredSectionStore.subscribe((store) => {
    hoveredSection = store;
  });

  let selectionsList: ScheduleBlock[];
  let scheduleName: string;
  CurrentScheduleStore.subscribe((stored) => {
    selectionsList = stored.selections;
    scheduleName = stored.scheduleName;
  });

  let onlyShowingOpen = false;
  CourseSearchFilterStore.subscribe((store) => {
    onlyShowingOpen = store.clientSideFilters.onlyOpen === true;
  });

  let newSelection: ScheduleSelection = {
    course,
    section,
    hover: false,
    differences: noDifferences(),
    colorNumber: -1,
  };
  let sectionAdded: boolean;
  $: if (selectionsList || hoveredSection || onlyShowingOpen || false) {
    if (onlyShowingOpen && section.openSeats === 0) {
      sectionAdded = false;
    } else {
      sectionAdded = selectionsList.some((obj) => selectionEquals(obj));
    }
  }

  let hoverSection: ScheduleSelection = {
    course,
    section,
    hover: true,
    differences: noDifferences(),
    colorNumber: -1,
  };

  // Auto-scroll for non desktop screens: scroll up to schedule when adding a section
  let plannerContainer: HTMLElement | null = null;
  onMount(() => {
    plannerContainer = document.getElementById('planner-container');
  });
  function scrollToTopPlannerTop() {
    if (!isDesktop && plannerContainer) {
      plannerContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  let addAlertVisible: boolean = false;
  let removeAlertVisible: boolean = false;

  // Function to show or fade
  // format-check exempt 8
  function showAddAlert() {
    addAlertVisible = true; // Make the div visible
    setTimeout(() => {
      setTimeout(() => {
        addAlertVisible = false;
      }, 500); // Delay before making `addAlertVisible` false to start fade out
    }, 0); // No delay after making visible
  }

  function showRemoveAlert() {
    removeAlertVisible = true;
    setTimeout(() => {
      setTimeout(() => {
        removeAlertVisible = false;
      }, 500); // Delay before making `removeAlertVisible` false to start fade out
    }, 0); // No delay after making visible
  }

  // In order for Svelte's reactivity to work properly, `selectionsList`
  // needs to be reassigned instead of using `.push` or `.splice`.
  function addSectionToSchedule() {
    if (!sectionAdded) {
      showAddAlert();
      removeHoverSection();
      newSelection.colorNumber = firstAvailableColor(selectionsList);
      CurrentScheduleStore.set({
        scheduleName,
        selections: [...selectionsList, newSelection],
      });
      CourseInfoPairStore.update((value) => {
        return value === null
          ? null
          : {
              courseCode: courseCode,
              sectionCode: section.sectionCode,
            };
      });
    } else {
      showRemoveAlert();
      const index = selectionsList.findIndex((obj) => selectionEquals(obj));
      if (index !== -1) {
        CurrentScheduleStore.set({
          scheduleName,
          selections: [...selectionsList.slice(0, index), ...selectionsList.slice(index + 1)],
        });
      }
      CourseInfoPairStore.update((value) => {
        return value !== null && value.courseCode === courseCode && value.sectionCode === section.sectionCode
          ? null
          : value;
      });
    }
    sectionAdded = !sectionAdded;
    if (isDesktop) {
      addHoverSection();
    }
  }

  function addHoverSection() {
    if (!sectionAdded) {
      hoverSection.colorNumber = firstAvailableColor(selectionsList);
      HoveredSectionStore.set(hoverSection);
    }
  }

  function removeHoverSection() {
    HoveredSectionStore.set(null);
  }

  function selectionEquals(s: ScheduleBlock): boolean {
    return (
      'course' in s && s.course.courseCode === courseCode && s.section.sectionCode === section.sectionCode && !s.hover
    );
  }

  let profsHover: boolean = false;
  let locationHover: boolean = false;

  const alertClasses: string = `fixed left-[50%] translate-x-[-50%] z-50 w-[40%] top-14 min-w-72 h-8 rounded-lg text-center text-white lg:hidden bg-orange shadow-lg content-center transition-opacity duration-500`;
</script>

<!-- Ignoring a11y for mouseover because it's a non-essential feature -->
<div
  role="listitem"
  onmouseover={isDesktop ? addHoverSection : null}
  onmouseout={isDesktop ? removeHoverSection : null}
  onfocus={isDesktop ? addHoverSection : null}
  onfocusin={isDesktop ? addHoverSection : null}
  onfocusout={isDesktop ? removeHoverSection : null}
  onblur={isDesktop ? removeHoverSection : null}
  class="border-outlineLight dark:border-outlineDark not-last:border-b grid grid-cols-[auto_1fr] transition
  {sectionAdded ? 'bg-hoverLight dark:bg-hoverDark' : 'hover:bg-hoverLight/50 dark:hover:bg-hoverDark/50'}"
>
  <!-- Section code (click to view) -->
  <!-- onclick triggers addSectionToSchedule and then scrollToTopPlannerTop -->
  <button
    onclick={() => {
      addSectionToSchedule();
      scrollToTopPlannerTop();
    }}
    class="text-secCodesLight dark:text-secCodesDark w-12 text-sm font-semibold xl:w-14 xl:text-base"
  >
    <div class="h-full align-top">
      {section.sectionCode}
    </div>
  </button>

  <button
    onclick={addSectionToSchedule}
    title="{sectionAdded ? 'Remove course from' : 'Add course to'} schedule"
    class="w-full text-left"
  >
    <!-- Section info -->
    <div class="w-full">
      <!-- Instructors -->
      {#each section.instructors as instructor (instructor)}
        <InstructorListing {instructor} bind:profsHover {removeHoverSection} />
      {/each}

      <!-- Seats info -->
      <SeatData {section} />

      <!-- Class meetings -->
      {#each section.meetings as meeting (meeting)}
        <MeetingListing {meeting} bind:locationHover {removeHoverSection} />
      {/each}
    </div>
  </button>
</div>

{#if addAlertVisible}
  <div class={alertClasses} out:fade={{ duration: 300 }}>
    <span class="h-full align-middle font-medium">Class Added</span>
  </div>
{/if}

{#if removeAlertVisible}
  <div class={alertClasses} out:fade={{ duration: 300 }}>
    <span class="h-full align-middle font-medium">Class Removed</span>
  </div>
{/if}
