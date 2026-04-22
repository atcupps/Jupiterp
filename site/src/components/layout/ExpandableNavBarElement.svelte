<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { AngleDownOutline } from 'flowbite-svelte-icons';

	export let link: string;
	export let text: string;
	export let target: string = '_self';
	export let isOnPage: boolean = false;
</script>

<div class="group relative mx-4 px-1 font-normal">
	<a href={link} {target} class="inline-flex items-center transition">
		<span
			class={`${isOnPage ? 'siteLinkUnderline text-orange' : 'text-textLight hover:text-orange dark:text-white dark:hover:text-lightOrange'}`}
		>
			{text}
		</span>
	</a>
	<button
		title="Show more links"
		class="text-textLight transition hover:text-orange group-focus-within:rotate-180 group-focus-within:text-orange group-hover:rotate-180 group-hover:text-orange dark:text-textDark dark:hover:text-lightOrange group-focus-within:dark:text-lightOrange group-hover:dark:text-lightOrange"
	>
		<AngleDownOutline class="ml h-3.5 w-3.5" />
	</button>
	<div
		class="transition-visibility invisible absolute top-full flex min-w-12
                translate-x-[-12%] flex-col gap-2 rounded-lg border-2
                border-divBorderLight bg-bgLight p-2 group-focus-within:visible
                group-hover:visible dark:border-divBorderDark dark:bg-bgDark"
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
