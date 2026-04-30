<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	function toggleFont() {
		const isMono: boolean = localStorage.font === 'monocraft';
		if (isMono) {
			localStorage.setItem('font', 'default');
			document.documentElement.classList.remove('monocraft');
		} else {
			localStorage.setItem('font', 'monocraft');
			document.documentElement.classList.add('monocraft');
		}
	}
</script>

<button
	class="static mx-4 h-5 w-9 translate-y-[0%] rounded-[10px] border
            border-solid border-outlineLight bg-transparent
            hover:border-black hover:transition-colors
            xl:translate-y-[10%] dark:border-outlineDark dark:hover:border-white"
	title="Toggle Font"
	on:click={toggleFont}
>
	<div
		class="absolute left-0 top-[50%] h-4 w-4 translate-y-[-50%]
            transform rounded-[8px]
            bg-bgSecondaryLight transition-transform duration-300
            ease-in-out dark:bg-hoverDark"
	>
		<span
			class="relative left-[50%] top-[50%] block translate-x-[-50%] translate-y-[-50%]
                select-none text-[7px] font-bold leading-none text-black dark:text-white"
		>
			Aa
		</span>
	</div>
</button>

<style>
	:global(html.monocraft) button div {
		transform: translateY(-50%) translateX(1.12rem);
	}
</style>
