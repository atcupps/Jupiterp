<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import type { PageData } from './$types';
	import type { GenEdCategory } from '$lib/gened/requirements';
	import GenEdProgressTable from '../../components/gened/GenEdProgressTable.svelte';

	export let data: PageData;

	type CategorySummary = {
		completed: number;
		required: number;
	};

	const categoryOrder: GenEdCategory[] = [
		'Fundamental Studies',
		'Distributive Studies',
		'I-Series / Big Question',
		'Diversity'
	];

	$: categorySummaries = categoryOrder.reduce(
		(accumulator, category) => {
			const rows = data.genEdProgress.filter((row) => row.requirement.category === category);
			accumulator[category] = {
				completed: rows.reduce(
					(sum, row) => sum + Math.min(row.countedCount, row.requirement.requiredCount),
					0
				),
				required: rows.reduce((sum, row) => sum + row.requirement.requiredCount, 0)
			};
			return accumulator;
		},
		{} as Record<GenEdCategory, CategorySummary>
	);
</script>

<div
	class="fixed bottom-0 left-0 right-0 top-[3rem] overflow-y-auto
            px-6 py-6 text-textLight lg:top-[3.5rem] lg:px-8 xl:top-[4rem]
            dark:text-textDark"
>
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-4">
		<h1 class="text-2xl font-semibold">Gen Eds</h1>

		<div
			class="flex flex-col gap-3 rounded-md
                    border border-outlineLight p-3 dark:border-outlineDark"
		>
			<div>
				<h2 class="text-lg font-semibold">Gen Ed Progress</h2>
				<div class="text-xs opacity-70">Requirement progress by official UMD Gen Ed codes.</div>
			</div>

			{#if data.genEdLoadError}
				<div class="rounded-md border border-outlineLight p-2 text-sm dark:border-outlineDark">
					{data.genEdLoadError}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
				{#each categoryOrder as category}
					<div class="rounded-md border border-outlineLight p-2 dark:border-outlineDark">
						<div class="text-xs opacity-70">{category}</div>
						<div class="text-sm font-semibold">
							{categorySummaries[category]?.completed ?? 0}
							/
							{categorySummaries[category]?.required ?? 0}
							courses counted
						</div>
					</div>
				{/each}
			</div>

			<GenEdProgressTable rows={data.genEdProgress} />
		</div>
	</div>
</div>
