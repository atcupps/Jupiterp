<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import ProfileOverviewCard from '$components/profile/ProfileOverviewCard.svelte';
    import { PROFILE_STRINGS } from '$lib/config/profileStrings';
    import {
        ensureUserProfile,
        getAuthUser,
        getProfilePreferences,
        isSupabaseConfigured,
        loadUserSchedules,
        onAuthStateChanged,
        signInWithEmail,
        signInWithApple,
        signInWithGoogle,
        signOutUser,
    } from '$lib/supabase';
    import {
        chooseSchedulesForProfile,
        readSchedulesFromLocalStorage,
        totalTakenCreditsAcrossSchedules,
    } from '$lib/gened/schedules';
    import {
        readProfilePreferencesFromLocalStorage,
    } from '$lib/profile/preferences';
    import type { FriendVisibility } from '$lib/friends/types';
    import type { DegreeType, ProfilePreferences } from '$lib/profile/types';

    const authEnabled = isSupabaseConfigured();
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
    let friendsVisibility: FriendVisibility = 'full';

    let degreeType: DegreeType = 'Undergraduate';
    let majors: string[] = [];
    let graduationYear: number | null = null;

    let totalCreditsTaken = 0;

    function visibilityLabel(value: FriendVisibility): string {
        if (value === 'busy_free') {
            return 'busy/free';
        }

        return value;
    }

    function profileNameFromEmail(email: string | null): string {
        if (!email) {
            return 'Student';
        }

        return email.split('@')[0]
            .split(/[._-]/)
            .filter((part) => part.length > 0)
            .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
            .join(' ');
    }

    function majorsLabelFromList(values: string[]): string {
        if (values.length === 0) {
            return 'Not set';
        }

        return values.join(', ');
    }

    function getAuthRedirectTo(): string {
        const url = new URL(window.location.href);
        if (url.hostname === '127.0.0.1') {
            url.hostname = 'localhost';
        }
        const profilePath = `${base}/profile`;
        url.pathname = profilePath.startsWith('/')
            ? profilePath
            : `/${profilePath}`;
        url.search = '';
        url.hash = '';
        return url.toString();
    }

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

    function applyPreferences(preferences: ProfilePreferences) {
        degreeType = preferences.degreeType;
        majors = preferences.majors;
        graduationYear = preferences.graduationYear;
    }

    async function recomputeTotalCredits() {
        const localSchedules = readSchedulesFromLocalStorage();
        const cloudSchedules = authUserId ? await loadUserSchedules(authUserId) : null;
        const chosen = chooseSchedulesForProfile(cloudSchedules, localSchedules);
        totalCreditsTaken = totalTakenCreditsAcrossSchedules(chosen);
    }

    async function loadProfileData() {
        const localPreferences = readProfilePreferencesFromLocalStorage();
        applyPreferences(localPreferences);

        if (!authEnabled || !authUserId) {
            await recomputeTotalCredits();
            return;
        }

        try {
            const profile = await ensureUserProfile();
            if (profile) {
                generatedFriendCode = profile.friend_code;
                friendsVisibility = profile.friends_visibility;
            }
        } catch (error) {
            console.error('Unable to load profile from Supabase:', error);
        }

        try {
            const cloudPreferences = await getProfilePreferences();
            if (cloudPreferences) {
                applyPreferences(cloudPreferences);
            }
        } catch {
            // Keep local preferences if cloud preferences cannot be loaded.
        }

        await recomputeTotalCredits();
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

    $: majorsLabel = majorsLabelFromList(majors);
    $: greetingName = profileNameFromEmail(userEmail);
    $: termBlurb = `Degree plan: ${degreeType}`;

    onMount(() => {
        refreshGeneratedFriendCode();

        if (!authEnabled) {
            authReady = true;
            void loadProfileData();
            return;
        }

        const unsubscribe = onAuthStateChanged((user) => {
            authReady = true;
            authUserId = user?.id ?? null;
            userEmail = user?.email ?? null;
            refreshGeneratedFriendCode();
            void loadProfileData();
        });

        getAuthUser().then((user) => {
            authReady = true;
            authUserId = user?.id ?? null;
            userEmail = user?.email ?? null;
            refreshGeneratedFriendCode();
            return loadProfileData();
        });

        return () => unsubscribe();
    });
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
            <div class='rounded-md border border-outlineLight dark:border-outlineDark
                        p-3 flex flex-col gap-2'>
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
                <div class='text-[11px] opacity-70'>By signing in, you agree to use secure authentication via Supabase.</div>
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
            degreeType={degreeType}
            friendCode={generatedFriendCode}
            visibility={visibilityLabel(friendsVisibility)}
            graduationYear={graduationYear}
            totalCreditsTaken={totalCreditsTaken}
            onSignOut={signOut} />

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
                    href={`${base}/settings`}>
                    Privacy & Settings
                </a>
            </div>
        </div>
    </div>
</div>
