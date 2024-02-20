<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import ClassMeeting from "./ClassMeeting.svelte";

    export let name: string;
    export let selections: ScheduleSelection[];
    export let classes: ClassMeetingExtended[];
    export let earliestClassStart: number = 0;
    export let latestClassEnd: number = 0;
    export let bgHeight: number;
    export let type: string = 'Day';
    export let showCourseInfo: string | null;
    $: bgHeight;
</script>

<div class='w-full h-full z-10 flex flex-col px-2'>
    <div>
        {name}
    </div>
    <div class='relative top-[14px]' 
        style='height: {bgHeight}px;'>
        {#each classes as classMeeting, 
                            index (`${index}-${classMeeting.instructors}`)}
            <ClassMeeting meeting={classMeeting} isInOther={type==='Other'}
                bind:selections={selections} bind:earliestClassStart 
                bind:latestClassEnd bind:showCourseInfo />
        {/each}
    </div>
</div>