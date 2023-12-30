<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import { formatClasstime } from './formatting';

    export let meeting: ClassMeetingExtended;
</script>

<ul>
    <li>
        <b>{meeting.course}</b>
        <ul>
            <li>
                {meeting.instructors}
            </li>
            {#if typeof meeting.meeting === 'string'}
                <li>
                    {meeting.meeting}
                </li>
            {:else if 'OnlineSync' in meeting.meeting}
                <li>
                    {formatClasstime(meeting.meeting.OnlineSync)}
                </li>
            {:else}
                {#if meeting.meeting.InPerson.classtime == null}
                    <li>
                        Time TBA
                    </li>
                {:else}
                    <li>
                        {formatClasstime(meeting.meeting.InPerson.classtime)}
                    </li>
                {/if}
                {#if meeting.meeting.InPerson.location == null}
                    <li>
                        Location TBA
                    </li>
                {:else}
                    <li>
                        {meeting.meeting.InPerson.location[0]}
                        {meeting.meeting.InPerson.location[1]}
                    </li>
                {/if}
            {/if}
        </ul>
    </li>
</ul>