<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import SectionListing from './SectionListing.svelte';
  import { formatCredits, testudoLink } from '../../../lib/course-planner/Formatting';
  import { slide } from 'svelte/transition';
  import CourseCondition from './CourseCondition.svelte';
  import { AngleRightOutline } from 'flowbite-svelte-icons';
  import type { Course, Section } from '@jupiterp/jupiterp';

  export let course: Course;
  export let isDesktop: boolean;

  function pseudoSection(): Section {
    return {
      courseCode: course.courseCode,
      sectionCode: 'N/A',
      instructors: ['Testudo Terrapin 🐢'],
      meetings: ['No Sections'],
      openSeats: 0,
      totalSeats: 0,
      waitlist: 0,
      holdfile: null,
    };
  }

  let showMoreInfo: boolean = false;

  function scrollToCourseTop(event: FocusEvent) {
    const button = event.currentTarget as HTMLElement | null;
    const container = button?.closest('[id^="results-"]') as HTMLElement | null;
    container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div
  id="results-{course.courseCode}"
  class="border-outlineLight bg-bgSecondaryLight dark:border-outlineDark dark:bg-bgSecondaryDark my-2 flex scroll-mt-2 flex-col rounded-lg border-2 border-solid px-2"
>
  <div
    role="button"
    tabindex="0"
    onfocus={scrollToCourseTop}
    class="border-outlineLight bg-bgSecondaryLight dark:border-outlineDark dark:bg-bgSecondaryDark top-0 z-10 border-b-2 border-solid px-2 text-left"
  >
    <!-- Course code and credit count -->
    <div class="flex flex-row align-middle">
      <div class="grow text-left align-middle"><b>{course.courseCode}</b></div>
      <div class="grow text-right align-middle text-sm 2xl:text-base">
        Credits: {formatCredits(course.minCredits, course.maxCredits)}
      </div>
    </div>

    <!-- Course title -->
    <div class="wrap max-w-63.5 xl:max-w-78.5 2xl:max-w-98.5 text-sm 2xl:text-base">{course.name}</div>
    {#if course.genEds != null && course.genEds.length > 0}
      <div class="align-center my-1 flex w-full flex-row justify-start">
        {#each course.genEds as genEd (genEd.code)}
          <a
            class="border-orange text-orange hover:bg-orange hover:text-bgSecondaryLight hover:dark:text-bgSecondaryDark mr-1 rounded-xl border px-1 text-[0.625rem] font-bold leading-tight transition 2xl:text-xs"
            href={`https://app.testudo.umd.edu/soc/gen-ed/202608/` + genEd.code}
            rel="external"
            target="_blank"
            title={'GenEd: ' + genEd.name}
          >
            {genEd.code}
          </a>
        {/each}
      </div>
    {/if}

    <button
      class="text-secCodesLight hover:text-secCodesDark flex w-full flex-row content-center text-left text-sm dark:text-[#8892a8] 2xl:text-base"
      title={!showMoreInfo ? 'Show more course details' : 'Hide course details'}
      onclick={() => {
        showMoreInfo = !showMoreInfo;
      }}
    >
      <div class="-ml-1 h-full self-center transition-transform" class:rotate-90={showMoreInfo}>
        <AngleRightOutline class="h-4 w-4" />
      </div>
      <span> {showMoreInfo ? 'Hide details' : 'Show details'} </span>
    </button>
    {#if showMoreInfo}
      <div class="font-base flex flex-col py-1 text-sm leading-tight 2xl:text-base" transition:slide>
        <div class="pb-1">
          <a href={testudoLink(course.courseCode)} class="text-orange underline" rel="external" target="_blank">
            View on Testudo
          </a>
        </div>

        {#if course.conditions != null && course.conditions.length > 0}
          <!-- Keyed by index: condition strings are not guaranteed unique,
               and a duplicate key is a fatal runtime error in Svelte 5. -->
          {#each course.conditions as condition, i (i)}
            <CourseCondition {condition} />
          {/each}
        {/if}

        {#if course.description != null}
          {course.description}
        {/if}
      </div>
    {/if}
  </div>
  <!-- Sections -->
  {#if course.sections != null && course.sections.length > 0}
    {#each course.sections as section (section.sectionCode)}
      <SectionListing courseCode={course.courseCode} {section} {course} {isDesktop} />
    {/each}
  {:else}
    <SectionListing courseCode={course.courseCode} section={pseudoSection()} {course} {isDesktop} />
  {/if}
</div>
