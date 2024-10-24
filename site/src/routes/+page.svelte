<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang="ts">
    import Schedule from '../components/course-planner/schedule/Schedule.svelte';
    import CourseSearch from '../components/course-planner/course-search/CourseSearch.svelte';
    import { onMount } from 'svelte';
    import { retrieveCourses, updateStoredSchedules } from '../lib/course-planner/CourseLoad';
    import { getProfsLookup } from '$lib/course-planner/CourseSearch';
    import {
        SeatDataStore,
        ProfsLookupStore,
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from '../stores/CoursePlannerStores';

    // Load profs and course data from `+page.ts`
    export let data;

    // Function to retreive seats data; seats data is returned as a record
    // where the key is a string concatenation of "courseID-sectionID",
    // and the record value is [currentSeats, totalSeats, waitlist].
    // Called in `onMount`.
    async function fetchSeatData() {
        try {
            const response = await fetch('/seats');
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            const seatsDataMap = await response.json();
            
            // Update the SeatDataStore with the fetched data
            SeatDataStore.set(seatsDataMap);
        } catch (error) {
            console.error('Error fetching seat data:', error);
        }
    }

    // Create a professor lookup table
    ProfsLookupStore.set(getProfsLookup(data.professors));

    // Keep track of chosen sections
    let currentSchedule: StoredSchedule;
    let hasReadLocalStorage: boolean = false;
    CurrentScheduleStore.subscribe((stored) => {
        if (hasReadLocalStorage) {
            currentSchedule = stored;

            // Save to local storage
            if (currentSchedule) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('selectedSections', 
                                jsonifySections(currentSchedule.selections));
                    localStorage.setItem(
                        'scheduleName', currentSchedule.scheduleName
                    );
                }
            }
        }
    });

    let nonselectedSchedules: StoredSchedule[];
    // Save non-selected schedules to local storage
    NonselectedScheduleStore.subscribe((stored) => {
        if (hasReadLocalStorage) {
            nonselectedSchedules = stored;

            // Save to local storage
            if (nonselectedSchedules) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(
                        'nonselectedSchedules', 
                        JSON.stringify(nonselectedSchedules)
                    );
                }
            }
        }
    })

    onMount(() => {
        try {
            // Retreive data from client local storage
            if (typeof window !== 'undefined') {
                const storedSelectionsOption = 
                                localStorage.getItem('selectedSections');
                let storedSelections: ScheduleSelection[];
                if (storedSelectionsOption) {
                    storedSelections = retrieveCourses(
                        JSON.parse(storedSelectionsOption), data.departments
                    );
                } else {
                    storedSelections = [];
                }

                const storedScheduleNameOption = 
                                localStorage.getItem('scheduleName');
                let storedScheduleName: string;
                if (storedScheduleNameOption) {
                    storedScheduleName = storedScheduleNameOption;
                } else {
                    storedScheduleName = "Schedule 1";
                }

                const storedNonselectedSchedulesOption = 
                                localStorage.getItem('nonselectedSchedules');
                let storedNonselectedSchedules: StoredSchedule[];
                if (storedNonselectedSchedulesOption) {
                    storedNonselectedSchedules = updateStoredSchedules(
                        JSON.parse(storedNonselectedSchedulesOption),
                        data.departments
                    );
                } else {
                    storedNonselectedSchedules = [];
                }

                CurrentScheduleStore.set({
                    scheduleName: storedScheduleName,
                    selections: storedSelections
                });

                NonselectedScheduleStore.set(storedNonselectedSchedules);

                hasReadLocalStorage = true;
            }

            // Fetch seat data from API
            fetchSeatData();
        } catch (e) {
            console.log('Unable to retrieve courses: ' + e);
            CurrentScheduleStore.set({
                scheduleName: "Schedule 1",
                selections: []
            });
            NonselectedScheduleStore.set([]);
        }
    });

    function jsonifySections(sections: ScheduleSelection[]): string {
        let finalSelections: ScheduleSelection[] = [];
        for (let section of sections) {
            if (!section.hover) {
                finalSelections.push(section);
            }
        }
        return JSON.stringify(finalSelections);
    }

    let courseSearchSelected: boolean = false;
</script>

<!-- Button to toggle course search on mobile -->
<button class='fixed h-5 w-5 top-[0.9rem] left-5 visible lg:hidden z-[52]'
        on:click={() => {courseSearchSelected = !courseSearchSelected}}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
            class='visible h-full w-full transition 
                    fill-textLight dark:fill-textDark'
            class:hidden={courseSearchSelected}>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"
            class='visible h-full w-full transition 
                    fill-textLight dark:fill-textDark'
            class:hidden={!courseSearchSelected}>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
</button>

<div class='fixed flex flex-row w-full px-8
            text-textLight dark:text-textDark lg:px-8
            top-[3rem] lg:top-[3.5rem] xl:top-[4rem] bottom-0'>
    <CourseSearch data={data} bind:courseSearchSelected />
    <Schedule />
</div>