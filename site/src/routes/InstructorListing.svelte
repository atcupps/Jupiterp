<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import { ptLinkFromSlug } from "./professors";

    export let instructor: string = 'No instructor';
    export let profs: Record<string, Professor>;
    console.log(profs);

    function handleLinkClick(event: MouseEvent) {
        // Prevent the event from propagating to the button
        event.stopPropagation();
    }
</script>

<div>
    {#if (instructor in profs && profs[instructor].average_rating != null)}
        <a href={ptLinkFromSlug(profs[instructor].slug)}
                    target='_blank'
                    class='text-orange underline'
                    on:click={handleLinkClick}>
            {instructor}
        </a>
    {:else}
        {instructor}
    {/if}
</div>