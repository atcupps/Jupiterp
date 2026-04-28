<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import type { UserEvent } from '../../../types';

	export let onClose: () => void;
	export let onSubmit: (event: UserEvent) => void;
	export let initialEventData: UserEvent | null = null;

	const DAYS = ['M', 'Tu', 'W', 'Th', 'F'];

	let name = '';
	let selectedDays: string[] = [];
	let startTime = '';
	let endTime = '';
	let location = '';
	let notes = '';
	let errors: string[] = [];

	if (initialEventData) {
		name = initialEventData.name;
		selectedDays = initialEventData.days;
		startTime = decimalToTimeString(initialEventData.startTime);
		endTime = decimalToTimeString(initialEventData.endTime);
		location = initialEventData.location;
		notes = initialEventData.notes;
	}

	function timeStringToDecimal(timeStr: string): number {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return hours + minutes / 60;
	}

	function decimalToTimeString(decimal: number): string {
		const hours = Math.floor(decimal);
		const minutes = Math.round((decimal - hours) * 60);
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
	}

	function toggleDay(day: string) {
		if (selectedDays.includes(day)) {
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays = [...selectedDays, day];
		}
	}

	function expandDayString(day: string): string {
		switch (day) {
			case 'M':
				return 'Monday';
			case 'Tu':
				return 'Tuesday';
			case 'W':
				return 'Wednesday';
			case 'Th':
				return 'Thursday';
			case 'F':
				return 'Friday';
			default:
				return day;
		}
	}

	function handleSubmit() {
		errors = [];
		if (!name.trim()) errors.push('Name is required');
		if (selectedDays.length === 0) errors.push('Select at least one day');
		if (!startTime) errors.push('Start time is required');
		if (!endTime) errors.push('End time is required');
		if (startTime && endTime && timeStringToDecimal(startTime) >= timeStringToDecimal(endTime)) {
			errors.push('End time must be after start time');
		}
		if (errors.length > 0) return;

		const event: UserEvent = {
			id: initialEventData ? initialEventData.id : Date.now().toString(),
			name: name.trim(),
			days: selectedDays,
			startTime: timeStringToDecimal(startTime),
			endTime: timeStringToDecimal(endTime),
			location,
			notes,
			colorNumber: 0
		};

		onSubmit(event);
		onClose();
	}
</script>

<!-- Backdrop -->
<button class="fixed inset-0 z-[50] mt-12 bg-black bg-opacity-40" on:click|stopPropagation={onClose} />

<!-- Modal -->
<div
	class="fixed left-1/2 top-1/2 z-[60] w-[400px] max-w-[90vw]
			-translate-x-1/2 -translate-y-1/2 rounded-lg border
			border-outlineLight bg-bgLight p-4 shadow-xl
			dark:border-outlineDark dark:bg-bgDark"
>
	<h2 class="mb-3 text-base font-semibold">
		{initialEventData ? 'Edit Event' : 'Add Custom Event'}
	</h2>

	<!-- Name -->
	<div class="mb-2">
		<label class="mb-0.5 block text-sm" for="user-event-name">Name</label>
		<input
			id="user-event-name"
			type="text"
			bind:value={name}
			placeholder="Event name"
			class="w-full rounded-lg border border-solid border-outlineLight
					bg-transparent px-2 py-1 text-sm dark:border-outlineDark"
		/>
	</div>

	<!-- Days -->
	<div class="mb-2">
		<p class="mb-0.5 text-sm">Days</p>
		<div class="flex gap-1.5">
			{#each DAYS as day}
				<button
					type="button"
					title={expandDayString(day)}
					class="rounded border px-2.5 py-1 text-sm transition-colors
							{selectedDays.includes(day)
						? 'border-outlineLight bg-outlineLight text-black dark:border-outlineDark dark:bg-outlineDark dark:text-textDark'
						: 'border-outlineLight hover:bg-hoverLight dark:border-outlineDark dark:hover:bg-hoverDark'}"
					on:click={() => toggleDay(day)}
				>
					{day}
				</button>
			{/each}
		</div>
	</div>

	<!-- Start / End time -->
	<div class="mb-2 flex gap-2">
		<div class="flex-1">
			<label class="mb-0.5 block text-sm" for="user-event-start">Start</label>
			<input
				id="user-event-start"
				type="time"
				bind:value={startTime}
				class="w-full rounded-lg border border-solid border-outlineLight
						bg-transparent px-2 py-1 text-sm dark:border-outlineDark dark:[color-scheme:dark]"
			/>
		</div>
		<div class="flex-1">
			<label class="mb-0.5 block text-sm" for="user-event-end">End</label>
			<input
				id="user-event-end"
				type="time"
				bind:value={endTime}
				class="w-full rounded-lg border border-solid border-outlineLight
						bg-transparent px-2 py-1 text-sm dark:border-outlineDark dark:[color-scheme:dark]"
			/>
		</div>
	</div>

	<!-- Location -->
	<div class="mb-2">
		<label class="mb-0.5 block text-sm" for="user-event-location">Location</label>
		<input
			id="user-event-location"
			type="text"
			bind:value={location}
			placeholder="Optional"
			class="w-full rounded-lg border border-solid border-outlineLight
					bg-transparent px-2 py-1 text-sm dark:border-outlineDark"
		/>
	</div>

	<!-- Notes -->
	<div class="mb-3">
		<label class="mb-0.5 block text-sm" for="user-event-notes">Notes</label>
		<textarea
			id="user-event-notes"
			bind:value={notes}
			placeholder="Optional"
			rows="2"
			class="w-full rounded-lg border border-solid border-outlineLight
					bg-transparent px-2 py-1 text-sm dark:border-outlineDark"
		/>
	</div>

	<!-- Validation errors -->
	{#if errors.length > 0}
		<div class="mb-2 text-xs" style="color: #ef4444;">
			{#each errors as error}
				<div>{error}</div>
			{/each}
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-end gap-2">
		<button
			type="button"
			on:click={onClose}
			class="rounded px-3 py-1.5 text-sm hover:bg-hoverLight dark:hover:bg-hoverDark"
		>
			Cancel
		</button>
		<button
			type="button"
			on:click={handleSubmit}
			class="rounded bg-outlineLight px-3 py-1.5 text-sm text-black hover:bg-hoverLight dark:bg-outlineDark dark:text-textDark dark:hover:bg-hoverDark"
		>
			{initialEventData ? 'Save Event' : 'Add Event'}
		</button>
	</div>
</div>
