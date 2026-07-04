<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { AngleDownOutline } from 'flowbite-svelte-icons';

	export let options: { value: string; label: string }[] = [];
	export let value: string;
	export let onChange: (value: string) => void;
	export let title = '';
	// Extra classes for the trigger button (e.g. width control).
	export let buttonClass = '';

	let open = false;
	$: selected = options.find((o) => o.value === value);

	function choose(next: string) {
		open = false;
		onChange(next);
	}
</script>

<button
	type="button"
	class="flex items-center justify-between gap-1 rounded-md border
		border-outlineLight bg-bgLight px-2 py-0.5 text-left
		hover:border-orange dark:border-outlineDark dark:bg-bgDark {buttonClass}"
	{title}
>
	<span class="truncate">{selected ? selected.label : value}</span>
	<AngleDownOutline class="h-3 w-3 shrink-0 opacity-70" />
</button>

<Dropdown
	bind:open
	class="z-30 max-h-60 overflow-y-auto rounded-md border border-outlineLight
		bg-bgLight shadow-lg dark:border-outlineDark dark:bg-divBorderDark"
>
	{#each options as option}
		<DropdownItem
			class="px-3 py-1 text-left text-sm hover:bg-hoverLight dark:hover:bg-hoverDark {option.value ===
			value
				? 'font-semibold text-orange'
				: ''}"
			on:click={() => choose(option.value)}
		>
			{option.label}
		</DropdownItem>
	{/each}
</Dropdown>
