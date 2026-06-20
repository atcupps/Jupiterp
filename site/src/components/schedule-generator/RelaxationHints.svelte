<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { GeneratorConstraintsStore } from '../../stores/GeneratorStores';
	import type { RelaxationHint } from '../../stores/GeneratorStores';
	import { relaxationLabel } from '../../lib/schedule-generator/GeneratorFormat';
	import { runGeneration } from '../../lib/schedule-generator/Generate';

	export let hints: RelaxationHint[];
	export let coursesWithNoValidSections: string[];

	function applyHint(hint: RelaxationHint) {
		GeneratorConstraintsStore.set(hint.relaxation.constraints);
		runGeneration();
	}
</script>

<div class="flex flex-col gap-3">
	{#if coursesWithNoValidSections.length > 0}
		<div
			class="rounded-lg border border-orange bg-lightOrange bg-opacity-30
				px-3 py-2 text-sm"
		>
			No sections fit for:
			<span class="font-semibold">
				{coursesWithNoValidSections.join(', ')}
			</span>. Try relaxing a constraint or unpinning a section.
		</div>
	{/if}

	{#if hints.length > 0}
		<p class="text-sm opacity-80">
			No schedules fit all your constraints. Loosening one would help:
		</p>
		<div class="flex flex-col gap-2">
			{#each hints as hint}
				<button
					class="flex flex-row items-center justify-between gap-2
						rounded-lg border border-divBorderLight px-3 py-2
						text-left text-sm hover:border-orange
						dark:border-divBorderDark"
					on:click={() => applyHint(hint)}
				>
					<span>{relaxationLabel(hint.relaxation)}</span>
					<span class="shrink-0 text-xs text-orange">
						{hint.truncated ? '50+' : hint.scheduleCount} schedule{hint.scheduleCount === 1 &&
						!hint.truncated
							? ''
							: 's'}
					</span>
				</button>
			{/each}
		</div>
	{:else if coursesWithNoValidSections.length === 0}
		<p class="text-sm opacity-80">
			No schedules fit, and no single change unlocks one. Try removing a course, unpinning a
			section, or relaxing several constraints.
		</p>
	{/if}
</div>
