<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import ClassMeeting from "./ClassMeeting.svelte";

    export let name: string;
    export let classes: ClassMeetingExtended[];
    export let earliestClassStart: number = 0;
    export let latestClassEnd: number = 0;
    export let bgHeight: number;
    export let type: string = 'Day';
    $: bgHeight;
</script>

<div class='w-full h-full z-10 flex flex-col px-2'>
    <div>
        {name}
    </div>
    <div class='relative' 
        style='height: {bgHeight}px; top: 14px'>
        {#each classes as classMeeting, 
                            index (`${index}-${classMeeting.instructors}`)}
            <ClassMeeting meeting={classMeeting} isInOther={type==='Other'}
                bind:earliestClassStart bind:latestClassEnd />
        {/each}
    </div>
</div>