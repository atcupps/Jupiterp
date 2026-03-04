<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import {
        getAuthUser,
        isSupabaseConfigured,
        onAuthStateChanged,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
    } from '$lib/supabase';

    const authEnabled = isSupabaseConfigured();
    let authReady = false;
    let authUserId: string | null = null;
    let userEmail: string | null = null;
    let authEmail: string = '';
    let authStatusMessage: string | null = null;
    let authErrorMessage: string | null = null;
    let isSubmittingEmail = false;
    let isSubmittingGoogle = false;
    let major: string = '';
    let friendCodeInput: string = '';
    let generatedFriendCode: string = '';

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

    function saveMajor() {
        localStorage.setItem('profileMajor', major.trim());
    }

    function saveFriendInput() {
        localStorage.setItem('profileFriendInput', friendCodeInput.trim());
    }

    async function emailSignIn() {
        if (isSubmittingEmail || isSubmittingGoogle) {
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
            authStatusMessage =
                'Check your inbox for a secure sign-in link.';
        } catch (error) {
            console.error('Email sign-in failed:', error);
            authErrorMessage = 'Could not send sign-in email.';
        } finally {
            isSubmittingEmail = false;
        }
    }

    async function googleSignIn() {
        if (isSubmittingGoogle || isSubmittingEmail) {
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
        major = localStorage.getItem('profileMajor') ?? '';
        friendCodeInput = localStorage.getItem('profileFriendInput') ?? '';
        refreshGeneratedFriendCode();

        if (!authEnabled) {
            authReady = true;
            return;
        }

        const unsubscribe = onAuthStateChanged((user) => {
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

        return () => unsubscribe();
    });
</script>

<div class='fixed left-0 right-0 top-[3rem] lg:top-[3.5rem] xl:top-[4rem]
            bottom-0 px-8 py-6 overflow-y-auto text-textLight
            dark:text-textDark'>
    <div class='max-w-3xl mx-auto flex flex-col gap-4'>
        <h1 class='text-2xl font-semibold'>Profile</h1>

        {#if !authEnabled}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3'>
                Supabase auth is not configured. Add env vars to enable login.
            </div>
        {:else if !authReady}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3'>
                Loading profile...
            </div>
        {:else if userEmail}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3'>
                <div class='text-xs opacity-70'>Signed in as</div>
                <div class='font-semibold truncate' title={userEmail}>{userEmail}</div>
                <button class='mt-3 px-3 py-1 rounded-md hover:bg-hoverLight
                                dark:hover:bg-hoverDark border
                                border-outlineLight dark:border-outlineDark'
                        on:click={signOut}>
                    Sign Out
                </button>
            </div>
        {:else}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark
                        p-3 flex flex-col gap-2'>
                <div class='text-xs opacity-70'>Sign in to sync schedules across devices.</div>
                <input class='bg-bgLight dark:bg-bgDark text-sm rounded px-2 py-1
                                border border-outlineLight dark:border-outlineDark
                                outline-none'
                        type='email'
                        autocomplete='email'
                        placeholder='name@school.edu'
                        bind:value={authEmail}
                        on:keydown={(event) => {
                            if (event.key === 'Enter') {
                                emailSignIn();
                            }
                        }}>
                <div class='flex flex-row gap-2'>
                    <button class='px-3 py-1 rounded-md hover:bg-hoverLight
                                    dark:hover:bg-hoverDark border
                                    border-outlineLight dark:border-outlineDark'
                            disabled={isSubmittingEmail || isSubmittingGoogle}
                            on:click={emailSignIn}>
                        {isSubmittingEmail ? 'Sending Link...' : 'Continue with Email'}
                    </button>
                    <button class='px-3 py-1 rounded-md hover:bg-hoverLight
                                    dark:hover:bg-hoverDark border
                                    border-outlineLight dark:border-outlineDark'
                            disabled={isSubmittingGoogle || isSubmittingEmail}
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

        <div class='rounded-md border border-outlineLight dark:border-outlineDark
                    p-3 flex flex-col gap-1'>
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
                    p-3 flex flex-col gap-1'>
            <div class='text-xs opacity-70'>Your friend code</div>
            <div class='font-semibold tracking-wider'>{generatedFriendCode}</div>
            <label class='text-xs opacity-70 mt-2' for='friend-code-field'>
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
</div>
