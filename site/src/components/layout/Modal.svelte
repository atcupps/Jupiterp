<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';

    export let open: boolean = false;
    export let title: string = '';
    export let closeOnBackdropClick: boolean = true;

    const dispatch = createEventDispatcher<{ close: void }>();

    function close() {
        dispatch('close');
    }

    function handleBackdropClick(event: MouseEvent) {
        if (!closeOnBackdropClick) {
            return;
        }

        if (event.target === event.currentTarget) {
            close();
        }
    }

    function handleWindowKeydown(event: KeyboardEvent) {
        if (!open) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if open}
    <div class='fixed inset-0 z-[90] bg-black/30 flex items-center justify-center p-4'
        role='presentation'
        in:fade={{ duration: 120 }}
        out:fade={{ duration: 100 }}
        on:click={handleBackdropClick}>
        <div class='w-full max-w-md rounded-lg border border-outlineLight dark:border-outlineDark
                    bg-bgLight dark:bg-bgDark shadow-lg'
            role='dialog'
            aria-modal='true'
            aria-label={title}>
            <div class='flex items-center justify-between px-4 py-3 border-b
                        border-divBorderLight dark:border-divBorderDark'>
                <h2 class='text-base font-semibold'>{title}</h2>
                <button class='rounded px-2 py-1 text-sm hover:bg-hoverLight dark:hover:bg-hoverDark'
                    type='button'
                    aria-label='Close modal'
                    on:click={close}>
                    ×
                </button>
            </div>

            <div class='px-4 py-3'>
                <slot />
            </div>
        </div>
    </div>
{/if}
