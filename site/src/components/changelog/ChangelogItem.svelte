<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	export let title: string;
	export let version: string;
	export let date: string;
</script>

<div class="mx-2 border-l-2 border-divBorderLight py-2 dark:border-divBorderDark">
	<div class="flex flex-col px-4">
		<div class="static flex flex-row items-end">
			<div
				class="absolute h-5 w-5 translate-x-[-27px] translate-y-[-6px] bg-bgLight p-1.5 dark:bg-bgDark"
			>
				<div class="h-full w-full rounded-full bg-orange"></div>
			</div>
			<span class="mr-2 text-xl font-bold dark:text-white">
				{title}
			</span>
			<span class="font-light text-secCodesLight dark:text-secCodesDark">
				{version}
			</span>
		</div>
		<span class="align-top text-sm italic">
			{date}
		</span>

		<div>
			<slot />
		</div>
	</div>
</div>
