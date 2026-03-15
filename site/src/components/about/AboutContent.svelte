<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import { base } from '$app/paths';

	const h2Classes = 'text-xl border-b-2 border-divBorderLight dark:border-divBorderDark';
	const h3Classes = 'text-l border-b-2 border-divBorderLight dark:border-divBorderDark';
	const pClasses = 'my-2 text-normal leading-5 text-textLight dark:text-textDark';
</script>

<p class={pClasses}>
	Jupiterp is a website built to help students at the University of Maryland plan their schedules
	and make informed decisions about course and section selections. Jupiterp provides a course
	planner that allows students to search for courses, see sections complete with instructor reviews
	from
	<a href="https://planetterp.com" target="_blank" class="text-orange underline"> PlanetTerp </a>,
	and visualize their course schedule.
</p>
<p class={pClasses}>
	Jupiterp is currently in beta phase. If you find something wrong on our site, please report it as
	an issue
	<a href="https://github.com/atcupps/Jupiterp/issues" target="_blank" class="text-orange underline"
		>here</a
	>.
</p>
<a href={`${base}/changelog`} class="text-orange underline">View changelog</a>

<h2 class={h2Classes}>Professor Ratings</h2>
<p class={pClasses}>
	Stars next to a professor's name indicate their average rating as shown on PlanetTerp. These
	ratings are based on anonymous student reviews and can vary in accuracy and reliability.
</p>

<h2 class={h2Classes}>Open-Source</h2>
<p class={pClasses}>
	Jupiterp is open-source and accepting contributions. Please visit our
	<a href="https://github.com/atcupps/Jupiterp" target="_blank" class="text-orange underline"
		>GitHub</a
	> to contribute.
</p>

<h2 class={h2Classes}>Credits</h2>
<p class={pClasses}>
	All course information is taken directly from the Testudo Schedule of Classes. Instructor
	information and reviews are gathered from the PlanetTerp API.
</p>

<h3 class={h3Classes}>Core Team</h3>
<p class={pClasses}>
	Jupiterp is open-source, so anyone can contribute. It is primarily maintained by
	<a href="https://atcupps.github.io/" target="_blank" class="text-orange underline">Andrew Cupps</a
	>.
</p>

<h2 class={h2Classes}>Contact</h2>
<p class={pClasses}>
	To contact the Jupiterp team, email
	<code class="rounded-md bg-bgSecondaryLight text-sm dark:bg-bgSecondaryDark">
		admin@jupiterp.com
	</code>.
</p>
