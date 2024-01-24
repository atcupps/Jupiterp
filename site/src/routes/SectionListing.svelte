<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import InstructorListing from "./InstructorListing.svelte";
    import MeetingListing from "./MeetingListing.svelte";

    export let courseCode: string;
    export let section: Section;
    export let profs: Record<string, Professor>;
    export let selectionsList: ScheduleSelection[] = [];

    let newSelection: ScheduleSelection = {
        courseCode,
        section,
        differences: []
    };
    let sectionAdded: boolean = 
        selectionsList.some(obj => selectionEquals(obj));

    // In order for Svelte's reactivity to work properly, `selectionsList`
    // needs to be reassigned instead of using `.push` or `.splice`.
    function addSectionToSchedule() {
        if (!sectionAdded) {
            selectionsList = [...selectionsList, newSelection];
        } else {
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
    }

    function selectionEquals(s: ScheduleSelection): boolean {
        return s.courseCode === courseCode && 
            s.section.sec_code === section.sec_code;
    }
</script>

<button on:click={addSectionToSchedule}
            class='flex flex-row w-full text-left
                border-t-2 border-outlineLight dark:border-outlineDark
                hover:bg-hoverLight hover:dark:bg-hoverDark transition
                {sectionAdded ? 'bg-hoverLight dark:bg-hoverDark' : ''}'>
    <!-- Section code -->
    <div class='text-secCodesLight dark:text-secCodesDark font-semibold 
                text-sm xl:text-base w-12 xl:w-14'>
        {section.sec_code}
    </div>

    <!-- Section info -->
    <div class='w-full'>
        <!-- Instructors -->
        {#each section.instructors as instructor}
            <InstructorListing instructor={instructor} profs={profs} />
        {/each}
        
        <!-- Class meetings -->
        {#each section.class_meetings as meeting}
            <MeetingListing meeting={meeting} />
        {/each}
    </div>
</button>