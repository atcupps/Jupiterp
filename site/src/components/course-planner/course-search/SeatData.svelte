<script lang='ts'>
    import type { Section } from "@jupiterp/jupiterp";

    export let section: Section;
</script>


{#if section.totalSeats > 0}
<div class='flex flex-row text-xs 2xl:text-base font-medium w-full pb-1'>
    {section.openSeats} / {section.totalSeats} seats available
    <br>
    {#if section.openSeats == 0}
        Waitlist: {section.waitlist}
    {/if}
    {#if section.holdfile != null}
        <br>
        Holdfile: {section.holdfile}
    {/if}
</div>
{/if}