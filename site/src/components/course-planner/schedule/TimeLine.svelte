<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	export let number: string = '';
	export let position: number = 0;
	export let isLast: boolean = false;
</script>

<div
	class="absolute h-[24px] w-full"
	style="top: {isLast ? `calc(${position * 100}% - 26px)` : `${position * 100}%`}"
>
	<div
		class="absolute w-[46px] text-right
                    text-xs font-light 2xl:w-[54px] 2xl:text-sm"
		style="left: -6px; top: 50%; transform: translateY(-50%);"
	>
		{number}
	</div>
	<div
		class="absolute left-12
        h-[1px] bg-divBorderLight 2xl:left-14 dark:bg-divBorderDark"
		style="top: 50%; width: calc(100% - 48px); opacity: 0.35;"
	/>
</div>
