<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import AboutContent from '../../components/about/AboutContent.svelte';

	const h1Classes = 'text-2xl border-b-2 border-divBorderLight dark:border-divBorderDark';
</script>

<div
	class="fixed bottom-0 top-[3rem] overflow-y-scroll px-8
            py-2 text-textLight lg:top-[3.5rem] xl:top-[4rem] dark:text-white"
>
	<h1 class={h1Classes}>About Jupiterp</h1>
	<AboutContent />
</div>
