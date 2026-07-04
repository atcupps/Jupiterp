<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { CloseOutline } from 'flowbite-svelte-icons';
	import { splitCourseCode } from '../../lib/course-planner/Formatting';
	import GeneratorSelect from './GeneratorSelect.svelte';
	import { GeneratorRequirementsStore } from '../../stores/GeneratorStores';
	import type { GeneratorRequirement } from '../../stores/GeneratorStores';

	export let requirement: GeneratorRequirement;
	export let index: number;

	$: sections = requirement.course.sections ?? [];
	$: instructors = Array.from(new Set(sections.flatMap((s) => s.instructors))).sort();
	$: pinMode = requirement.pin.kind;
	$: sectionOptions = sections.map((s) => ({ value: s.sectionCode, label: s.sectionCode }));
	$: instructorOptions = instructors.map((n) => ({ value: n, label: n }));

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
		<div class="flex min-w-0 grow flex-col overflow-hidden">
			<span class="truncate text-sm font-bold">
				{splitCourseCode(requirement.course.courseCode)}
			</span>
			<span class="truncate text-xs opacity-70">
				{requirement.course.name}
			</span>
		</div>

		<!-- Required / Optional toggle -->
		<div
			class="flex shrink-0 flex-row overflow-hidden rounded-md border
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
	<div class="flex flex-row flex-wrap items-center gap-2 text-xs">
		<span class="opacity-70">Pin to:</span>
		<div
			class="flex flex-row overflow-hidden rounded-md border
				border-outlineLight dark:border-outlineDark"
		>
			<button
				class="px-2 py-0.5"
				class:bg-orange={pinMode === 'none'}
				class:text-white={pinMode === 'none'}
				on:click={() => setPinMode('none')}
				title="Consider every section of this course"
			>
				Any
			</button>
			<button
				class="border-l border-outlineLight px-2 py-0.5 dark:border-outlineDark"
				class:bg-orange={pinMode === 'bySection'}
				class:text-white={pinMode === 'bySection'}
				on:click={() => setPinMode('bySection')}
				title="Lock this course to a specific section"
			>
				Section
			</button>
			<button
				class="border-l border-outlineLight px-2 py-0.5 dark:border-outlineDark"
				class:bg-orange={pinMode === 'byInstructor'}
				class:text-white={pinMode === 'byInstructor'}
				on:click={() => setPinMode('byInstructor')}
				title="Lock this course to a specific professor"
			>
				Professor
			</button>
		</div>

		{#if requirement.pin.kind === 'bySection'}
			<GeneratorSelect
				options={sectionOptions}
				value={requirement.pin.sectionCode}
				onChange={(v) => patch({ pin: { kind: 'bySection', sectionCode: v } })}
				buttonClass="grow"
				title="Pinned section"
			/>
		{:else if requirement.pin.kind === 'byInstructor'}
			<GeneratorSelect
				options={instructorOptions}
				value={requirement.pin.name}
				onChange={(v) => patch({ pin: { kind: 'byInstructor', name: v } })}
				buttonClass="grow"
				title="Pinned professor"
			/>
		{/if}
	</div>
</div>
