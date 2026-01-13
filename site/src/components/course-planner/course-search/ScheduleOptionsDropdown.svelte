<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
 <script lang="ts">
    import { Dropdown, DropdownItem } from 'flowbite-svelte';
    import {
        DotsVerticalOutline, 
        TrashBinOutline,
        FileCopyOutline,
    } from 'flowbite-svelte-icons';
    import {
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from '../../../stores/CoursePlannerStores';
    import {
        uniqueScheduleName
    } from '$lib/course-planner/ScheduleSelector';
    import type { ScheduleSelection, StoredSchedule } from '../../../types';

    let dropdownOpen = false;

    let currentScheduleName: string;
    let currentScheduleSelections: ScheduleSelection[];
    CurrentScheduleStore.subscribe((stored) => {
        currentScheduleName = stored.scheduleName,
        currentScheduleSelections = stored.selections
    });

    let nonselectedSchedules: StoredSchedule[];
    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    function deleteCurrentSchedule() {
        dropdownOpen = false;

        if (nonselectedSchedules.length > 0) {
            currentScheduleName = nonselectedSchedules[0].scheduleName;
            currentScheduleSelections = nonselectedSchedules[0].selections;
            nonselectedSchedules.splice(0, 1);

            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });

            NonselectedScheduleStore.set(nonselectedSchedules);
        } else {
            currentScheduleName = 'My schedule';
            currentScheduleSelections = [];

            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });
        }
    }

    function duplicateSchedule() {
        dropdownOpen = false;

        nonselectedSchedules = [{
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections
        }, ...nonselectedSchedules];
        currentScheduleName = uniqueScheduleName(
            currentScheduleName,
            'Copy of ',
            nonselectedSchedules
        );

        NonselectedScheduleStore.set(nonselectedSchedules);
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections
        });
    }
</script>

<button class='hover:bg-hoverLight dark:hover:bg-hoverDark rounded-md'
        title='Schedule options'>
    <DotsVerticalOutline class="w-5 h-5" />
</button>

<Dropdown class="bg-bgLight dark:bg-divBorderDark w-24 rounded-b-md"
            bind:open={dropdownOpen}>

    <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                    title='Delete current schedule'
                    on:click={deleteCurrentSchedule}>
        <TrashBinOutline class="w-3 h-3 mr-1 z-50" /> Delete
    </DropdownItem>

    <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                    title='Duplicate current schedule'
                    on:click={duplicateSchedule}>
        <FileCopyOutline class="w-3 h-3 mr-1 z-50" /> Duplicate
    </DropdownItem>

    <!-- TODO(@atcupps): Add share schedule feature -->
    <!-- <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                        flex justify-start items-center"
                    on:click={() => (dropdownOpen = false)}>
        <ForwardOutline class="w-3 h-3 mr-1" /> Share
    </DropdownItem> -->

</Dropdown>