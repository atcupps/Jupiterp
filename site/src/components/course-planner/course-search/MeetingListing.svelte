<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import type { ClassMeeting } from "@jupiterp/jupiterp";
    import { formatClassDayTime, formatLocation } from "../../../lib/course-planner/Formatting";

    export let meeting: ClassMeeting;
    export let locationHover: boolean;
    export let removeHoverSection: () => void;
    export let condensed: boolean = false;

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
    {:else}
        <!-- Classtime -->
        <span class:grow={!condensed}>
            {formatClassDayTime(meeting.classtime)}
        </span>

        <!-- Location -->
         <span class:grow={!condensed} class:text-right={!condensed}>
            {#if condensed}&nbsp;in {/if}
            {#if meeting.location.building.length !== 3 || meeting.location.room == null}
                <span class='pr-0.5'>
                    {formatLocation(meeting.location)}
                </span>
            {:else}
                <a href={generateMapURL(meeting.location.building)}
                        class=
                        'text-orange underline rounded-md p-0.5
                        hover:bg-hoverLight hover:dark:bg-hoverDark transition'
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
                    {formatLocation(meeting.location)}
                </a>
            {/if}
         </span>
    {/if}
</div>