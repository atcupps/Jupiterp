<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import { onDestroy, onMount } from 'svelte';
    import {
        PlusOutline,
        TrashBinOutline,
        FileCopyOutline
    } from "flowbite-svelte-icons";
    import {
        CurrentScheduleStore,
        NonselectedScheduleStore
    } from "../../../stores/CoursePlannerStores";
    import {
        groupSchedulesByTerm,
        uniqueScheduleName
    } from "$lib/course-planner/ScheduleSelector";
    import {
        getAuthUser,
        isSupabaseConfigured,
        onAuthStateChanged,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
    } from "$lib/supabase";
    import type { ScheduleSelection, StoredSchedule } from "../../../types";

    type PanelTab = 'schedules' | 'profile';

    const PANEL_TABS: { value: PanelTab, label: string }[] = [
        { value: 'schedules', label: 'Schedules' },
        { value: 'profile', label: 'Profile' },
    ];

    const DISPLAY_TERM_OPTIONS: StoredSchedule['term'][] = [
        'Fall',
        'Spring',
        'Winter',
        'Summer',
    ];

    let activeTab: PanelTab = 'schedules';

    let currentScheduleName: string;
    let currentScheduleSelections: ScheduleSelection[];
    let currentScheduleTerm: StoredSchedule['term'];
    let currentScheduleYear: number;
    CurrentScheduleStore.subscribe((stored) => {
        currentScheduleName = stored.scheduleName;
        currentScheduleSelections = stored.selections;
        currentScheduleTerm = stored.term;
        currentScheduleYear = stored.year;
    });

    let nonselectedSchedules: StoredSchedule[] = [];
    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    let scheduleNameElement: HTMLInputElement;
    $: if (currentScheduleName && scheduleNameElement) {
        scheduleNameElement.value = currentScheduleName;
    }

    function updateCurrentSchedule() {
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        });
    }

    function renameCurrentSchedule() {
        const inputScheduleName = scheduleNameElement.value.trim();
        const baseName = inputScheduleName.length > 0
            ? inputScheduleName
            : 'New schedule';
        currentScheduleName = uniqueScheduleName(
            baseName,
            'New ',
            nonselectedSchedules
        );
        updateCurrentSchedule();
    }

    function handleScheduleTermChange(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        const value = target.value;
        if (value === 'Fall' || value === 'Spring' ||
                value === 'Winter' || value === 'Summer') {
            currentScheduleTerm = value;
            updateCurrentSchedule();
        }
    }

    function changeScheduleYear(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const parsed = Number(target.value);
        if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 3000) {
            target.value = currentScheduleYear.toString();
            return;
        }

        currentScheduleYear = parsed;
        updateCurrentSchedule();
    }

    function changeSchedule(newSchedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(newSchedule);
        if (index === -1) {
            return;
        }

        const oldCurrent: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        };

        const updated = [...nonselectedSchedules];
        updated.splice(index, 1);
        updated.unshift(oldCurrent);
        NonselectedScheduleStore.set(updated);

        currentScheduleName = newSchedule.scheduleName;
        currentScheduleSelections = newSchedule.selections;
        currentScheduleTerm = newSchedule.term;
        currentScheduleYear = newSchedule.year;
        updateCurrentSchedule();
    }

    function createNewSchedule() {
        const oldCurrent: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        };

        const updated = [oldCurrent, ...nonselectedSchedules];
        NonselectedScheduleStore.set(updated);

        currentScheduleName = uniqueScheduleName('New schedule', 'New ', updated);
        currentScheduleSelections = [];
        updateCurrentSchedule();
    }

    function duplicateCurrentSchedule() {
        const clone: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections,
            term: currentScheduleTerm,
            year: currentScheduleYear,
        };

        const updated = [clone, ...nonselectedSchedules];
        NonselectedScheduleStore.set(updated);
        currentScheduleName = uniqueScheduleName(
            currentScheduleName,
            'Copy of ',
            updated
        );
        updateCurrentSchedule();
    }

    function deleteNonselected(schedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(schedule);
        if (index === -1) {
            return;
        }

        const updated = [...nonselectedSchedules];
        updated.splice(index, 1);
        NonselectedScheduleStore.set(updated);
    }

    let groupedNonselectedSchedules = groupSchedulesByTerm(nonselectedSchedules);
    $: groupedNonselectedSchedules = groupSchedulesByTerm(nonselectedSchedules)
        .map((group) => {
            return {
                ...group,
                schedules: [...group.schedules].sort((a, b) => {
                    return a.scheduleName.localeCompare(b.scheduleName);
                })
            };
        });

    const authEnabled = isSupabaseConfigured();
    let authReady = false;
    let authUserId: string | null = null;
    let userEmail: string | null = null;
    let authEmail: string = '';
    let major: string = '';
    let friendCodeInput: string = '';
    let generatedFriendCode: string = '';
    let authUnsubscribe: (() => void) | null = null;

    function refreshGeneratedFriendCode() {
        if (authUserId) {
            generatedFriendCode = authUserId.substring(0, 8).toUpperCase();
            return;
        }

        const fallback = localStorage.getItem('profileFriendCode');
        if (fallback) {
            generatedFriendCode = fallback;
            return;
        }

        const randomCode = Math.random()
            .toString(36)
            .replace(/[^A-Z0-9]/gi, '')
            .toUpperCase()
            .substring(0, 8)
            .padEnd(8, '0');
        generatedFriendCode = randomCode;
        localStorage.setItem('profileFriendCode', randomCode);
    }

    function loadProfileFields() {
        const storedMajor = localStorage.getItem('profileMajor');
        major = storedMajor ?? '';
        const storedFriendInput = localStorage.getItem('profileFriendInput');
        friendCodeInput = storedFriendInput ?? '';
        refreshGeneratedFriendCode();
    }

    function saveMajor() {
        localStorage.setItem('profileMajor', major.trim());
    }

    function saveFriendInput() {
        localStorage.setItem('profileFriendInput', friendCodeInput.trim());
    }

    async function emailSignIn() {
        const email = authEmail.trim();
        if (email.length === 0) {
            return;
        }

        try {
            await signInWithEmail(email, window.location.origin);
            authEmail = '';
            alert('Sign-in link sent. Check your email.');
        } catch (error) {
            console.error('Email sign-in failed:', error);
            alert('Could not send sign-in email.');
        }
    }

    async function googleSignIn() {
        try {
            await signInWithGoogle(window.location.origin);
        } catch (error) {
            console.error('Google sign-in failed:', error);
            alert('Could not start Google sign-in.');
        }
    }

    async function signOut() {
        try {
            await signOutUser();
        } catch (error) {
            console.error('Sign-out failed:', error);
        }
    }

    onMount(() => {
        loadProfileFields();

        if (!authEnabled) {
            authReady = true;
            return;
        }

        authUnsubscribe = onAuthStateChanged((user) => {
            authReady = true;
            authUserId = user?.id ?? null;
            userEmail = user?.email ?? null;
            refreshGeneratedFriendCode();
        });

        getAuthUser().then((user) => {
            authReady = true;
            authUserId = user?.id ?? null;
            userEmail = user?.email ?? null;
            refreshGeneratedFriendCode();
        });
    });

    onDestroy(() => {
        if (authUnsubscribe) {
            authUnsubscribe();
        }
    });
</script>

<div class='w-full border-b-2 border-divBorderLight dark:border-divBorderDark
            pb-1 mb-1'>
    <div class='grid grid-cols-2 gap-1 text-sm'>
        {#each PANEL_TABS as tab}
            <button class='rounded-md py-1 transition border border-transparent
                            hover:bg-hoverLight dark:hover:bg-hoverDark'
                    class:bg-hoverLight={activeTab === tab.value}
                    class:dark:bg-hoverDark={activeTab === tab.value}
                    on:click={() => activeTab = tab.value}>
                {tab.label}
            </button>
        {/each}
    </div>
</div>

{#if activeTab === 'schedules'}
    <div class='flex w-full flex-col gap-2'>
        <div class='flex flex-row gap-1'>
            <input bind:this={scheduleNameElement}
                    on:blur={renameCurrentSchedule}
                    title='Current schedule name'
                    class='bg-bgLight dark:bg-bgDark text-sm px-2 py-1 rounded
                            border border-outlineLight dark:border-outlineDark
                            outline-none grow'
                    placeholder='Schedule name'>
            <button class='rounded-md px-1.5 hover:bg-hoverLight
                            dark:hover:bg-hoverDark'
                    title='Create new schedule'
                    on:click={createNewSchedule}>
                <PlusOutline class='w-5 h-5' />
            </button>
            <button class='rounded-md px-1.5 hover:bg-hoverLight
                            dark:hover:bg-hoverDark'
                    title='Duplicate current schedule'
                    on:click={duplicateCurrentSchedule}>
                <FileCopyOutline class='w-5 h-5' />
            </button>
        </div>

        <div class='flex flex-row gap-1'>
            <select class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none'
                    title='Current schedule term'
                    value={currentScheduleTerm}
                    on:change={handleScheduleTermChange}>
                {#each DISPLAY_TERM_OPTIONS as termOption}
                    <option value={termOption}>{termOption}</option>
                {/each}
            </select>

            <input class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none w-20'
                    title='Current schedule year'
                    type='number'
                    min='1900'
                    max='3000'
                    bind:value={currentScheduleYear}
                    on:blur={changeScheduleYear}>
        </div>

        <div class='text-xs opacity-70 px-0.5'>Current: {currentScheduleName}</div>

        <div class='max-h-48 overflow-y-auto pr-0.5'>
            {#if groupedNonselectedSchedules.length === 0}
                <div class='text-sm opacity-70 px-1 py-1'>No other schedules</div>
            {/if}

            {#each groupedNonselectedSchedules as scheduleGroup}
                <div class='text-xs font-semibold opacity-70 pt-1 pb-1 px-1'>
                    {scheduleGroup.groupLabel}
                </div>
                {#each scheduleGroup.schedules as schedule}
                    <div class='flex flex-row items-center gap-1 pb-1'>
                        <button class='text-sm text-left rounded-md px-2 py-1
                                        hover:bg-hoverLight
                                        dark:hover:bg-hoverDark grow truncate'
                                title={'Switch to ' + schedule.scheduleName}
                                on:click={() => changeSchedule(schedule)}>
                            {schedule.scheduleName}
                        </button>
                        <button class='rounded-md p-1 hover:bg-hoverLight
                                        dark:hover:bg-hoverDark'
                                title={'Delete ' + schedule.scheduleName}
                                on:click={() => deleteNonselected(schedule)}>
                            <TrashBinOutline class='w-4 h-4' />
                        </button>
                    </div>
                {/each}
            {/each}
        </div>
    </div>
{:else}
    <div class='flex flex-col gap-2 text-sm'>
        {#if !authEnabled}
            <div class='opacity-80'>
                Auth is not configured. Set Supabase env vars to enable login.
            </div>
        {:else if !authReady}
            <div class='opacity-80'>Loading profile...</div>
        {:else if userEmail}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark
                        p-2'>
                <div class='text-xs opacity-70'>Signed in as</div>
                <div class='truncate font-semibold' title={userEmail}>{userEmail}</div>
                <button class='mt-2 px-2 py-1 rounded-md hover:bg-hoverLight
                                dark:hover:bg-hoverDark border
                                border-outlineLight dark:border-outlineDark'
                        on:click={signOut}>
                    Sign Out
                </button>
            </div>
        {:else}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark
                        p-2 flex flex-col gap-2'>
                <input class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                                border border-outlineLight dark:border-outlineDark
                                outline-none'
                        placeholder='Email'
                        bind:value={authEmail}
                        on:keydown={(event) => {
                            if (event.key === 'Enter') {
                                emailSignIn();
                            }
                        }}>
                <div class='flex flex-row gap-1'>
                    <button class='px-2 py-1 rounded-md hover:bg-hoverLight
                                    dark:hover:bg-hoverDark border
                                    border-outlineLight dark:border-outlineDark grow'
                            on:click={emailSignIn}>
                        Email Login
                    </button>
                    <button class='px-2 py-1 rounded-md hover:bg-hoverLight
                                    dark:hover:bg-hoverDark border
                                    border-outlineLight dark:border-outlineDark grow'
                            on:click={googleSignIn}>
                        Google
                    </button>
                </div>
            </div>
        {/if}

        <div class='rounded-md border border-outlineLight dark:border-outlineDark
                    p-2 flex flex-col gap-1'>
            <label class='text-xs opacity-70' for='major-field'>Major</label>
            <input id='major-field'
                    class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none'
                    bind:value={major}
                    on:blur={saveMajor}
                    placeholder='Ex: Computer Science'>
        </div>

        <div class='rounded-md border border-outlineLight dark:border-outlineDark
                    p-2 flex flex-col gap-1'>
            <div class='text-xs opacity-70'>Your friend code</div>
            <div class='font-semibold tracking-wider'>{generatedFriendCode}</div>
            <label class='text-xs opacity-70 mt-1' for='friend-code-field'>
                Add friend by code
            </label>
            <input id='friend-code-field'
                    class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                            border border-outlineLight dark:border-outlineDark
                            outline-none uppercase'
                    bind:value={friendCodeInput}
                    on:blur={saveFriendInput}
                    placeholder='Enter code'>
        </div>
    </div>
{/if}