<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import type { Instructor } from '@jupiterp/jupiterp';
	import { clickoutside } from '@svelte-put/clickoutside';
	import { ptLinkFromSlug } from '../../../lib/course-planner/Professors';
	import { CourseGradesStore } from '../../../stores/CoursePlannerStores';
	import { ProfsLookupStore } from '../../../stores/CoursePlannerStores';
	import { gpaTier, ptCourseLink } from '../../../lib/course-planner/Grades';
	import type { GpaTier } from '../../../lib/course-planner/Grades';
	import GradesPopover from './GradesPopover.svelte';

	export let instructor: string = 'No instructor';

	/**
	 * Course code used to look up this instructor's grade data in
	 * `CourseGradesStore`; without it, no GPA chip is shown.
	 */
	export let courseCode: string | undefined = undefined;

	let profs: Record<string, Instructor>;
	ProfsLookupStore.subscribe((lookup) => {
		profs = lookup;
	});

	// Convert rating to a percentage for CSS
	function convertRating(rating: string | null): number {
		if (rating == null) {
			throw Error('Rating was null in `convertRating`; this should never happen!');
		}
		return parseFloat(rating) * 20;
	}

	function handleLinkClick(event: MouseEvent) {
		// Prevent the event from propagating to the button
		event.stopPropagation();
	}

	export let profsHover: boolean;
	export let removeHoverSection: () => void;

	// Grade data for this instructor in this course, if loaded
	$: entry = courseCode != null ? $CourseGradesStore[courseCode] : undefined;
	$: profDist =
		entry !== undefined && entry.status === 'loaded'
			? (entry.grades.byProfessor[instructor] ?? null)
			: null;

	let gpaOpen: boolean = false;

	// Static tier -> class map; Tailwind requires literal class names
	const chipTierClasses: Record<GpaTier, string> = {
		good: [
			'border-gpaGoodLight text-gpaGoodLight',
			'dark:border-gpaGoodDark dark:text-gpaGoodDark'
		].join(' '),
		mid: [
			'border-gpaMidLight text-gpaMidLight',
			'dark:border-gpaMidDark dark:text-gpaMidDark'
		].join(' '),
		low: [
			'border-gpaLowLight text-gpaLowLight',
			'dark:border-gpaLowDark dark:text-gpaLowDark'
		].join(' ')
	};

	$: chipTitle =
		profDist != null && profDist.gpa != null
			? 'Avg. GPA ' +
				profDist.gpa.toFixed(2) +
				' for ' +
				instructor +
				(courseCode != null ? ' in ' + courseCode : '') +
				' (PlanetTerp)'
			: '';

	$: ptGpaLink =
		instructor in profs
			? ptLinkFromSlug(profs[instructor].slug)
			: courseCode != null
				? ptCourseLink(courseCode)
				: 'https://planetterp.com';

	function handleChipClick(event: MouseEvent) {
		event.stopPropagation();
		// Only ever open on click; closing is handled by mouseleave on
		// desktop and clickoutside on touch devices, so the mouseenter
		// that precedes a tap's click doesn't cancel it out.
		gpaOpen = true;
	}

	function handleChipKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			gpaOpen = !gpaOpen;
		}
	}
</script>

<div class="text-sm xl:text-base">
	{#if instructor in profs && profs[instructor].average_rating != null}
		<a
			href={ptLinkFromSlug(profs[instructor].slug)}
			target="_blank"
			class="inline-flex flex-wrap rounded-md
                            text-orange underline transition
                            hover:bg-hoverLight hover:dark:bg-hoverDark"
			on:mouseenter={() => {
				profsHover = true;
				removeHoverSection();
			}}
			on:mouseleave={() => {
				profsHover = false;
				removeHoverSection();
			}}
			on:click={handleLinkClick}
			title="View Instructor on PlanetTerp"
		>
			{instructor}
			<!-- format-check exempt 3 -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				fill="currentColor"
				class="mt-[0.25rem] h-3 w-3"
			>
				<path
					d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"
				/>
				<path
					d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"
				/>
			</svg>
		</a>
		<span
			style="--rating: {convertRating(profs[instructor].average_rating) + '%'}"
			class="stars align-[2px] text-[8px] font-bold text-orange xl:text-[10px] 2xl:text-base"
			title="{profs[instructor].average_rating} out of 5"
		>
			★★★★★
		</span>
	{:else}
		{instructor}
	{/if}
	{#if profDist != null && profDist.gpa != null}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<span
			class="relative inline-block"
			use:clickoutside
			on:clickoutside={() => (gpaOpen = false)}
			on:mouseenter={() => {
				profsHover = true;
				removeHoverSection();
				gpaOpen = true;
			}}
			on:mouseleave={() => {
				profsHover = false;
				removeHoverSection();
				gpaOpen = false;
			}}
		>
			<span
				role="button"
				tabindex="0"
				aria-expanded={gpaOpen}
				class="ml-1 cursor-pointer rounded-md border px-1 align-[2px]
                    text-[0.625rem] font-bold leading-tight 2xl:text-xs
                    {chipTierClasses[gpaTier(profDist.gpa)]}"
				title={chipTitle}
				on:click={handleChipClick}
				on:keydown={handleChipKeydown}
			>
				{profDist.gpa.toFixed(2)}
			</span>
			{#if gpaOpen}
				<!-- format-check exempt 1 8 -->
				<GradesPopover heading={instructor} distribution={profDist} ptLink={ptGpaLink} />
			{/if}
		</span>
	{/if}
</div>

<style>
	.stars {
		background: rgb(246, 116, 60);
		background: linear-gradient(
			90deg,
			rgba(246, 116, 60, 1) 0%,
			rgba(246, 116, 60, 1) var(--rating),
			rgba(115, 53, 26, 1) var(--rating),
			rgba(115, 53, 26, 1) 100%
		);

		/* Set the background size and repeat properties. */
		background-size: 100%;
		background-repeat: repeat;

		/* Use the text as a mask for the background. */
		/* This will show the gradient as a text color. */
		background-clip: text;
		-webkit-text-fill-color: transparent;
		-moz-background-clip: text;
		-moz-text-fill-color: transparent;
	}
</style>
