<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { SunOutline } from 'flowbite-svelte-icons';
	import { MoonOutline } from 'flowbite-svelte-icons';

	function toggleDarkMode() {
		const isDark: boolean = localStorage.theme === 'dark';
		if (isDark) {
			localStorage.setItem('theme', 'light');
		} else {
			localStorage.setItem('theme', 'dark');
		}

		document.documentElement.classList.toggle('dark');
	}
</script>

<button
	class="static mx-4 h-5 w-9 translate-y-[0%] rounded-[10px] border
                border-solid border-outlineLight bg-transparent
                hover:border-black hover:transition-colors
                xl:translate-y-[10%] dark:border-outlineDark dark:hover:border-white"
	title="Toggle Dark Mode"
	on:click={toggleDarkMode}
>
	<div
		class="absolute left-0 top-[50%] h-4 w-4 translate-y-[-50%]
                transform rounded-[8px]
                bg-bgSecondaryLight transition-transform duration-300
                ease-in-out dark:translate-x-[1.12rem] dark:bg-hoverDark"
	>
		<SunOutline
			class="visible relative left-[50%]
                            top-[50%] h-3
                            w-3 translate-x-[-55%]
                            translate-y-[-50%] text-black dark:hidden"
		/>
		<MoonOutline
			class="relative left-[50%] top-[50%] hidden h-3
                            w-3 translate-x-[-50%]
                            translate-y-[-50%] text-white dark:block"
		/>
	</div>
</button>
