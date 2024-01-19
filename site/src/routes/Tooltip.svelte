<script lang="ts">
    export let text: string = ""; // Text to display
    export let tooltipText: string = ""; // Tooltip message
    let tooltipVisible = false;
</script>


<!-- Ignoring a11y features in Tooltips for now because they are not
    used in any meaningfully important functional way. This might be
    improved in the future with TODO(#29): Ensure accessibility features -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<span
    on:mouseover={() => tooltipVisible = true}
    on:mouseout={() => tooltipVisible = false}>
    {text}
</span>
{#if tooltipVisible}
    <div class="absolute bg-black text-white p-2 text-center rounded-md
                left-[50%] translate-x-[-50%] text-wrap w-[128px] z-30 top-0">
        {tooltipText}
    </div>
{/if}
  