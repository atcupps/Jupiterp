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
		PlusOutline,
		LinkOutline,
		ClipboardCheckOutline
	} from 'flowbite-svelte-icons';
	import {
		AddCustomEventStore,
		CurrentScheduleStore,
		NonselectedScheduleStore
	} from '../../../stores/CoursePlannerStores';
	import { uniqueScheduleName } from '$lib/course-planner/ScheduleSelector';
	import { encodeSchedule, SHARE_PARAM } from '$lib/course-planner/ShareLink';
	import { base } from '$app/paths';
	import type { ScheduleBlock, StoredSchedule } from '../../../types';

	let dropdownOpen = false;
	let linkCopied = false;
	let linkError = false;

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

		nonselectedSchedules = [
			{
				scheduleName: currentScheduleName,
				selections: currentScheduleSelections
			},
			...nonselectedSchedules
		];
		currentScheduleName = uniqueScheduleName(currentScheduleName, 'Copy of ', nonselectedSchedules);

		NonselectedScheduleStore.set(nonselectedSchedules);
		CurrentScheduleStore.set({
			scheduleName: currentScheduleName,
			selections: currentScheduleSelections
		});
	}

	function addCustomEvent() {
		dropdownOpen = false;
		AddCustomEventStore.set(true);
	}

	/**
	 * Copy `text` to the clipboard, returning whether it succeeded. Prefers the
	 * async Clipboard API (HTTPS / modern browsers) and falls back to a hidden
	 * textarea + `execCommand('copy')` for insecure contexts and older mobile
	 * browsers where `navigator.clipboard` is unavailable.
	 */
	async function copyToClipboard(text: string): Promise<boolean> {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				// Fall through to the legacy path.
			}
		}

		try {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.setAttribute('readonly', '');
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			const ok = document.execCommand('copy');
			document.body.removeChild(textarea);
			return ok;
		} catch {
			return false;
		}
	}

	async function copyShareLink() {
		const token = encodeSchedule(currentScheduleSelections);
		if (!token) {
			// No course sections to share.
			return;
		}

		const url = `${window.location.origin}${base}/?${SHARE_PARAM}=${token}`;
		const copied = await copyToClipboard(url);
		if (copied) {
			linkError = false;
			linkCopied = true;
			setTimeout(() => {
				linkCopied = false;
				dropdownOpen = false;
			}, 1200);
		} else {
			linkCopied = false;
			linkError = true;
			console.error('Failed to copy share link to clipboard.');
			setTimeout(() => {
				linkError = false;
			}, 1800);
		}
	}
</script>

<button
	class="rounded-md px-0.5 hover:bg-hoverLight dark:hover:bg-hoverDark"
	title="Schedule options"
>
	<DotsVerticalOutline class="h-5 w-5" />
</button>

<Dropdown class="w-24 rounded-md bg-bgLight dark:bg-divBorderDark" bind:open={dropdownOpen}>
	<DropdownItem
		class="flex items-center justify-start px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Add custom event to schedule"
		on:click={addCustomEvent}
	>
		<PlusOutline class="z-50 mr-1 h-3 w-3" /> Add Event
	</DropdownItem>

	<DropdownItem
		class="flex items-center justify-start
                            px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Delete current schedule"
		on:click={deleteCurrentSchedule}
	>
		<TrashBinOutline class="z-50 mr-1 h-3 w-3" /> Delete
	</DropdownItem>

	<DropdownItem
		class="flex items-center justify-start
                            px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Duplicate current schedule"
		on:click={duplicateSchedule}
	>
		<FileCopyOutline class="z-50 mr-1 h-3 w-3" /> Duplicate
	</DropdownItem>

	<DropdownItem
		class="flex items-center justify-start
                            px-2 hover:bg-hoverLight dark:hover:bg-hoverDark"
		title="Copy a shareable link to this schedule"
		on:click={copyShareLink}
	>
		{#if linkCopied}
			<ClipboardCheckOutline class="z-50 mr-1 h-3 w-3" /> Copied!
		{:else if linkError}
			<LinkOutline class="z-50 mr-1 h-3 w-3" /> Copy failed
		{:else}
			<LinkOutline class="z-50 mr-1 h-3 w-3" /> Copy Link
		{/if}
	</DropdownItem>
</Dropdown>
