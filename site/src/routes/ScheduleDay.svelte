<script lang='ts'>
    import ClassMeeting from "./ClassMeeting.svelte";

    export let name: String;
    export let classes: ClassMeetingExtended[];
</script>

<div class='w-full h-full z-10 relative'>
    {name}
    {#each classes as classMeeting}
        <ClassMeeting meeting={classMeeting} />
    {/each}
</div>