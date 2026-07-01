<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';

	let dropdownOpen = false;

	export let newScheduleFunction;
	export let newCustomEventFunction;
</script>

<button
	class="h-7 rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark"
	title="New schedule or event"
>
	<PlusOutline class="h-5 w-5 px-0.5" />
</button>

<Dropdown class="w-32 rounded-md bg-bgLight dark:bg-divBorderDark" bind:open={dropdownOpen}>
	<DropdownItem
		class="flex items-center justify-start px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Create a new schedule"
		on:click={newScheduleFunction}
	>
		New Schedule
	</DropdownItem>

	<DropdownItem
		class="flex items-center justify-start px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Add custom event to schedule"
		on:click={newCustomEventFunction}
	>
		Add Custom Event
	</DropdownItem>
</Dropdown>
