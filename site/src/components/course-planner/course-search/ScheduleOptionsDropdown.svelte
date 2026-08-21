<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
  import { Dropdown, DropdownItem } from 'flowbite-svelte';
  import { DotsVerticalOutline, TrashBinOutline, FileCopyOutline, PlusOutline } from 'flowbite-svelte-icons';
  import {
    AddCustomEventStore,
    CurrentScheduleStore,
    NonselectedScheduleStore,
  } from '../../../stores/CoursePlannerStores';
  import { uniqueScheduleName } from '$lib/course-planner/ScheduleSelector';
  import type { ScheduleBlock, StoredSchedule } from '../../../types';

  let dropdownOpen = $state(false);

  let currentScheduleName: string;
  let currentScheduleSelections: ScheduleBlock[];
  CurrentScheduleStore.subscribe((stored) => {
    currentScheduleName = stored.scheduleName;
    currentScheduleSelections = stored.selections;
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
        selections: currentScheduleSelections,
      });

      NonselectedScheduleStore.set(nonselectedSchedules);
    } else {
      currentScheduleName = 'My schedule';
      currentScheduleSelections = [];

      CurrentScheduleStore.set({
        scheduleName: currentScheduleName,
        selections: currentScheduleSelections,
      });
    }
  }

  function duplicateSchedule() {
    dropdownOpen = false;

    nonselectedSchedules = [
      {
        scheduleName: currentScheduleName,
        selections: currentScheduleSelections,
      },
      ...nonselectedSchedules,
    ];
    currentScheduleName = uniqueScheduleName(currentScheduleName, 'Copy of ', nonselectedSchedules);

    NonselectedScheduleStore.set(nonselectedSchedules);
    CurrentScheduleStore.set({
      scheduleName: currentScheduleName,
      selections: currentScheduleSelections,
    });
  }

  function addCustomEvent() {
    dropdownOpen = false;
    AddCustomEventStore.set(true);
  }
</script>

<button class="hover:bg-hover rounded-md px-0.5" title="Schedule options">
  <DotsVerticalOutline class="h-5 w-5" />
</button>

<!-- TEMP FIX: Added "-translate-y-2" to fix dropdown positioning -->
<Dropdown class="bg-border text-text-primary w-24 -translate-y-2 gap-0 rounded-md" bind:isOpen={dropdownOpen}>
  <DropdownItem
    class="hover:bg-hover flex items-center justify-start p-2"
    title="Add custom event to schedule"
    onclick={addCustomEvent}
  >
    <PlusOutline class="z-50 mr-1 h-3 w-3" /> Add Event
  </DropdownItem>
  <DropdownItem
    class="hover:bg-hover flex items-center justify-start p-2"
    title="Delete current schedule"
    onclick={deleteCurrentSchedule}
  >
    <TrashBinOutline class="z-50 mr-1 h-3 w-3" /> Delete
  </DropdownItem>
  <DropdownItem
    class="hover:bg-hover flex items-center justify-start p-2"
    title="Duplicate current schedule"
    onclick={duplicateSchedule}
  >
    <FileCopyOutline class="z-50 mr-1 h-3 w-3" /> Duplicate
  </DropdownItem>
</Dropdown>
