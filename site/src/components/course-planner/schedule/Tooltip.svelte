<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	export let text: string = ''; // Text to display
	export let tooltipText: string = ''; // Tooltip message
	let tooltipVisible = false;
</script>

<!-- Ignoring a11y features in Tooltips for now because they are not
    used in any meaningfully important functional way. This might be
    improved in the future with TODO(#29): Ensure accessibility features -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
	class="tooltip-trigger relative inline-block cursor-help underline decoration-dotted"
	on:mouseenter={() => (tooltipVisible = true)}
	on:mouseleave={() => (tooltipVisible = false)}
>
	{text}
	{#if tooltipVisible}
		<div
			class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[160px]
                -translate-x-1/2 text-wrap rounded-md bg-black px-2 py-1.5 text-center
                text-xs text-white shadow-lg"
		>
			{tooltipText}
		</div>
	{/if}
</span>
