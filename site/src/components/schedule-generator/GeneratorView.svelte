<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import CourseWishlist from './CourseWishlist.svelte';
	import ConstraintsPanel from './ConstraintsPanel.svelte';
	import ResultsGallery from './ResultsGallery.svelte';
</script>

<div
	class="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]
		lg:gap-6"
>
	<!-- Inputs: wishlist + constraints -->
	<div
		class="custom-scrollbar flex flex-col gap-4 lg:max-h-[calc(100svh-7rem)]
			lg:overflow-y-auto lg:pr-2"
	>
		<CourseWishlist />
		<div class="border-t border-divBorderLight pt-2 dark:border-divBorderDark">
			<h2 class="mb-1 text-lg font-bold">Constraints</h2>
			<ConstraintsPanel />
		</div>
	</div>

	<!-- Results -->
	<div class="custom-scrollbar lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
		<ResultsGallery />
	</div>
</div>
