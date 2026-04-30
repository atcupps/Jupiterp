<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	export let number: string = '';
	export let position: number = 0;
</script>

<div class="absolute h-[28px] w-full" style="top: {position * 100}%">
	<div
		class="absolute w-[34px] text-right
                    text-xs font-light 2xl:w-[40px] 2xl:text-sm"
		style="left: -4px; top: 50%; transform: translateY(-50%);"
	>
		{number}
	</div>
	<div
		class="absolute left-9
	        h-[1px] w-[calc(100%-36px)] bg-divBorderLight 2xl:left-11 2xl:w-[calc(100%-44px)] dark:bg-divBorderDark"
		style="top: 50%;"
	/>
</div>
