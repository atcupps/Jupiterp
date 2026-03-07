<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang='ts'>
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';
    import { UMD_MAJORS, UMD_MINORS } from '$lib/data/umdPrograms';
    import { ensureUserProfile } from '$lib/supabase';
    import {
        loadProfileState,
        ProfileStateStore,
        saveProfileStatePatch,
        selectedProgramPathFromState,
    } from '$lib/profile/store';
    import type { DegreeType } from '$lib/profile/types';

    const degreeTypes: DegreeType[] = [
        'Undergraduate',
        'Dual-Degree',
        'Double Major',
        'Masters',
        'P.H.D.',
    ];

    let profileState = get(ProfileStateStore);
    const unsubscribeProfileState = ProfileStateStore.subscribe((value) => {
        profileState = value;
    });

    let degreeType: DegreeType = 'Undergraduate';
    let selectedMajor = '';
    let selectedProgram = '';
    let selectedMajors: string[] = [];

    let minorQuery = '';
    let minorsOpen = false;
    let selectedMinors: string[] = [];
    let selectingTwoMajors = true;

    let saveMessage: string | null = null;
    let saveError: string | null = null;
    let userHasTouchedForm = false;

    $: requiresTwoMajors = degreeType === 'Dual-Degree' || degreeType === 'Double Major';

    $: filteredMinors = UMD_MINORS.filter((minor) => {
        const match = minor.toLowerCase().includes(minorQuery.toLowerCase());
        return match && !selectedMinors.includes(minor);
    });

    $: if (profileState.loaded && !userHasTouchedForm) {
        syncLocalFromStore();
    }

    function syncLocalFromStore() {
        degreeType = profileState.degreeType;
        selectedMinors = profileState.minors;

        if (degreeType === 'Undergraduate') {
            selectedMajor = profileState.majors[0] ?? '';
        } else if (requiresTwoMajors) {
            selectedMajors = profileState.majors.slice(0, 2);
            selectingTwoMajors = selectedMajors.length < 2;
        } else {
            selectedProgram = profileState.majors[0] ?? '';
        }
    }

    async function persistCurrentSelection() {
        userHasTouchedForm = true;
        saveMessage = null;
        saveError = null;

        let majors: string[] = [];
        if (degreeType === 'Undergraduate') {
            majors = selectedMajor ? [selectedMajor] : [];
        } else if (requiresTwoMajors) {
            majors = selectedMajors.slice(0, 2);
        } else {
            majors = selectedProgram ? [selectedProgram] : [];
        }

        const result = await saveProfileStatePatch({
            degreeType,
            majors,
            minors: selectedMinors,
        });

        if (!result.ok) {
            saveError = result.message ?? 'Unable to save profile preferences.';
            return;
        }

        saveMessage = 'Saved.';
    }

    function toggleMajorSelection(major: string) {
        userHasTouchedForm = true;
        if (selectedMajors.includes(major)) {
            selectedMajors = selectedMajors.filter((value) => value !== major);
            return;
        }

        if (selectedMajors.length >= 2) {
            selectedMajors = [selectedMajors[1], major];
            return;
        }

        selectedMajors = [...selectedMajors, major];
    }

    async function onDoneSelectingMajors() {
        if (selectedMajors.length < 2) {
            saveError = 'Choose two programs before continuing.';
            return;
        }

        selectingTwoMajors = false;
        await persistCurrentSelection();
    }

    function onEditTwoMajors() {
        selectingTwoMajors = true;
        saveError = null;
    }

    async function onDegreeTypeChange(next: DegreeType) {
        userHasTouchedForm = true;
        degreeType = next;
        saveError = null;

        if (requiresTwoMajors) {
            selectedMajors = profileState.majors.slice(0, 2);
            selectingTwoMajors = selectedMajors.length < 2;
        }

        if (!requiresTwoMajors) {
            selectingTwoMajors = false;
        }

        await persistCurrentSelection();
    }

    function onDegreeTypeSelect(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        void onDegreeTypeChange(target.value as DegreeType);
    }

    function onUndergraduateMajorSelect(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        selectedMajor = target.value;
        void persistCurrentSelection();
    }

    function onProgramSelect(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        selectedProgram = target.value;
        void persistCurrentSelection();
    }

    function addMinor(minor: string) {
        userHasTouchedForm = true;
        if (selectedMinors.includes(minor)) {
            return;
        }

        selectedMinors = [...selectedMinors, minor];
        minorQuery = '';
        minorsOpen = false;
        void persistCurrentSelection();
    }

    function removeMinor(minor: string) {
        userHasTouchedForm = true;
        selectedMinors = selectedMinors.filter((value) => value !== minor);
        void persistCurrentSelection();
    }

    function selectedProgramPath(): string {
        return selectedProgramPathFromState({
            displayName: profileState.displayName,
            degreeType,
            majors: degreeType === 'Undergraduate'
                ? (selectedMajor ? [selectedMajor] : [])
                : requiresTwoMajors
                    ? selectedMajors
                    : (selectedProgram ? [selectedProgram] : []),
            minors: selectedMinors,
            graduationYear: profileState.graduationYear,
            profilePrivacy: profileState.profilePrivacy,
        });
    }

    onMount(() => {
        void (async () => {
            try {
                const row = await ensureUserProfile();
                await loadProfileState(row);
            } catch {
                await loadProfileState(null);
            }
        })();

        syncLocalFromStore();
        return () => unsubscribeProfileState();
    });
</script>

<div class='fixed left-0 right-0 top-[3rem] lg:top-[3.5rem] xl:top-[4rem]
            bottom-0 px-6 lg:px-8 py-6 overflow-y-auto text-textLight
            dark:text-textDark'>
    <div class='w-full max-w-6xl mx-auto flex flex-col gap-4'>
        <h1 class='text-2xl font-semibold'>Major & Minor Requirements</h1>

        <section class='rounded-md border border-outlineLight dark:border-outlineDark p-4 flex flex-col gap-4'>
            <div class='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <label class='flex flex-col gap-1'>
                    <span class='text-xs opacity-70'>Degree Type</span>
                    <select class='rounded-md border border-outlineLight dark:border-outlineDark
                                   bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                            bind:value={degreeType}
                            on:change={onDegreeTypeSelect}>
                        {#each degreeTypes as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </select>
                </label>

                {#if degreeType === 'Undergraduate'}
                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Major</span>
                        <select class='rounded-md border border-outlineLight dark:border-outlineDark
                                       bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                                bind:value={selectedMajor}
                            on:change={onUndergraduateMajorSelect}>
                            <option value=''>Select a major</option>
                            {#each UMD_MAJORS as major}
                                <option value={major}>{major}</option>
                            {/each}
                        </select>
                    </label>
                {:else if requiresTwoMajors}
                    <div class='flex flex-col gap-2 lg:col-span-2'>
                        <span class='text-xs opacity-70'>Programs</span>
                        {#if selectingTwoMajors}
                            <div class='max-h-44 overflow-y-auto rounded-md border border-outlineLight dark:border-outlineDark p-2'>
                                {#each UMD_MAJORS as major}
                                    <label class='flex items-center gap-2 py-0.5 text-sm'>
                                        <input type='checkbox'
                                               class='rounded border-outlineLight dark:border-outlineDark'
                                               checked={selectedMajors.includes(major)}
                                               on:change={() => { toggleMajorSelection(major); }}>
                                        <span>{major}</span>
                                    </label>
                                {/each}
                            </div>
                            <div class='text-xs opacity-70'>Selected: {selectedMajors.length} / 2</div>
                            <div class='flex gap-2'>
                                <button class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark text-sm hover:bg-hoverLight dark:hover:bg-hoverDark'
                                        disabled={selectedMajors.length < 2 || profileState.syncing}
                                        on:click={onDoneSelectingMajors}>
                                    {profileState.syncing ? 'Saving...' : 'Done'}
                                </button>
                            </div>
                        {:else}
                            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3'>
                                <div class='text-sm'>
                                    {selectedMajors.join(', ') || 'None selected'}
                                </div>
                                <button class='mt-2 px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark text-sm hover:bg-hoverLight dark:hover:bg-hoverDark'
                                        on:click={onEditTwoMajors}>
                                    Edit
                                </button>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Program</span>
                        <select class='rounded-md border border-outlineLight dark:border-outlineDark
                                       bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                                bind:value={selectedProgram}
                            on:change={onProgramSelect}>
                            <option value=''>Select a program</option>
                            {#each UMD_MAJORS as program}
                                <option value={program}>{program}</option>
                            {/each}
                        </select>
                    </label>
                {/if}
            </div>

            <div class='flex flex-col gap-2 relative'>
                <span class='text-xs opacity-70'>Minors</span>
                <div class='flex flex-wrap gap-2'>
                    {#if selectedMinors.length === 0}
                        <span class='text-xs opacity-70'>None</span>
                    {/if}

                    {#each selectedMinors as minor}
                        <span class='inline-flex items-center gap-2 rounded-full border border-outlineLight dark:border-outlineDark px-3 py-1 text-xs'>
                            {minor}
                            <button class='text-sm leading-none hover:text-orange focus:outline-none focus:ring rounded-sm'
                                    aria-label={`Remove ${minor}`}
                                    on:click={() => { removeMinor(minor); }}>
                                x
                            </button>
                        </span>
                    {/each}
                </div>

                <div class='flex flex-row gap-2'>
                    <input class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                                   bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                           type='text'
                           placeholder='Search and add a minor'
                           bind:value={minorQuery}
                           on:focus={() => { minorsOpen = true; }}>
                    <button class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
                                   hover:bg-hoverLight dark:hover:bg-hoverDark text-sm'
                            on:click={() => { minorsOpen = !minorsOpen; }}>
                        {minorsOpen ? 'Hide' : 'Browse'}
                    </button>
                </div>

                {#if minorsOpen}
                    <div class='max-h-52 overflow-y-auto rounded-md border border-outlineLight
                                dark:border-outlineDark bg-bgLight dark:bg-bgDark shadow-lg'>
                        {#if filteredMinors.length === 0}
                            <div class='px-2 py-2 text-xs opacity-70'>No minors found.</div>
                        {/if}
                        {#each filteredMinors as minor}
                            <button class='w-full text-left px-2 py-1 text-sm hover:bg-hoverLight dark:hover:bg-hoverDark'
                                    on:click={() => { addMinor(minor); }}>
                                {minor}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </section>

        {#if saveError}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                {saveError}
            </div>
        {/if}

        {#if saveMessage}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                {saveMessage}
            </div>
        {/if}

        <section class='grid grid-cols-1 xl:grid-cols-2 gap-4'>
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-4'>
                <h2 class='text-lg font-semibold'>Major Requirements</h2>
                <p class='text-sm opacity-80 mt-2'>
                    Selected program path: {selectedProgramPath()}
                </p>
                <p class='text-sm opacity-70 mt-2'>
                    Requirement mapping for the selected degree structure will appear here.
                </p>
            </div>

            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-4'>
                <h2 class='text-lg font-semibold'>Minor Requirements</h2>
                <p class='text-sm opacity-80 mt-2'>
                    {#if selectedMinors.length > 0}
                        Selected minors: {selectedMinors.join(', ')}
                    {:else}
                        Selected minors: None
                    {/if}
                </p>
                <p class='text-sm opacity-70 mt-2'>
                    Requirement detail cards for selected minors will appear here.
                </p>
            </div>
        </section>
    </div>
</div>
