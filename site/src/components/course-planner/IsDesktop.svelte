<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	export let isDesktop: boolean = false;

	let innerWidth: number = 0;

	$: isDesktop = innerWidth >= 1024;
</script>

<svelte:window bind:innerWidth />
