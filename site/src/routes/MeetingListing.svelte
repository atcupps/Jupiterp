<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import { formatClasstime, formatLocation } from "./formatting";

    export let meeting: ClassMeeting;
</script>

<div class='flex flex-row text-xs font-medium w-full'>
    {#if typeof meeting === 'string'}
        {meeting}
    {:else if 'OnlineSync' in meeting}
        {formatClasstime(meeting.OnlineSync)}
    {:else}
        <div class='grow'>
            {#if meeting.InPerson.classtime === null}
                Classtime TBA
            {:else}
                {formatClasstime(meeting.InPerson.classtime)}
            {/if}
        </div>
        <div class='grow text-right'>
            {#if meeting.InPerson.location === null}
                Location TBA
            {:else}
                {formatLocation(meeting.InPerson.location)}
            {/if}
        </div>
    {/if}
</div>