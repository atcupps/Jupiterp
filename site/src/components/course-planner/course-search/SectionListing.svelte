<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang="ts">
    import InstructorListing from "./InstructorListing.svelte";
    import MeetingListing from "./MeetingListing.svelte";
    import { 
        HoveredSectionStore,
        CurrentScheduleStore
    } from "../../../stores/CoursePlannerStores";
    import SeatData from "./SeatData.svelte";
    import type { Section, CourseBasic } from "@jupiterp/jupiterp";
    import type { ScheduleSelection } from "../../../types";

    export let courseCode: string;
    export let section: Section;
    export let course: CourseBasic;

    let hoveredSection: ScheduleSelection | null;
    HoveredSectionStore.subscribe((store) => { hoveredSection = store });

    let selectionsList: ScheduleSelection[];
    let scheduleName: string;
    CurrentScheduleStore.subscribe((stored) => {
        selectionsList = stored.selections;
        scheduleName = stored.scheduleName;
    });

    let newSelection: ScheduleSelection = {
        course,
        section,
        hover: false,
        differences: [],
        colorNumber: -1,
    }
    let sectionAdded: boolean;
    $: if (selectionsList || hoveredSection) {
        sectionAdded = selectionsList.some(obj => selectionEquals(obj));
    }
    
    let hoverSection: ScheduleSelection = {
        course,
        section,
        hover: true,
        differences: [],
        colorNumber: -1,
    }

    let addAlertVisible: boolean = false;
    let addAlertShouldFade: boolean = false;
    let removeAlertVisible: boolean = false;
    let removeAlertShouldFade: boolean = false;

    // Function to show or fade 
    function showAddAlert() {
        addAlertVisible = true;    // Make the div visible
        addAlertShouldFade = false; // Reset fading in case it's a subsequent click
        setTimeout(() => {
            addAlertShouldFade = true; // Start fading after 10 seconds
            setTimeout(() => {
                addAlertVisible = false;
            }, 750); // Delay to make `addAlertVisible` false after fading
        }, 300);  // Delay before fade starts
    }

    function showRemoveAlert() {
        removeAlertVisible = true;
        removeAlertShouldFade = false;
        setTimeout(() => {
            removeAlertShouldFade = true;
            setTimeout(() => {
                removeAlertVisible = false;
            }, 750); // Delay to make `removeAlertVisible` false after fading
        }, 300);
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
                selections: [...selectionsList, newSelection]
            });
        } else {
            showRemoveAlert();
            const index = selectionsList.findIndex(obj => 
                        selectionEquals(obj));
            if (index !== -1) {
                CurrentScheduleStore.set({
                    scheduleName,
                    selections: [
                        ...selectionsList.slice(0, index),
                        ...selectionsList.slice(index + 1)
                    ]
                });
            }
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

    function selectionEquals(s: ScheduleSelection): boolean {
        return s.course.courseCode === courseCode && 
            s.section.sectionCode === section.sectionCode && !s.hover;
    }

    function firstAvailableColor(selections: ScheduleSelection[]): number {
        let unavailableColors: number[] = [];
        selections.forEach((selection) => {
            unavailableColors.push(selection.colorNumber);
        });
        unavailableColors.sort((a, b) => a - b);
        let result: number = 0;
        while (result < unavailableColors.length && 
                    unavailableColors[result] === result) {
            result += 1;
        }
        return result;
    }

    let profsHover: boolean = false;
    let locationHover: boolean = false;

    let isDesktop: boolean = true;
    let innerWidth: number;
    $: if (innerWidth) {
        isDesktop = innerWidth >= 1024;
    }

    const alertClasses: string = `  fixed left-[50%] translate-x-[-50%] z-5
                                    w-[40%] top-[10%] min-w-72 h-8 rounded-lg
                                    text-center text-white lg:hidden 
                                    bg-orange shadow-lg content-center`;
</script>

<svelte:window bind:innerWidth />

<!-- Ignoring a11y for mouseover because it's a non-essential feature -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button on:click={addSectionToSchedule}
        on:mouseover={isDesktop ? addHoverSection : null}
        on:mouseout={isDesktop ? removeHoverSection : null}
        on:focusin={isDesktop ? addHoverSection : null}
        on:focusout={isDesktop ? removeHoverSection : null}
            class='flex flex-row w-full text-left border-t-2 pb-1
                    border-outlineLight dark:border-outlineDark transition
                {sectionAdded ? 'bg-hoverLight dark:bg-hoverDark' : ''}'
            class:lg:hover:bg-hoverLight={!profsHover && !locationHover}
            class:lg:hover:dark:bg-hoverDark={!profsHover && !locationHover}
        title='{ sectionAdded ? 'Remove course from' : 'Add course to'} schedule'
                >
    <!-- Section code -->
    <div class='text-secCodesLight dark:text-secCodesDark font-semibold 
                text-sm xl:text-base w-12 xl:w-14'>
        {section.sectionCode}
    </div>

    <!-- Section info -->
    <div class='w-full'>
        <!-- Instructors -->
        {#each section.instructors as instructor}
            <InstructorListing {instructor} 
                                bind:profsHover {removeHoverSection}/>
        {/each}

        <!-- Seats info -->
        <SeatData section={section} />
        
        <!-- Class meetings -->
        {#each section.meetings as meeting}
            <MeetingListing meeting={meeting} 
                bind:locationHover {removeHoverSection} />
        {/each}
    </div>
</button>

{#if addAlertVisible}
    <div class={(addAlertShouldFade ? 'animate-fadeOut' : '') + 
                    alertClasses}>
        <span class="font-medium h-full align-middle">Class Added</span>
    </div>
{/if}

{#if removeAlertVisible}
    <div class={(removeAlertShouldFade ? 'animate-fadeOut' : '') + 
                    alertClasses}>
        <span class="font-medium h-full align-middle">Class Removed</span>
    </div>
{/if}