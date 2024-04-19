<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang="ts">
    import InstructorListing from "./InstructorListing.svelte";
    import MeetingListing from "./MeetingListing.svelte";

    export let courseCode: string;
    export let section: Section;
    export let profs: Record<string, Professor>;
    export let hoveredSection: ScheduleSelection | null;
    export let selectionsList: ScheduleSelection[] = [];
    export let minCredits: number;
    export let course: Course;

    let newSelection: ScheduleSelection = {
        courseCode,
        section,
        hover: false,
        differences: [],
        credits: minCredits,
        course,
        colorNumber: -1,
    };
    let sectionAdded: boolean;
    $: if (selectionsList || hoveredSection) {
        sectionAdded = selectionsList.some(obj => selectionEquals(obj));
    }
    
    let hoverSection: ScheduleSelection = {
        courseCode,
        section,
        hover: true,
        differences: [],
        credits: minCredits,
        course,
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
        }, 300);  // Delay before fade starts
    }

    function showRemoveAlert() {
        removeAlertVisible = true;
        removeAlertShouldFade = false;
        setTimeout(() => {
            removeAlertShouldFade = true;
        }, 300);
    }

    // In order for Svelte's reactivity to work properly, `selectionsList`
    // needs to be reassigned instead of using `.push` or `.splice`.
    function addSectionToSchedule() {
        if (!sectionAdded) {
            showAddAlert();
            removeHoverSection();
            newSelection.colorNumber = firstAvailableColor(selectionsList);
            selectionsList = [...selectionsList, newSelection];
        } else {
            showRemoveAlert();
            const index = selectionsList.findIndex(obj => 
                        selectionEquals(obj));
            if (index !== -1) {
                selectionsList = [
                    ...selectionsList.slice(0, index),
                    ...selectionsList.slice(index + 1)
                ];
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
            hoveredSection = hoverSection;
        }
    }

    function removeHoverSection() {
        hoveredSection = null;
    }

    function selectionEquals(s: ScheduleSelection): boolean {
        return s.courseCode === courseCode && 
            s.section.sec_code === section.sec_code && !s.hover;
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

    let isDesktop: boolean = true;
    let innerWidth: number;
    $: if (innerWidth) {
        isDesktop = innerWidth >= 1024;
    }

    const alertClasses: string = `  fixed left-[50%] translate-x-[-50%] z-5
                                    bg-black w-[40%] bottom-[10%] min-w-72
                                    h-8 text-center text-white lg:hidden
                                    rounded-lg`;
</script>

<svelte:window bind:innerWidth />

<!-- Ignoring a11y for mouseover because it's a non-essential feature -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button on:click={addSectionToSchedule}
        on:mouseover={isDesktop ? addHoverSection : null}
        on:mouseout={isDesktop ? removeHoverSection : null}
            class='flex flex-row w-full text-left border-t-2
                    border-outlineLight dark:border-outlineDark transition
                {sectionAdded ? 'bg-hoverLight dark:bg-hoverDark' : ''}'
            class:lg:hover:bg-hoverLight={!profsHover}
            class:lg:hover:dark:bg-hoverDark={!profsHover}
        title='Add course to schedule'
                >
    <!-- Section code -->
    <div class='text-secCodesLight dark:text-secCodesDark font-semibold 
                text-sm xl:text-base w-12 xl:w-14'>
        {section.sec_code}
    </div>

    <!-- Section info -->
    <div class='w-full'>
        <!-- Instructors -->
        {#each section.instructors as instructor}
            <InstructorListing {instructor} {profs} 
                                bind:profsHover {removeHoverSection}/>
        {/each}
        
        <!-- Class meetings -->
        {#each section.class_meetings as meeting}
            <MeetingListing meeting={meeting} />
        {/each}
    </div>
</button>

{#if addAlertVisible}
    <div class={(addAlertShouldFade ? 'animate-fadeOut' : '') + alertClasses}>
        <span class="font-medium h-full align-middle">Class Added</span>
    </div>
{/if}

{#if removeAlertVisible}
    <div class={(removeAlertShouldFade ? 'animate-fadeOut' : '') + alertClasses}>
        <span class="font-medium h-full align-middle">Class Removed</span>
    </div>
{/if}

