<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang='ts'>
    import { base } from '$app/paths';

    export let email: string | null = null;
    export let greetingName = 'Student';
    export let academicLine = 'UMD student';
    export let termBlurb = '';
    export let majorsLabel = 'Not set';
    export let degreeType = 'Undergraduate';
    export let friendCode = '';
    export let visibility = 'full';
    export let graduationYear: number | null = null;
    export let totalCreditsTaken = 0;
    export let onSignOut: () => void = () => undefined;
    export let onEdit: () => void = () => undefined;

    let copied = false;

    function initialsFromName(name: string): string {
        const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
        if (parts.length === 0) {
            return 'JP';
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    async function copyFriendCode() {
        if (!friendCode) {
            return;
        }

        try {
            await navigator.clipboard.writeText(friendCode);
            copied = true;
            setTimeout(() => {
                copied = false;
            }, 1200);
        } catch {
            copied = false;
        }
    }
</script>

<div class='rounded-xl border border-outlineLight dark:border-outlineDark
            bg-bgSecondaryLight/70 dark:bg-bgSecondaryDark/70
            shadow-sm p-4 md:p-6'>
    <button class='float-right rounded-md px-3 py-1 text-sm border
                    border-outlineLight dark:border-outlineDark
                    hover:bg-hoverLight dark:hover:bg-hoverDark
                    focus:outline-none focus:ring'
            on:click={onSignOut}>
        Sign Out
    </button>

    <div class='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        <div class='flex flex-row gap-4 items-start'>
            <div class='relative'>
                <div class='h-24 w-24 rounded-full bg-gradient-to-br
                            from-[#b90e25] to-[#ffd54f]
                            text-white font-semibold text-3xl
                            border-4 border-white/90 dark:border-bgDark
                            flex items-center justify-center shadow-lg'>
                    {initialsFromName(greetingName)}
                </div>
                <button class='absolute -bottom-1 -right-1 h-7 w-7 rounded-full
                                border border-outlineLight dark:border-outlineDark
                                bg-bgLight dark:bg-bgDark text-xs
                                hover:bg-hoverLight dark:hover:bg-hoverDark
                                focus:outline-none focus:ring'
                        aria-label='Change avatar'
                        title='Edit profile'
                        on:click={onEdit}>
                    Edit
                </button>
            </div>

            <div class='min-w-0'>
                <h2 class='text-2xl md:text-3xl font-semibold leading-tight break-words'>
                    Hi, {greetingName}
                </h2>
                <div class='text-xs opacity-70 mt-1'>Signed in as</div>
                <div class='text-sm md:text-base font-medium break-all' title={email ?? ''}>
                    {email ?? 'Not signed in'}
                </div>
                <div class='text-sm opacity-80 mt-1'>
                    {academicLine}
                </div>
                {#if termBlurb}
                    <div class='text-xs opacity-70 mt-2'>{termBlurb}</div>
                {/if}
                {#if graduationYear}
                    <span class='inline-flex mt-2 rounded-full border
                                border-outlineLight dark:border-outlineDark
                                px-2 py-0.5 text-xs'>
                        Class of {graduationYear}
                    </span>
                {/if}
            </div>
        </div>

        <div class='flex flex-col gap-2'>
            <h3 class='text-base font-semibold'>Quick Profile</h3>
            <div class='grid grid-cols-[120px_1fr] text-sm gap-y-2'>
                <div class='opacity-70'>Major(s):</div>
                <div class='break-words'>{majorsLabel}</div>

                <div class='opacity-70'>Degree Type:</div>
                <div>{degreeType}</div>

                <div class='opacity-70'>Friend code:</div>
                <div class='flex items-center gap-2'>
                    <code class='rounded-md px-2 py-0.5 bg-bgLight dark:bg-bgDark'>
                        {friendCode || 'N/A'}
                    </code>
                    <button class='rounded-md px-2 py-0.5 border border-outlineLight
                                    dark:border-outlineDark text-xs
                                    hover:bg-hoverLight dark:hover:bg-hoverDark
                                    focus:outline-none focus:ring'
                            aria-label='Copy friend code'
                            on:click={copyFriendCode}>
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                <div class='opacity-70'>Privacy:</div>
                <div class='flex items-center gap-2'>
                    <span class='inline-flex rounded-full px-2 py-0.5 text-xs
                                 border border-outlineLight dark:border-outlineDark'>
                        Profile visibility: {visibility}
                    </span>
                    <button class='rounded-md px-1 text-xs opacity-70 hover:opacity-100
                                    focus:outline-none focus:ring'
                            aria-label='What friends can see'
                            title='Determines how much of your schedule details friends can view.'>
                        i
                    </button>
                </div>

                <div class='opacity-70'>Credits taken:</div>
                <div>{totalCreditsTaken}</div>
            </div>

            <div class='flex flex-wrap gap-2 pt-1'>
                <a class='px-3 py-1 rounded-md border border-outlineLight
                         dark:border-outlineDark text-sm
                         hover:bg-hoverLight dark:hover:bg-hoverDark
                         focus:outline-none focus:ring'
                    href={`${base}/major-minor-requirements`}>
                    Manage Major/Minor Requirements
                </a>
                <a class='px-3 py-1 rounded-md border border-outlineLight
                         dark:border-outlineDark text-sm
                         hover:bg-hoverLight dark:hover:bg-hoverDark
                         focus:outline-none focus:ring'
                    href={`${base}/gen-eds`}>
                    View Gen Ed Progress
                </a>
            </div>
        </div>
    </div>
</div>
