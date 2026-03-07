<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang='ts'>
    import { JUPITERP_ISSUE_FORM_URL } from '$lib/config/links';
</script>

<div class='text-textLight dark:text-white py-2 px-8 overflow-y-scroll
            flex justify-center w-full
            top-[3rem] lg:top-[3.5rem] xl:top-[4rem] bottom-0 fixed'>
    <!-- format-check exempt 5 -->
    <iframe 
        title="Jupiterp Issue/Bug Report Form"
        src={JUPITERP_ISSUE_FORM_URL}
        class="w-full h-full"
    >
        Loading…
    </iframe>
</div>