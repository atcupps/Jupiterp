<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { AngleDownOutline } from 'flowbite-svelte-icons';
	import { clickoutside } from '@svelte-put/clickoutside';

	export let link: string;
	export let text: string;
	export let target: string | undefined = undefined;
	export let fullWidth: boolean = false;
	export let isOnPage: boolean = false;

	let showExpandedLinks: boolean = false;
</script>

<div
	class="relative mx-4 px-1 font-normal"
	use:clickoutside
	on:clickoutside={() => (showExpandedLinks = false)}
>
	<a href={link} {target} class="inline-flex items-center transition">
		<span
			class:w-[90%]={fullWidth}
			class:siteLinkUnderline={isOnPage}
			class:text-orange={isOnPage}
			class:hover:text-orange={!isOnPage}
			class:dark:hover:text-lightOrange={!isOnPage}
			class:text-textLight={!isOnPage}
			class:dark:text-white={!isOnPage}
		>
			{text}
		</span>
	</a>
	<button
		on:click={() => (showExpandedLinks = !showExpandedLinks)}
		title="Show more links"
		class="transition"
		class:rotate-180={showExpandedLinks}
	>
		<AngleDownOutline
			class="ml h-3.5 w-3.5
                                text-textLight hover:text-orange
                                dark:text-textDark dark:hover:text-lightOrange"
		/>
	</button>
	<div
		class="visible absolute top-full flex min-w-12 translate-x-[-12%]
                flex-col rounded-lg border-2 border-divBorderLight bg-bgLight
                p-2 dark:border-divBorderDark dark:bg-bgDark"
		class:hidden={!showExpandedLinks}
	>
		<slot />
	</div>
</div>

<style>
	.siteLinkUnderline {
		display: inline-block;
		position: relative;
	}

	.siteLinkUnderline::after {
		content: '';
		position: absolute;
		width: 100%;
		height: 2px;
		bottom: 0;
		left: 0;
		transform: scaleX(95%);
		transform-origin: center;
		background-color: #f6743c;
	}
</style>
