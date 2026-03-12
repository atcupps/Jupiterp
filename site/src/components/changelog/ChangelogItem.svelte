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

<div
	class="mx-2 border-l-2 border-divBorderLight py-2
                                dark:border-divBorderDark"
>
	<div class="flex flex-col px-2">
		<div class="static flex flex-row items-end space-x-1.5">
			<div
				class="absolute left-9 h-5
                            w-5 translate-y-[-4px] bg-bgLight dark:bg-bgDark"
			>
				<div
					class="absolute top-[50%] h-2
                            w-2 translate-x-[10%] translate-y-[-50%]
                                            rounded-[50%] bg-orange"
				/>
			</div>
			<span class="text-xl font-bold dark:text-white">
				{title}
			</span>
			<span class="font-light text-secCodesLight dark:text-secCodesDark">
				{version}
			</span>
		</div>
		<span class="pl-1.5 align-top text-sm italic">
			{date}
		</span>

		<div class="pl-1.5">
			<slot />
		</div>
	</div>
</div>
