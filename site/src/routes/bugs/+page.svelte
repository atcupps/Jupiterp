<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import { JUPITERP_ISSUE_FORM_URL } from '$lib/config/links';
</script>

<div
	class="fixed bottom-0 top-[3rem] flex w-full
            justify-center overflow-y-scroll px-8
            py-2 text-textLight lg:top-[3.5rem] xl:top-[4rem] dark:text-white"
>
	<!-- format-check exempt 5 -->
	<iframe
		title="Jupiterp Issue/Bug Report Form"
		src={JUPITERP_ISSUE_FORM_URL}
		class="h-full w-full"
	>
		Loading…
	</iframe>
</div>
