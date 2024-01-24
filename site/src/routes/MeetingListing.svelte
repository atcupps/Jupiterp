<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { formatClassDayTime, formatLocation } from "./formatting";

    export let meeting: ClassMeeting;
</script>

<div class='flex flex-row text-xs 2xl:text-base font-medium w-full'>
    {#if typeof meeting === 'string'}
        {meeting}
    {:else if 'OnlineSync' in meeting}
        {formatClassDayTime(meeting.OnlineSync)}
    {:else}
        <div class='grow'>
            {#if meeting.InPerson.classtime === null}
                Classtime TBA
            {:else}
                {formatClassDayTime(meeting.InPerson.classtime)}
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