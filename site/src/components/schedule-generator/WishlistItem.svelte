<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { CloseOutline } from 'flowbite-svelte-icons';
	import { splitCourseCode } from '../../lib/course-planner/Formatting';
	import { GeneratorRequirementsStore } from '../../stores/GeneratorStores';
	import type { GeneratorRequirement } from '../../stores/GeneratorStores';

	export let requirement: GeneratorRequirement;
	export let index: number;

	$: sections = requirement.course.sections ?? [];
	$: instructors = Array.from(new Set(sections.flatMap((s) => s.instructors))).sort();
	$: pinMode = requirement.pin.kind;

	function patch(next: Partial<GeneratorRequirement>) {
		GeneratorRequirementsStore.update((reqs) =>
			reqs.map((r, i) => (i === index ? { ...r, ...next } : r))
		);
	}

	function remove() {
		GeneratorRequirementsStore.update((reqs) => reqs.filter((_, i) => i !== index));
	}

	function setPinMode(mode: string) {
		if (mode === 'bySection') {
			const first = sections[0]?.sectionCode ?? '';
			patch({ pin: { kind: 'bySection', sectionCode: first } });
		} else if (mode === 'byInstructor') {
			patch({ pin: { kind: 'byInstructor', name: instructors[0] ?? '' } });
		} else {
			patch({ pin: { kind: 'none' } });
		}
	}
</script>

<div
	class="flex flex-col gap-1 rounded-lg border border-divBorderLight
		bg-bgSecondaryLight px-2 py-1.5 dark:border-divBorderDark
		dark:bg-bgSecondaryDark"
>
	<div class="flex flex-row items-center gap-2">
		<div class="flex grow flex-col overflow-hidden">
			<span class="truncate text-sm font-bold">
				{splitCourseCode(requirement.course.courseCode)}
			</span>
			<span class="truncate text-xs opacity-70">
				{requirement.course.name}
			</span>
		</div>

		<!-- Required / Optional toggle -->
		<div
			class="flex flex-row overflow-hidden rounded-md border
				border-outlineLight text-xs dark:border-outlineDark"
		>
			<button
				class="px-2 py-0.5"
				class:bg-orange={requirement.required}
				class:text-white={requirement.required}
				on:click={() => patch({ required: true })}
				title="This course must be in every schedule"
			>
				Required
			</button>
			<button
				class="px-2 py-0.5"
				class:bg-orange={!requirement.required}
				class:text-white={!requirement.required}
				on:click={() => patch({ required: false })}
				title="Include this course only when it fits"
			>
				Optional
			</button>
		</div>

		<button
			class="shrink-0 hover:text-orange"
			on:click={remove}
			title="Remove course from the generator"
		>
			<CloseOutline class="h-4 w-4" />
		</button>
	</div>

	<!-- Pin control -->
	<div class="flex flex-row items-center gap-2 text-xs">
		<span class="opacity-70">Pin:</span>
		<select
			class="rounded-md border border-outlineLight bg-bgLight px-1
				py-0.5 dark:border-outlineDark dark:bg-bgDark"
			value={pinMode}
			on:change={(e) => setPinMode(e.currentTarget.value)}
		>
			<option value="none">Any section</option>
			<option value="bySection">A section</option>
			<option value="byInstructor">A professor</option>
		</select>

		{#if requirement.pin.kind === 'bySection'}
			<select
				class="grow rounded-md border border-outlineLight bg-bgLight
					px-1 py-0.5 dark:border-outlineDark dark:bg-bgDark"
				value={requirement.pin.sectionCode}
				on:change={(e) =>
					patch({
						pin: {
							kind: 'bySection',
							sectionCode: e.currentTarget.value
						}
					})}
			>
				{#each sections as section}
					<option value={section.sectionCode}>
						{section.sectionCode}
					</option>
				{/each}
			</select>
		{:else if requirement.pin.kind === 'byInstructor'}
			<select
				class="grow rounded-md border border-outlineLight bg-bgLight
					px-1 py-0.5 dark:border-outlineDark dark:bg-bgDark"
				value={requirement.pin.name}
				on:change={(e) =>
					patch({
						pin: { kind: 'byInstructor', name: e.currentTarget.value }
					})}
			>
				{#each instructors as name}
					<option value={name}>{name}</option>
				{/each}
			</select>
		{/if}
	</div>
</div>
