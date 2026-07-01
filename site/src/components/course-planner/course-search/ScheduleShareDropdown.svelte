<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import {
		CalendarMonthOutline,
		ClipboardCheckOutline,
		ForwardOutline,
		LinkOutline
	} from 'flowbite-svelte-icons';

	let dropdownOpen = false;

	export let calendarExportFunction;
	export let copyShareLinkFunction;
	export let linkCopied: boolean;
</script>

<button
	class="h-7 rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark"
	title="Share or export schedule"
>
	<ForwardOutline class="h-5 w-5 px-0.5" />
</button>

<Dropdown class="w-32 rounded-md bg-bgLight dark:bg-divBorderDark" bind:open={dropdownOpen}>
	<DropdownItem
		class="flex items-center justify-start px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Download an .ics file to export to a calendar app"
		on:click={calendarExportFunction}
	>
		<CalendarMonthOutline class="z-50 mr-1 h-3 w-3" /> Download .ics
	</DropdownItem>

	<DropdownItem
		class="flex items-center justify-start px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Create a shareable link"
		on:click={copyShareLinkFunction}
	>
		{#if !linkCopied}
			<LinkOutline class="z-50 mr-1 h-3 w-3" /> Copy Link
		{:else}
			<ClipboardCheckOutline class="z-50 mr-1 h-3 w-3" /> Link Copied
		{/if}
	</DropdownItem>
</Dropdown>
