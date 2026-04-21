<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->

<script lang="ts">
    import { CurrentScheduleStore, EventEditStore } from '../../../stores/CoursePlannerStores';
    import type { ScheduleBlock, UserEvent } from '../../../types';
    import UserEventModal from './UserEventModal.svelte';
    import { firstAvailableColor } from '$lib/course-planner/ColorSelector';

    let showCustomEventModal = false;

    let innerWidth = 0;
    let wasWide = false;
    $: {
        const isWide = innerWidth >= 1024;
        if (wasWide && !isWide) showCustomEventModal = false;
        wasWide = isWide;
    }

    // get selections and user events from store
    let selectionsList: ScheduleBlock[];
	let scheduleName: string;
	CurrentScheduleStore.subscribe((stored) => {
		selectionsList = stored.selections;
		scheduleName = stored.scheduleName;
	});

    let eventEditVal: { eventId: string } | null;
	EventEditStore.subscribe((val) => {
		eventEditVal = val;
	});

    // function to add user event from UserEventModal
	function addUserEvent(event: UserEvent) {
		const existingIndex = selectionsList.findIndex(
			(s) => !('course' in s) && s.id === event.id
		);
		let updatedSelections: ScheduleBlock[];
		if (existingIndex !== -1) {
			// Edit: preserve color and replace in-place
			event.colorNumber = selectionsList[existingIndex].colorNumber;
			updatedSelections = [...selectionsList];
			updatedSelections[existingIndex] = event;
		} else {
			// New: assign next available color and append
			event.colorNumber = firstAvailableColor(selectionsList);
			updatedSelections = [...selectionsList, event];
		}
		CurrentScheduleStore.set({ scheduleName, selections: updatedSelections });
		showCustomEventModal = false;
		EventEditStore.set(null);
	}
</script>


<svelte:window bind:innerWidth />

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

{#if showCustomEventModal}
	<UserEventModal
		onClose={() => (showCustomEventModal = false)}
		onSubmit={(event) => addUserEvent(event)}
	/>
{/if}

{#if eventEditVal !== null}
	<UserEventModal
		onClose={() => EventEditStore.set(null)}
		onSubmit={(event) => addUserEvent(event)}
		initialEventData={(selectionsList.find((s) => !('course' in s) && s.id === eventEditVal?.eventId) as UserEvent) || null}
	/>
{/if}