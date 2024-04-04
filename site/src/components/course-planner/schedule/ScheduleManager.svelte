<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang='ts'>
    import ScheduleSelectorDropdown from "./ScheduleSelectorDropdown.svelte";
    import ScheduleOptionsDropdown from "./ScheduleOptionsDropdown.svelte";

    export let selections: ScheduleSelection[];
</script>

<div class='text-xs pb-1 font-light w-full static flex flex-row'>
    <ScheduleSelectorDropdown />
    <ScheduleOptionsDropdown />
</div>