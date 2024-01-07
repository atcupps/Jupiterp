<script lang='ts'>
    import ClassMeeting from "./ClassMeeting.svelte";

    export let name: String;
    export let classes: ClassMeetingExtended[];
</script>

<div class='w-full h-full z-10 flex flex-col px-2'>
    <div>
        {name}
    </div>
    <div class='relative' style='height: calc({20 / 21 * 100}% - 28px - 14px); top: 14px'>
        {#each classes as classMeeting}
            <ClassMeeting meeting={classMeeting} />
        {/each}
    </div>
</div>