<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import GeneratorView from '../../components/schedule-generator/GeneratorView.svelte';
	import { loadInstructorLookup } from '$lib/course-planner/CourseSearch';
	import { client } from '$lib/client';
	import { DepartmentsStore } from '../../stores/CoursePlannerStores';

	// Departments are needed so the course search can resolve department codes.
	async function fetchDeptCodes() {
		const res = await client.deptList();
		if (res.ok() && res.data != null) {
			DepartmentsStore.set(res.data);
		} else {
			console.error('Error fetching department codes:', res.errorBody);
		}
	}

	onMount(() => {
		loadInstructorLookup();
		fetchDeptCodes();
	});
</script>

<svelte:head>
	<title>Schedule Generator | Jupiterp</title>
	<meta
		name="description"
		content="Automatically generate conflict-free UMD course schedules
			from your desired courses and constraints."
	/>
</svelte:head>

<div
	class="custom-scrollbar fixed bottom-0 top-12 w-full overflow-y-auto
		px-4 py-3 text-textLight dark:text-textDark"
>
	<div class="mb-3">
		<h1 class="text-2xl font-bold">Schedule Generator</h1>
		<p class="text-sm opacity-70">
			Pick your courses, set any constraints, and Jupiterp will find every conflict-free schedule —
			ranked your way.
		</p>
	</div>

	<GeneratorView />
</div>
