<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->

<script lang="ts">
    import { CurrentScheduleStore } from '../../../stores/CoursePlannerStores';
    import type { ScheduleBlock, ScheduleSelection, UserEvent } from '../../../types';
    import UserEventModal from './UserEventModal.svelte';

    let showCustomEventModal = false;

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
		event.colorNumber = 0;

		CurrentScheduleStore.set({
			scheduleName,
			selections: [...selectionsList, event]
		});

		// const updatedCurrentSelections = [...selections];
		// CurrentScheduleStore.update((current) => {
		// 	return {
		// 		scheduleName: current.scheduleName,
		// 		selections: [...current.selections, event]
		// 	};
		// });

		// CurrentScheduleStore.set({
		// 	scheduleName: scheduleName,
		// 	selections: updatedCurrentSelections
		// });

		// UserEventsStore.update((events) => [...events, event]);
	}
</script>


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