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

<div class="fixed z-[50] w-full px-4">
	<div
		class="flex h-12 flex-row justify-start border-b-2 border-divBorderLight dark:border-divBorderDark"
	>
		<a href="/" class="flex py-1">
			<img src="logo.svg" alt="Jupiterp Beta logo" />
		</a>
		<SiteLinks />
	</div>
</div>

<slot />
