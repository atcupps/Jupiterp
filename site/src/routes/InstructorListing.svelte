<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import { ptLinkFromSlug } from "./professors";

    export let instructor: string = 'No instructor';
    export let profs: Record<string, Professor>;

    // Convert rating to a percentage for CSS
    function convertRating(rating: number | null): number {
        if (rating == null) {
            throw Error(
                'Rating was null in `convertRating`; this should never happen!'
            );
        }
        return rating * 20;
    }

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
        <span style='--rating: {convertRating(profs[instructor].average_rating) + '%'}'
                class='text-[10px] 2xl:text-base align-[2px] text-orange font-bold stars'>
            ★★★★★
        </span>
    {:else}
        {instructor}
    {/if}
</div>

<style>
    .stars {
        background: rgb(246,116,60);
        background: linear-gradient(90deg, 
                            rgba(246,116,60,1) 0%, 
                            rgba(246,116,60,1) var(--rating), 
                            rgba(115, 53, 26, 1) var(--rating), 
                            rgba(115, 53, 26, 1) 100%);
        
        /* Set the background size and repeat properties. */
        background-size: 100%;
        background-repeat: repeat;

        /* Use the text as a mask for the background. */
        /* This will show the gradient as a text color rather than element bg. */
        background-clip: text;
        -webkit-text-fill-color: transparent; 
        -moz-background-clip: text;
        -moz-text-fill-color: transparent;
    }
</style>