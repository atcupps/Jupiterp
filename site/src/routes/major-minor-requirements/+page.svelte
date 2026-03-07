<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang='ts'>
    import { onMount } from 'svelte';
    import {
        readProfilePreferencesFromLocalStorage,
        saveProfilePreferencesToLocalStorage,
    } from '$lib/profile/preferences';
    import {
        DEFAULT_DEGREE_TYPE,
        type DegreeType,
        type ProfilePreferences,
    } from '$lib/profile/types';
    import { getProfilePreferences, updateProfilePreferences } from '$lib/supabase';
    import { UMD_MAJORS, UMD_MINORS } from '$lib/data/umdPrograms';

    const degreeTypes: DegreeType[] = [
        'Undergraduate',
        'Dual-Degree',
        'Double Major',
        'Masters',
        'P.H.D.',
    ];

    let degreeType: DegreeType = DEFAULT_DEGREE_TYPE;
    let selectedMajor = UMD_MAJORS[0] ?? '';
    let selectedProgram = UMD_MAJORS[0] ?? '';
    let selectedMajors: string[] = [];

    let minorQuery = '';
    let minorsOpen = false;
    let selectedMinors: string[] = [];
    let initialized = false;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    $: requiresTwoMajors =
        degreeType === 'Dual-Degree' || degreeType === 'Double Major';

    $: if (requiresTwoMajors && selectedMajors.length < 2) {
        selectedMajors = UMD_MAJORS.slice(0, 2);
    }

    $: if (!requiresTwoMajors && selectedMajors.length > 0) {
        selectedMajors = [];
    }

    $: filteredMinors = UMD_MINORS.filter((minor) => {
        const match = minor.toLowerCase().includes(minorQuery.toLowerCase());
        return match && !selectedMinors.includes(minor);
    });

    function toggleMajorSelection(major: string) {
        if (selectedMajors.includes(major)) {
            if (selectedMajors.length <= 2) {
                return;
            }
            selectedMajors = selectedMajors.filter((value) => value !== major);
            return;
        }

        if (selectedMajors.length >= 2) {
            // Keep the selection capped at two but allow users to swap majors.
            selectedMajors = [selectedMajors[1], major];
            return;
        }

        selectedMajors = [...selectedMajors, major];
    }

    function addMinor(minor: string) {
        if (selectedMinors.includes(minor)) {
            return;
        }

        selectedMinors = [...selectedMinors, minor];
        minorQuery = '';
        minorsOpen = false;
    }

    function removeMinor(minor: string) {
        selectedMinors = selectedMinors.filter((value) => value !== minor);
    }

    function selectedProgramsText(): string {
        if (degreeType === 'Undergraduate') {
            return selectedMajor;
        }

        if (requiresTwoMajors) {
            return selectedMajors.join(', ');
        }

        return selectedProgram;
    }

    function currentMajorsForPreferences(): string[] {
        if (degreeType === 'Undergraduate') {
            return selectedMajor ? [selectedMajor] : [];
        }

        if (requiresTwoMajors) {
            return selectedMajors;
        }

        return selectedProgram ? [selectedProgram] : [];
    }

    async function savePreferences() {
        const preferences: ProfilePreferences = {
            degreeType,
            majors: currentMajorsForPreferences(),
            minors: selectedMinors,
            graduationYear: null,
        };

        saveProfilePreferencesToLocalStorage(preferences);

        try {
            await updateProfilePreferences(preferences);
        } catch {
            // Signed-out users and transient API errors should still keep local data.
        }
    }

    $: if (initialized) {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            void savePreferences();
        }, 250);
    }

    onMount(async () => {
        const local = readProfilePreferencesFromLocalStorage();
        degreeType = local.degreeType;
        selectedMinors = local.minors;

        if (degreeType === 'Undergraduate') {
            selectedMajor = local.majors[0] ?? (UMD_MAJORS[0] ?? '');
        } else if (degreeType === 'Dual-Degree' || degreeType === 'Double Major') {
            selectedMajors = local.majors.length >= 2
                ? local.majors.slice(0, 2)
                : UMD_MAJORS.slice(0, 2);
        } else {
            selectedProgram = local.majors[0] ?? (UMD_MAJORS[0] ?? '');
        }

        try {
            const cloud = await getProfilePreferences();
            if (cloud) {
                degreeType = cloud.degreeType;
                selectedMinors = cloud.minors;

                if (degreeType === 'Undergraduate') {
                    selectedMajor = cloud.majors[0] ?? selectedMajor;
                } else if (degreeType === 'Dual-Degree' || degreeType === 'Double Major') {
                    selectedMajors = cloud.majors.length >= 2
                        ? cloud.majors.slice(0, 2)
                        : selectedMajors;
                } else {
                    selectedProgram = cloud.majors[0] ?? selectedProgram;
                }
            }
        } catch {
            // Keep local values when cloud fetch is unavailable.
        }

        initialized = true;
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
                    <select
                        class='rounded-md border border-outlineLight dark:border-outlineDark
                               bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                        bind:value={degreeType}>
                        {#each degreeTypes as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </select>
                </label>

                {#if degreeType === 'Undergraduate'}
                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Major</span>
                        <select
                            class='rounded-md border border-outlineLight dark:border-outlineDark
                                   bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                            bind:value={selectedMajor}>
                            {#each UMD_MAJORS as major}
                                <option value={major}>{major}</option>
                            {/each}
                        </select>
                    </label>
                {:else if requiresTwoMajors}
                    <div class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Majors (select at least 2)</span>
                        <div class='max-h-44 overflow-y-auto rounded-md border border-outlineLight dark:border-outlineDark p-2'>
                            {#each UMD_MAJORS as major}
                                <label class='flex items-center gap-2 py-0.5 text-sm'>
                                    <input
                                        type='checkbox'
                                        class='rounded border-outlineLight dark:border-outlineDark'
                                        checked={selectedMajors.includes(major)}
                                        on:change={() => { toggleMajorSelection(major); }} />
                                    <span>{major}</span>
                                </label>
                            {/each}
                        </div>
                        <div class='text-xs opacity-70'>
                            Selected: {selectedMajors.length} {selectedMajors.length === 1 ? 'major' : 'majors'}
                        </div>
                    </div>
                {:else}
                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Program</span>
                        <select
                            class='rounded-md border border-outlineLight dark:border-outlineDark
                                   bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                            bind:value={selectedProgram}>
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
                            <button
                                class='text-sm leading-none hover:text-orange focus:outline-none focus:ring rounded-sm'
                                aria-label={`Remove ${minor}`}
                                on:click={() => { removeMinor(minor); }}>
                                x
                            </button>
                        </span>
                    {/each}
                </div>

                <div class='flex flex-row gap-2'>
                    <input
                        class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                               bg-bgLight dark:bg-bgDark px-2 py-1 text-sm focus:outline-none focus:ring'
                        type='text'
                        placeholder='Search and add a minor'
                        bind:value={minorQuery}
                        on:focus={() => { minorsOpen = true; }} />
                    <button
                        class='px-3 py-1 rounded-md border border-outlineLight dark:border-outlineDark
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
                            <button
                                class='w-full text-left px-2 py-1 text-sm hover:bg-hoverLight dark:hover:bg-hoverDark'
                                on:click={() => { addMinor(minor); }}>
                                {minor}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </section>

        <section class='grid grid-cols-1 xl:grid-cols-2 gap-4'>
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-4'>
                <h2 class='text-lg font-semibold'>Major Requirements</h2>
                <p class='text-sm opacity-80 mt-2'>
                    Selected program path: {selectedProgramsText() || 'None selected'}
                </p>
                <p class='text-sm opacity-70 mt-2'>
                    Requirement mapping for the selected degree structure will appear here.
                    This panel is wired to update as degree type and major/program
                    selections change.
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
