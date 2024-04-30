<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { formatClassDayTime, formatLocation } from "../../../lib/course-planner/Formatting";

    export let meeting: ClassMeeting;
    export let locationHover: boolean;
    export let removeHoverSection: () => void;

    function handleLinkClick(event: MouseEvent) {
        // Prevent the event from propagating to the button
        event.stopPropagation();
    }

    function generateMapURL(location: string): string {
        return 'https://maps.umd.edu/map/index.html?Welcome=False&MapView=Detailed&LocationType=Building&LocationName=' + location
    }
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
                <a href={generateMapURL(meeting.InPerson.location[0])}
                        class=
                        'text-orange underline inline-flex flex-wrap rounded-md
                        hover:bg-hoverLight hover:dark:bg-hoverDark transition
                        p-0.5'
                        on:mouseenter={() => {
                            locationHover = true;
                            removeHoverSection();
                        }}
                        on:mouseleave={() => {
                            locationHover = false
                            removeHoverSection();
                        }}
                        on:click={handleLinkClick}
                        target='_blank'
                        title='View on UMD Map'>
                    {formatLocation(meeting.InPerson.location)}
                </a>
            {/if}
        </div>
    {/if}
</div>