<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang='ts'>
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import AboutContent from '../../components/about/AboutContent.svelte';
    import {
        JUPITERP_GITHUB_URL,
        JUPITERP_ISSUE_FORM_URL,
    } from '$lib/config/links';
    import { ensureUserProfile } from '$lib/supabase';
    import {
        loadProfileState,
        ProfileStateStore,
        saveProfileStatePatch,
    } from '$lib/profile/store';
    import type { ProfilePrivacyLevel } from '$lib/profile/types';

    const privacyOptions: Array<{ value: ProfilePrivacyLevel, label: string }> = [
        { value: 'public', label: 'Public' },
        { value: 'friends_only', label: 'Friends only' },
        { value: 'umd_only', label: 'UMD only' },
        { value: 'private', label: 'Private' },
    ];

    let profileState = get(ProfileStateStore);
    const unsubscribeProfileState = ProfileStateStore.subscribe((value) => {
        profileState = value;
    });

    let isDark = false;
    let privacyMessage: string | null = null;
    let privacyError: string | null = null;

    function syncThemeFromDom() {
        isDark = document.documentElement.classList.contains('dark');
    }

    function setTheme(nextDark: boolean) {
        isDark = nextDark;
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', nextDark);
    }

    function toggleTheme() {
        setTheme(!isDark);
    }

    function handleSwitchKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleTheme();
        }
    }

    async function onPrivacyChanged(event: Event) {
        privacyMessage = null;
        privacyError = null;
        const target = event.currentTarget as HTMLSelectElement;

        const result = await saveProfileStatePatch({
            profilePrivacy: target.value as ProfilePrivacyLevel,
        });

        if (!result.ok) {
            privacyError = result.message ?? 'Unable to update privacy settings.';
            return;
        }

        privacyMessage = 'Privacy settings saved.';
    }

    onMount(() => {
        syncThemeFromDom();

        void (async () => {
            try {
                const row = await ensureUserProfile();
                await loadProfileState(row);
            } catch {
                await loadProfileState(null);
            }
        })();

        return () => unsubscribeProfileState();
    });
</script>

<div class='fixed left-0 right-0 top-[3rem] lg:top-[3.5rem] xl:top-[4rem]
            bottom-0 px-6 lg:px-8 py-6 overflow-y-auto text-textLight
            dark:text-textDark'>
    <div class='w-full max-w-5xl mx-auto flex flex-col gap-4'>
        <h1 class='text-2xl font-semibold'>Settings</h1>

        <section class='rounded-md border border-outlineLight dark:border-outlineDark p-4 flex flex-col gap-3'>
            <h2 class='text-lg font-semibold'>Theme</h2>
            <div class='flex flex-row items-center justify-between gap-3'>
                <div>
                    <div class='text-sm font-semibold'>Appearance</div>
                    <div class='text-xs opacity-70'>Choose light or dark mode.</div>
                </div>
                <button role='switch'
                        aria-checked={isDark}
                        aria-label='Toggle dark mode'
                        class='relative rounded-full w-14 h-7 border border-outlineLight dark:border-outlineDark
                               transition-colors focus:outline-none focus:ring'
                        class:bg-hoverDark={isDark}
                        class:bg-hoverLight={!isDark}
                        on:click={toggleTheme}
                        on:keydown={handleSwitchKeydown}>
                    <span class='absolute top-0.5 left-0.5 h-5.5 w-5.5 rounded-full
                                 bg-bgLight dark:bg-bgDark transition-transform'
                          class:translate-x-7={isDark}></span>
                </button>
            </div>
        </section>

        <section id='privacy' class='rounded-md border border-outlineLight dark:border-outlineDark p-4 flex flex-col gap-3'>
            <h2 class='text-lg font-semibold'>Privacy</h2>
            <p class='text-sm opacity-75'>
                This privacy level is shared with your Profile view and updates immediately.
            </p>
            <label class='flex flex-col gap-1 max-w-sm'>
                <span class='text-xs opacity-70'>Who can view your profile details</span>
                <select class='rounded-md border border-outlineLight dark:border-outlineDark
                               bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                        bind:value={profileState.profilePrivacy}
                        disabled={profileState.syncing}
                        on:change={onPrivacyChanged}>
                    {#each privacyOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </label>
            {#if privacyMessage}
                <div class='text-sm'>{privacyMessage}</div>
            {/if}
            {#if privacyError}
                <div class='text-sm text-red-500'>{privacyError}</div>
            {/if}
        </section>

        <section class='rounded-md border border-outlineLight dark:border-outlineDark p-4 flex flex-col gap-3'>
            <h2 class='text-lg font-semibold'>Links & Info</h2>
            <div class='flex flex-wrap gap-2'>
                <a class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
                           hover:bg-hoverLight dark:hover:bg-hoverDark text-sm'
                    href={`${base}/bugs`}>
                    Report an Issue
                </a>
                <a class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
                           hover:bg-hoverLight dark:hover:bg-hoverDark text-sm'
                    href={JUPITERP_GITHUB_URL}
                    target='_blank'>
                    GitHub
                </a>
                <a class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
                           hover:bg-hoverLight dark:hover:bg-hoverDark text-sm'
                    href={JUPITERP_ISSUE_FORM_URL}
                    target='_blank'>
                    Open Issue Form
                </a>
                <a class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
                           hover:bg-hoverLight dark:hover:bg-hoverDark text-sm'
                    href={`${base}/terms-of-use`}>
                    Terms of Use
                </a>
                <a class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
                           hover:bg-hoverLight dark:hover:bg-hoverDark text-sm'
                    href={`${base}/changelog`}>
                    Changelog
                </a>
            </div>
            <div class='mt-2 border-t border-divBorderLight dark:border-divBorderDark pt-3'>
                <h3 class='text-base font-semibold mb-2'>About</h3>
                <AboutContent />
            </div>
        </section>
    </div>
</div>
