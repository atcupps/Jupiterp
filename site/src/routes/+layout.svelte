<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import '../app.css';
	import Analytics from '../components/layout/Analytics.svelte';
	import SiteLinks from '../components/layout/SiteLinks.svelte';
</script>

<Analytics />

<div class="fixed z-[50] w-full bg-bgLight px-8 dark:bg-bgDark">
	<div
		class="flex h-12 w-full flex-row justify-center border-b-2 border-divBorderLight
                            lg:h-14 lg:justify-start
                            xl:h-16 dark:border-divBorderDark"
	>
		<a href="/" class="flex w-64">
			<img src="logo.svg" alt="Jupiterp Beta logo" />
		</a>
		<SiteLinks />
	</div>
</div>

<slot />
