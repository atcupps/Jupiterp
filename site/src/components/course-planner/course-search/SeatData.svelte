<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import type { Section } from '@jupiterp/jupiterp';

	export let section: Section;
</script>

{#if section.totalSeats > 0}
	<div class="flex w-full flex-row pb-1 text-xs font-medium 2xl:text-base">
		{section.openSeats} / {section.totalSeats} seats available
		<br />
		{#if section.openSeats == 0}
			Waitlist: {section.waitlist}
		{/if}
		{#if section.holdfile != null}
			<br />
			Holdfile: {section.holdfile}
		{/if}
	</div>
{/if}
