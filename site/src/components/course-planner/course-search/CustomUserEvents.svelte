<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->

<script lang="ts">
    import { CurrentScheduleStore } from '../../../stores/CoursePlannerStores';
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


    // function to add user event from UserEventModal
	function addUserEvent(event: UserEvent) {
		// firstAvailableColor() thing
		// const usedColors = [
		// 	...selectionsList.map((s) => s.colorNumber),
		// 	...userEvents.map((e) => e.colorNumber)
		// ].sort((a, b) => a - b);
		// let color = 0;
		// for (const c of usedColors) {
		// 	if (c === color) color++;
		// 	else break;
		// }
		// event.colorNumber = 0;
        event.colorNumber = firstAvailableColor(selectionsList);

		CurrentScheduleStore.set({
			scheduleName,
			selections: [...selectionsList, event]
		});
        showCustomEventModal = false;

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