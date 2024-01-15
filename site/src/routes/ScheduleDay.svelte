<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import ClassMeeting from "./ClassMeeting.svelte";

    export let name: string;
    export let classes: ClassMeetingExtended[];
    export let earliestClassStart: number;
    export let latestClassEnd: number;
    export let bgHeight: number;
    $: bgHeight;
</script>

<div class='w-full h-full z-10 flex flex-col px-2 scheduleDay'>
    <div>
        {name}
    </div>
    <div class='relative' 
        style='height: {bgHeight}px; top: 14px'>
        {#each classes as classMeeting (classMeeting.instructors)}
            <ClassMeeting meeting={classMeeting}
                bind:earliestClassStart bind:latestClassEnd />
        {/each}
    </div>
</div>