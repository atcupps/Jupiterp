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
    import ProfileOverviewCard from '../../components/profile/ProfileOverviewCard.svelte';
    import { PROFILE_STRINGS } from '$lib/config/profileStrings';
    import {
        ensureUserProfile,
        getAuthUser,
        isSupabaseConfigured,
        loadUserSchedules,
        onAuthStateChanged,
        signInWithApple,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
    } from '$lib/supabase';
    import {
        chooseSchedulesForProfile,
        readSchedulesFromLocalStorage,
        totalTakenCreditsAcrossSchedules,
    } from '$lib/gened/schedules';
    import {
        loadProfileState,
        ProfileStateStore,
        saveProfileStatePatch,
        selectedProgramPathFromState,
    } from '$lib/profile/store';
    import type {
        DegreeType,
        EditableProfileFields,
        ProfilePrivacyLevel,
    } from '$lib/profile/types';

    const authEnabled = isSupabaseConfigured();

    const degreeTypes: DegreeType[] = [
        'Undergraduate',
        'Dual-Degree',
        'Double Major',
        'Masters',
        'P.H.D.',
    ];

    const privacyOptions: Array<{ value: ProfilePrivacyLevel, label: string }> = [
        { value: 'public', label: 'Public' },
        { value: 'friends_only', label: 'Friends only' },
        { value: 'umd_only', label: 'UMD only' },
        { value: 'private', label: 'Private' },
    ];

    let authReady = false;
    let authUserId: string | null = null;
    let userEmail: string | null = null;
    let authEmail = '';
    let authStatusMessage: string | null = null;
    let authErrorMessage: string | null = null;

    let isSubmittingEmail = false;
    let isSubmittingGoogle = false;
    let isSubmittingApple = false;

    let generatedFriendCode = '';
    let totalCreditsTaken = 0;

    let isEditing = false;
    let editError: string | null = null;
    let editMessage: string | null = null;
    let draftDisplayName = '';
    let draftDegreeType: DegreeType = 'Undergraduate';
    let draftMajors = '';
    let draftPrivacy: ProfilePrivacyLevel = 'friends_only';
    let draftGraduationYear = '';

    let profileState = get(ProfileStateStore);
    const unsubscribeProfileState = ProfileStateStore.subscribe((value) => {
        profileState = value;
    });

    function parseMajorsInput(raw: string): string[] {
        return raw
            .split(',')
            .map((major) => major.trim())
            .filter((major) => major.length > 0);
    }

    function profileNameFromData(): string {
        if (profileState.displayName.trim().length > 0) {
            return profileState.displayName.trim();
        }

        if (!userEmail) {
            return 'Student';
        }

        return userEmail
            .split('@')[0]
            .split(/[._-]/)
            .filter((part) => part.length > 0)
            .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
            .join(' ');
    }

    function privacyLabel(value: ProfilePrivacyLevel): string {
        return privacyOptions.find((option) => option.value === value)?.label ?? 'Friends only';
    }

    function getAuthRedirectTo(): string {
        const url = new URL(window.location.href);
        if (url.hostname === '127.0.0.1') {
            url.hostname = 'localhost';
        }

        const profilePath = `${base}/profile`;
        url.pathname = profilePath.startsWith('/') ? profilePath : `/${profilePath}`;
        url.search = '';
        url.hash = '';
        return url.toString();
    }

    function refreshGeneratedFriendCode() {
        if (generatedFriendCode) {
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

    async function recomputeTotalCredits() {
        const localSchedules = readSchedulesFromLocalStorage();
        const cloudSchedules = authUserId ? await loadUserSchedules(authUserId) : null;
        const chosen = chooseSchedulesForProfile(cloudSchedules, localSchedules);
        totalCreditsTaken = totalTakenCreditsAcrossSchedules(chosen);
    }

    async function hydrateProfile() {
        const cloudRow = authUserId ? await ensureUserProfile() : null;
        generatedFriendCode = cloudRow?.friend_code ?? generatedFriendCode;
        await loadProfileState(cloudRow);
        await recomputeTotalCredits();
    }

    function startEditing() {
        editError = null;
        editMessage = null;
        isEditing = true;

        draftDisplayName = profileState.displayName;
        draftDegreeType = profileState.degreeType;
        draftMajors = profileState.majors.join(', ');
        draftPrivacy = profileState.profilePrivacy;
        draftGraduationYear = profileState.graduationYear?.toString() ?? '';
    }

    function cancelEditing() {
        isEditing = false;
        editError = null;
    }

    async function saveEdits() {
        editError = null;
        editMessage = null;

        const graduationYear = draftGraduationYear.trim().length === 0
            ? null
            : Number(draftGraduationYear);

        if (graduationYear !== null && !Number.isInteger(graduationYear)) {
            editError = 'Graduation year must be a valid year.';
            return;
        }

        const patch: Partial<EditableProfileFields> = {
            displayName: draftDisplayName.trim(),
            degreeType: draftDegreeType,
            majors: parseMajorsInput(draftMajors),
            profilePrivacy: draftPrivacy,
            graduationYear,
        };

        const result = await saveProfileStatePatch(patch);
        if (!result.ok) {
            editError = result.message ?? 'Unable to save profile updates.';
            return;
        }

        isEditing = false;
        editMessage = 'Profile updated.';
    }

    async function emailSignIn() {
        if (isSubmittingEmail || isSubmittingGoogle || isSubmittingApple) {
            return;
        }

        authStatusMessage = null;
        authErrorMessage = null;
        const email = authEmail.trim();
        if (email.length === 0) {
            authErrorMessage = 'Enter your email address to continue.';
            return;
        }

        try {
            isSubmittingEmail = true;
            await signInWithEmail(email, getAuthRedirectTo());
            authEmail = '';
            authStatusMessage = 'Check your inbox for a secure sign-in link.';
        } catch (error) {
            console.error('Email sign-in failed:', error);
            authErrorMessage = 'Could not send sign-in email.';
        } finally {
            isSubmittingEmail = false;
        }
    }

    async function appleSignIn() {
        if (isSubmittingApple || isSubmittingEmail || isSubmittingGoogle) {
            return;
        }

        authStatusMessage = null;
        authErrorMessage = null;
        try {
            isSubmittingApple = true;
            await signInWithApple(getAuthRedirectTo());
        } catch (error) {
            console.error('Apple sign-in failed:', error);
            authErrorMessage = 'Could not start Apple sign-in.';
            isSubmittingApple = false;
        }
    }

    async function googleSignIn() {
        if (isSubmittingGoogle || isSubmittingEmail || isSubmittingApple) {
            return;
        }

        authStatusMessage = null;
        authErrorMessage = null;
        try {
            isSubmittingGoogle = true;
            await signInWithGoogle(getAuthRedirectTo());
        } catch (error) {
            console.error('Google sign-in failed:', error);
            authErrorMessage = 'Could not start Google sign-in.';
            isSubmittingGoogle = false;
        }
    }

    async function signOut() {
        authStatusMessage = null;
        authErrorMessage = null;
        try {
            await signOutUser();
            authStatusMessage = 'You have been signed out.';
        } catch (error) {
            console.error('Sign-out failed:', error);
            authErrorMessage = 'Could not sign out right now.';
        }
    }

    onMount(() => {
        refreshGeneratedFriendCode();

        if (!authEnabled) {
            authReady = true;
            void hydrateProfile();
            return () => unsubscribeProfileState();
        }

        const unsubscribeAuth = onAuthStateChanged((user) => {
            authReady = true;
            authUserId = user?.id ?? null;
            userEmail = user?.email ?? null;
            void hydrateProfile();
        });

        getAuthUser().then((user) => {
            authReady = true;
            authUserId = user?.id ?? null;
            userEmail = user?.email ?? null;
            return hydrateProfile();
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProfileState();
        };
    });

    $: majorsLabel = profileState.majors.length > 0 ? profileState.majors.join(', ') : 'Not set';
    $: greetingName = profileNameFromData();
    $: termBlurb = `Degree plan: ${profileState.degreeType} | Path: ${selectedProgramPathFromState(profileState)}`;
</script>

<div class='fixed left-0 right-0 top-[3rem] lg:top-[3.5rem] xl:top-[4rem]
            bottom-0 px-8 py-6 overflow-y-auto text-textLight dark:text-textDark'>
    <div class='max-w-5xl mx-auto flex flex-col gap-4'>
        <h1 class='text-2xl font-semibold'>Profile</h1>

        {#if !authEnabled}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                Supabase auth is not configured. Sign-in and cloud sync features are disabled.
            </div>
        {:else if !authReady}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                Loading profile...
            </div>
        {:else if !userEmail}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 flex flex-col gap-2'>
                <div class='text-xs opacity-70'>Sign in to sync schedules and profile preferences across devices.</div>
                <input class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                             border border-outlineLight dark:border-outlineDark outline-none'
                       type='email'
                       autocomplete='email'
                       placeholder='name@school.edu'
                       bind:value={authEmail}
                       on:keydown={(event) => {
                           if (event.key === 'Enter') {
                               emailSignIn();
                           }
                       }}>
                <div class='flex flex-row gap-2 flex-wrap'>
                    <button class='px-3 py-1 rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark
                                   border border-outlineLight dark:border-outlineDark text-sm'
                            disabled={isSubmittingEmail || isSubmittingGoogle || isSubmittingApple}
                            on:click={emailSignIn}>
                        {isSubmittingEmail ? 'Sending Link...' : 'Continue with Email'}
                    </button>
                    <button class='px-3 py-1 rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark
                                   border border-outlineLight dark:border-outlineDark text-sm'
                            disabled={isSubmittingApple || isSubmittingEmail || isSubmittingGoogle}
                            on:click={appleSignIn}>
                        {isSubmittingApple ? 'Opening Apple...' : 'Continue with Apple'}
                    </button>
                    <button class='px-3 py-1 rounded-md hover:bg-hoverLight dark:hover:bg-hoverDark
                                   border border-outlineLight dark:border-outlineDark text-sm'
                            disabled={isSubmittingGoogle || isSubmittingEmail || isSubmittingApple}
                            on:click={googleSignIn}>
                        {isSubmittingGoogle ? 'Opening Google...' : 'Continue with Google'}
                    </button>
                </div>
            </div>
        {/if}

        {#if authStatusMessage}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                {authStatusMessage}
            </div>
        {/if}

        {#if authErrorMessage}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                {authErrorMessage}
            </div>
        {/if}

        <ProfileOverviewCard
            email={userEmail}
            greetingName={greetingName}
            academicLine={PROFILE_STRINGS.subtitleFallback}
            termBlurb={termBlurb}
            majorsLabel={majorsLabel}
            degreeType={profileState.degreeType}
            friendCode={generatedFriendCode}
            visibility={privacyLabel(profileState.profilePrivacy)}
            graduationYear={profileState.graduationYear}
            totalCreditsTaken={totalCreditsTaken}
            onSignOut={signOut}
            onEdit={startEditing} />

        {#if isEditing}
            <section class='rounded-xl border border-outlineLight dark:border-outlineDark p-4 md:p-5 bg-bgSecondaryLight/60 dark:bg-bgSecondaryDark/60'>
                <h2 class='text-lg font-semibold'>Edit Profile</h2>
                <div class='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>
                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Name</span>
                        <input class='rounded-md border border-outlineLight dark:border-outlineDark bg-bgLight dark:bg-bgDark px-2 py-1 text-sm'
                               bind:value={draftDisplayName}
                               placeholder='Your display name'>
                    </label>

                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Degree type</span>
                        <select class='rounded-md border border-outlineLight dark:border-outlineDark bg-bgLight dark:bg-bgDark px-2 py-1 text-sm'
                                bind:value={draftDegreeType}>
                            {#each degreeTypes as degree}
                                <option value={degree}>{degree}</option>
                            {/each}
                        </select>
                    </label>

                    <label class='flex flex-col gap-1 md:col-span-2'>
                        <span class='text-xs opacity-70'>Major(s)</span>
                        <input class='rounded-md border border-outlineLight dark:border-outlineDark bg-bgLight dark:bg-bgDark px-2 py-1 text-sm'
                               bind:value={draftMajors}
                               placeholder='Computer Science, Mathematics'>
                    </label>

                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Profile privacy</span>
                        <select class='rounded-md border border-outlineLight dark:border-outlineDark bg-bgLight dark:bg-bgDark px-2 py-1 text-sm'
                                bind:value={draftPrivacy}>
                            {#each privacyOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </label>

                    <label class='flex flex-col gap-1'>
                        <span class='text-xs opacity-70'>Graduation year</span>
                        <input class='rounded-md border border-outlineLight dark:border-outlineDark bg-bgLight dark:bg-bgDark px-2 py-1 text-sm'
                               bind:value={draftGraduationYear}
                               placeholder='2028'>
                    </label>
                </div>

                {#if editError}
                    <div class='mt-3 text-sm text-red-500'>{editError}</div>
                {/if}

                <div class='mt-4 flex gap-2'>
                    <button class='rounded-md px-3 py-1 text-sm border border-outlineLight dark:border-outlineDark hover:bg-hoverLight dark:hover:bg-hoverDark'
                            disabled={profileState.syncing}
                            on:click={saveEdits}>
                        {profileState.syncing ? 'Saving...' : 'Save changes'}
                    </button>
                    <button class='rounded-md px-3 py-1 text-sm border border-outlineLight dark:border-outlineDark hover:bg-hoverLight dark:hover:bg-hoverDark'
                            disabled={profileState.syncing}
                            on:click={cancelEditing}>
                        Cancel
                    </button>
                </div>
            </section>
        {/if}

        {#if editMessage}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                {editMessage}
            </div>
        {/if}

        <div class='rounded-xl border border-outlineLight dark:border-outlineDark
                    bg-bgSecondaryLight/60 dark:bg-bgSecondaryDark/60 p-4 md:p-5'>
            <h2 class='text-lg font-semibold'>{PROFILE_STRINGS.connectionsTitle}</h2>
            <p class='text-sm opacity-80 mt-1'>{PROFILE_STRINGS.connectionsDescription}</p>
            <p class='text-xs opacity-70 mt-2'>{PROFILE_STRINGS.funFact}</p>

            <div class='mt-3 flex flex-wrap gap-2'>
                <a class='inline-flex px-3 py-1 rounded-md border border-outlineLight
                         dark:border-outlineDark text-sm hover:bg-hoverLight dark:hover:bg-hoverDark
                         focus:outline-none focus:ring'
                    href={`${base}/friends`}>
                    Open Friends
                </a>
                <a class='inline-flex px-3 py-1 rounded-md border border-outlineLight
                         dark:border-outlineDark text-sm hover:bg-hoverLight dark:hover:bg-hoverDark
                         focus:outline-none focus:ring'
                    href={`${base}/settings#privacy`}>
                    Privacy & Settings
                </a>
            </div>
        </div>
    </div>
</div>
