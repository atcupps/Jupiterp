<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { getColorFromNumber } from '../../../lib/course-planner/ClassMeetingUtils';
	import { UserEventsStore } from '../../../stores/CoursePlannerStores';
	import { afterUpdate } from 'svelte';
	import type { UserEvent } from '../../../types';

	export let event: UserEvent;
	export let earliestClassStart: number;
	export let latestClassEnd: number;
	$: boundDiff = latestClassEnd - earliestClassStart;

	function formatTime(decimal: number): string {
		const hours = Math.floor(decimal);
		const minutes = Math.round((decimal - hours) * 60);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
		return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	function removeEvent() {
		UserEventsStore.update((events) => events.filter((e) => e.id !== event.id));
	}

	let elt: HTMLButtonElement;
	let innerHeight: number;
	let innerWidth: number;
	let h: number;
	let w: number;
	$: if (elt || innerHeight || innerWidth) {
		afterUpdate(() => {
			w = elt.offsetWidth;
			h = elt.offsetHeight;
		});
	}

	let fontSize: number;
	$: if (document.documentElement) {
		fontSize = parseInt(getComputedStyle(document.documentElement).fontSize.substring(0, 2)) / 16;
	}
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<button
	class="absolute flex w-full flex-col justify-center rounded-lg pb-1 text-black"
	bind:this={elt}
	style="top: {((event.startTime - earliestClassStart) / boundDiff) * 100}%;
		   height: {((event.endTime - event.startTime) / boundDiff) * 100}%;
		   background-color: {getColorFromNumber(event.colorNumber)};"
>
	<!-- Remove button -->
	<button
		class="absolute right-0 top-0 h-4 w-4 justify-center 2xl:right-1 2xl:top-1"
		on:click|stopPropagation={removeEvent}
		title="Remove event"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 384 512"
			class="absolute left-[50%] top-[50%] h-2 w-2 2xl:h-3 2xl:w-3"
			style="transform: translateX(-50%) translateY(-50%);"
		>
			<!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com/license/free-->
			<path
				d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"
			/>
		</svg>
	</button>

	{#if w >= 72}
		{#if h > 1.5 * fontSize}
			<div
				class="translucentGray flex min-h-[1.5rem] w-full items-center
						justify-center truncate rounded-t-lg font-sans text-base font-semibold"
				class:text-sm={w < 120}
				class:text-xs={w < 104}
			>
				{event.name}
			</div>
		{/if}
		<div class="w-full grow px-2 font-sans text-xs font-thin 2xl:font-normal">
			{#if h - 24 * fontSize > 48 * fontSize}
				<div class="truncate">{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
			{/if}
			{#if h - 24 * fontSize > 32 * fontSize && event.location}
				<div class="truncate">{event.location}</div>
			{/if}
		</div>
	{:else}
		<div class="w-full text-wrap break-words rounded-t-lg font-sans text-base font-semibold">
			{event.name}
		</div>
	{/if}
</button>

<style>
	.translucentGray {
		background-color: rgba(0, 0, 0, 0.07);
	}
</style>
