<script lang='ts'>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import type {
        FriendRecord,
        FriendVisibility,
        IncomingFriendRequest,
        OutgoingFriendRequest,
    } from '$lib/friends/types';
    import {
        getAccessToken,
        isSupabaseConfigured,
    } from '$lib/supabase';
    import {
        getFriendsSummary,
        removeFriend as removeFriendApi,
        sendFriendRequest,
        updateDefaultVisibility,
        updateFriendRequest,
        updateFriendVisibility,
    } from '$lib/api/friendsClient';

    const authEnabled = isSupabaseConfigured();

    let loading = true;
    let token: string | null = null;

    let emailInput = '';
    let friendCodeInput = '';
    let message: string | null = null;
    let errorMessage: string | null = null;
    let emailFeedback: string | null = null;
    let codeFeedback: string | null = null;

    let sendingEmail = false;
    let sendingCode = false;
    let requestInFlightId: string | null = null;
    let friendUpdateInFlightId: string | null = null;

    let incoming: IncomingFriendRequest[] = [];
    let outgoing: OutgoingFriendRequest[] = [];
    let friends: FriendRecord[] = [];

    let selfFriendCode = '';
    let defaultVisibility: FriendVisibility = 'full';
    let updatingDefaultVisibility = false;

    async function getFreshTokenOrThrow(): Promise<string> {
        const nextToken = await getAccessToken();
        if (!nextToken) {
            throw new Error('Session expired. Please sign in again.');
        }
        token = nextToken;
        return nextToken;
    }

    function toUserFriendlyFriendsError(message: string): string {
        const normalized = message.toLowerCase();
        if (
            normalized.includes('jwt')
            || normalized.includes('expired session')
            || normalized.includes('session expired')
            || normalized.includes('unauthorized')
            || normalized.includes('401')
        ) {
            return 'Your session expired. Please sign in again.';
        }

        if (
            normalized.includes('network')
            || normalized.includes('failed to fetch')
            || normalized.includes('fetch')
        ) {
            return 'Network issue while contacting Friends services. Check your connection and try again.';
        }

        if (normalized.includes('rate') || normalized.includes('429')) {
            return 'Too many requests right now. Please wait a minute before trying again.';
        }

        if (normalized.includes('no user found with that email')) {
            return 'No account was found for that email. Double-check the address and try again.';
        }

        if (normalized.includes('no user found with that friend code')) {
            return 'That friend code was not found. Confirm the code and try again.';
        }

        if (normalized.includes('already pending')) {
            return 'A request is already pending for this person.';
        }

        if (normalized.includes("already friends")) {
            return 'You are already connected with this person.';
        }

        if (normalized.includes('cannot add yourself')) {
            return 'You cannot send a friend request to yourself.';
        }

        if (
            normalized.includes('schema cache') ||
            normalized.includes('could not find the table') ||
            normalized.includes('relation')
        ) {
            return 'Friends database is not initialized yet. Run the Supabase migration for the Friends feature.';
        }

        return message;
    }

    async function loadSummary() {
        if (!token) {
            incoming = [];
            outgoing = [];
            friends = [];
            return;
        }

        const payload = await getFriendsSummary(token);

        incoming = payload.incoming;
        outgoing = payload.outgoing;
        friends = payload.friends;
        selfFriendCode = payload.selfProfile.friendCode;
        defaultVisibility = payload.selfProfile.friendsVisibility;
    }

    async function refreshAll() {
        loading = true;
        message = null;
        errorMessage = null;

        try {
            await getFreshTokenOrThrow();
            await loadSummary();
        } catch (error) {
            errorMessage = toUserFriendlyFriendsError(
                error instanceof Error ? error.message : 'Unable to load friends'
            );
        } finally {
            loading = false;
        }
    }

    async function sendRequest(mode: 'email' | 'code') {
        const value = mode === 'email' ? emailInput : friendCodeInput;
        const trimmed = value.trim();
        emailFeedback = null;
        codeFeedback = null;

        if (trimmed.length === 0) {
            const nextError = mode === 'email'
                ? 'Enter an email before sending an invite.'
                : 'Enter a friend code before sending a request.';
            errorMessage = nextError;
            if (mode === 'email') {
                emailFeedback = nextError;
            } else {
                codeFeedback = nextError;
            }
            return;
        }

        if (mode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            errorMessage = 'Enter a valid email address.';
            emailFeedback = 'Enter a valid email address.';
            return;
        }

        if (mode === 'code' && !/^[A-Z0-9]{6,10}$/.test(trimmed.toUpperCase())) {
            errorMessage = 'Friend codes should be 6-10 letters/numbers.';
            codeFeedback = 'Friend codes should be 6-10 letters/numbers.';
            return;
        }

        if (!token) {
            errorMessage = 'You must be signed in to send friend requests.';
            return;
        }

        errorMessage = null;
        message = null;
        if (mode === 'email') {
            sendingEmail = true;
        } else {
            sendingCode = true;
        }

        try {
            const freshToken = await getFreshTokenOrThrow();
            const payload = await sendFriendRequest(freshToken, {
                mode,
                value: trimmed,
            });

            message = payload.message;
            if (mode === 'email') {
                emailInput = '';
                emailFeedback = 'Invite sent. They will appear in Outgoing until they respond.';
            } else {
                friendCodeInput = '';
                codeFeedback = 'Friend request sent. They will appear in Outgoing until they respond.';
            }
            await loadSummary();
        } catch (error) {
            const friendly = toUserFriendlyFriendsError(
                error instanceof Error ? error.message : 'Unable to send request'
            );
            errorMessage = friendly;
            if (mode === 'email') {
                emailFeedback = friendly;
            } else {
                codeFeedback = friendly;
            }
        } finally {
            sendingEmail = false;
            sendingCode = false;
            try {
                await loadSummary();
            } catch {
                // Keep current UI state if refresh fails.
            }
        }
    }

    async function updateRequest(
        requestId: string,
        action: 'accept' | 'decline' | 'cancel',
    ) {
        if (!token) {
            errorMessage = 'Sign in required';
            return;
        }

        requestInFlightId = requestId;
        message = null;
        errorMessage = null;

        try {
            const freshToken = await getFreshTokenOrThrow();
            const payload = await updateFriendRequest(freshToken, {
                requestId,
                action,
            });

            message = payload.message;
            await loadSummary();
        } catch (error) {
            errorMessage = toUserFriendlyFriendsError(
                error instanceof Error ? error.message : 'Unable to update request'
            );
        } finally {
            requestInFlightId = null;
            try {
                await loadSummary();
            } catch {
                // Keep existing state if refresh fails.
            }
        }
    }

    async function removeFriend(friendId: string) {
        if (!token) {
            errorMessage = 'Sign in required';
            return;
        }

        friendUpdateInFlightId = friendId;
        message = null;
        errorMessage = null;

        try {
            const freshToken = await getFreshTokenOrThrow();
            const payload = await removeFriendApi(freshToken, friendId);

            message = payload.message;
            await loadSummary();
        } catch (error) {
            errorMessage = toUserFriendlyFriendsError(
                error instanceof Error ? error.message : 'Unable to remove friend'
            );
        } finally {
            friendUpdateInFlightId = null;
            try {
                await loadSummary();
            } catch {
                // Keep existing state if refresh fails.
            }
        }
    }

    async function setFriendVisibility(friendId: string, visibility: FriendVisibility) {
        if (!token) {
            errorMessage = 'Sign in required';
            return;
        }

        friendUpdateInFlightId = friendId;
        message = null;
        errorMessage = null;

        try {
            const freshToken = await getFreshTokenOrThrow();
            const payload = await updateFriendVisibility(freshToken, {
                friendId,
                visibility,
            });

            message = payload.message;
            await loadSummary();
        } catch (error) {
            errorMessage = toUserFriendlyFriendsError(
                error instanceof Error ? error.message : 'Unable to update visibility'
            );
        } finally {
            friendUpdateInFlightId = null;
            try {
                await loadSummary();
            } catch {
                // Keep existing state if refresh fails.
            }
        }
    }

    async function setDefaultVisibility(next: FriendVisibility) {
        defaultVisibility = next;
        updatingDefaultVisibility = true;
        message = null;
        errorMessage = null;

        try {
            const freshToken = await getFreshTokenOrThrow();
            const payload = await updateDefaultVisibility(freshToken, next);
            message = payload.message;
        } catch (error) {
            errorMessage = toUserFriendlyFriendsError(
                error instanceof Error ? error.message : 'Unable to update default visibility'
            );
        } finally {
            updatingDefaultVisibility = false;
        }
    }

    function friendLabel(friend: FriendRecord): string {
        return friend.friend.displayName
            ?? friend.friend.email
            ?? friend.friend.friendCode;
    }

    function onDefaultVisibilityChange(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        void setDefaultVisibility(target.value as FriendVisibility);
    }

    function onFriendVisibilityChange(friendId: string, event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        void setFriendVisibility(friendId, target.value as FriendVisibility);
    }

    onMount(() => {
        if (!authEnabled) {
            loading = false;
            errorMessage = 'Supabase auth is not configured. Sign-in is required for Friends.';
            return;
        }

        refreshAll();
    });
</script>

<div class='fixed left-0 right-0 top-[3rem] lg:top-[3.5rem] xl:top-[4rem]
            bottom-0 px-8 py-6 overflow-y-auto text-textLight dark:text-textDark'>
    <div class='max-w-5xl mx-auto flex flex-col gap-4'>
        <h1 class='text-2xl font-semibold'>Friends</h1>

        {#if loading}
            <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3'>
                Loading friends...
            </div>
        {:else}
            <section class='rounded-md border border-outlineLight dark:border-outlineDark p-4'>
                <h2 class='text-lg font-semibold mb-1'>Add friends</h2>
                <p class='text-sm opacity-75 mb-3'>
                    Add friends to view each other’s schedules. They’ll need to accept your request.
                </p>

                <div class='text-xs opacity-70 mb-2'>Your friend code: <span class='font-semibold tracking-wider'>{selfFriendCode}</span></div>
                <a class='inline-flex mb-3 rounded-md px-3 py-1 text-xs border border-outlineLight dark:border-outlineDark
                         hover:bg-hoverLight dark:hover:bg-hoverDark'
                    href={`${base}/settings#privacy`}>
                    Privacy and settings
                </a>

                <div class='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div class='rounded-md border border-divBorderLight dark:border-divBorderDark p-3'>
                        <div class='text-sm font-semibold mb-2'>Add by email</div>
                        <input class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                                    bg-bgLight dark:bg-bgDark px-2 py-1 outline-none mb-2'
                            type='email'
                            bind:value={emailInput}
                            placeholder='friend@umd.edu'>
                        <button class='rounded-md px-3 py-1 text-sm border border-outlineLight dark:border-outlineDark
                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                            disabled={sendingEmail}
                            on:click={() => sendRequest('email')}>
                            {sendingEmail ? 'Sending...' : 'Send invite'}
                        </button>
                        {#if emailFeedback}
                            <div class='text-xs mt-2 opacity-80'>{emailFeedback}</div>
                        {/if}
                    </div>

                    <div class='rounded-md border border-divBorderLight dark:border-divBorderDark p-3'>
                        <div class='text-sm font-semibold mb-2'>Add by friend code</div>
                        <input class='w-full rounded-md border border-outlineLight dark:border-outlineDark
                                    bg-bgLight dark:bg-bgDark px-2 py-1 outline-none mb-2 uppercase'
                            bind:value={friendCodeInput}
                            placeholder='0STN5P9Y'>
                        <button class='rounded-md px-3 py-1 text-sm border border-outlineLight dark:border-outlineDark
                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                            disabled={sendingCode}
                            on:click={() => sendRequest('code')}>
                            {sendingCode ? 'Sending...' : 'Add by code'}
                        </button>
                        {#if codeFeedback}
                            <div class='text-xs mt-2 opacity-80'>{codeFeedback}</div>
                        {/if}
                    </div>
                </div>
            </section>

            <section class='rounded-md border border-outlineLight dark:border-outlineDark p-4'>
                <h2 class='text-lg font-semibold mb-3'>Friend requests</h2>
                <div class='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div>
                        <h3 class='text-sm font-semibold mb-2'>Incoming</h3>
                        {#if incoming.length === 0}
                            <div class='text-sm opacity-70'>No incoming requests</div>
                        {:else}
                            <div class='flex flex-col gap-2'>
                                {#each incoming as request}
                                    <div class='rounded-md border border-divBorderLight dark:border-divBorderDark p-2'>
                                        <div class='text-sm font-semibold'>
                                            {request.from.displayName ?? request.from.email ?? request.from.friendCode}
                                        </div>
                                        <div class='text-xs opacity-70'>{request.from.email ?? 'No email'}</div>
                                        <div class='flex gap-2 mt-2'>
                                            <button class='rounded-md px-2 py-1 text-xs border border-outlineLight dark:border-outlineDark
                                                        hover:bg-hoverLight dark:hover:bg-hoverDark'
                                                disabled={requestInFlightId === request.id}
                                                on:click={() => updateRequest(request.id, 'accept')}>
                                                Accept
                                            </button>
                                            <button class='rounded-md px-2 py-1 text-xs border border-outlineLight dark:border-outlineDark
                                                        hover:bg-hoverLight dark:hover:bg-hoverDark'
                                                disabled={requestInFlightId === request.id}
                                                on:click={() => updateRequest(request.id, 'decline')}>
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div>
                        <h3 class='text-sm font-semibold mb-2'>Outgoing</h3>
                        {#if outgoing.length === 0}
                            <div class='text-sm opacity-70'>No outgoing requests</div>
                        {:else}
                            <div class='flex flex-col gap-2'>
                                {#each outgoing as request}
                                    <div class='rounded-md border border-divBorderLight dark:border-divBorderDark p-2'>
                                        <div class='text-sm font-semibold'>
                                            {request.to.displayName ?? request.to.email ?? request.to.friendCode}
                                        </div>
                                        <div class='text-xs opacity-70'>Pending</div>
                                        <button class='rounded-md px-2 py-1 text-xs border border-outlineLight dark:border-outlineDark
                                                    hover:bg-hoverLight dark:hover:bg-hoverDark mt-2'
                                            disabled={requestInFlightId === request.id}
                                            on:click={() => updateRequest(request.id, 'cancel')}>
                                            Cancel
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </section>

            <section class='rounded-md border border-outlineLight dark:border-outlineDark p-4'>
                <div class='flex items-center justify-between gap-2 flex-wrap mb-3'>
                    <h2 class='text-lg font-semibold'>Your friends</h2>
                    <label class='text-sm flex items-center gap-2'>
                        <span class='opacity-80'>Friends see:</span>
                        <select class='rounded-md px-2 py-1 border border-outlineLight dark:border-outlineDark
                                    bg-bgLight dark:bg-bgDark'
                            disabled={updatingDefaultVisibility}
                            bind:value={defaultVisibility}
                            on:change={onDefaultVisibilityChange}>
                            <option value='full'>Full schedule</option>
                            <option value='busy_free'>Busy/free only</option>
                            <option value='off'>Off</option>
                        </select>
                    </label>
                </div>

                {#if friends.length === 0}
                    <div class='text-sm opacity-70'>No friends yet</div>
                {:else}
                    <div class='flex flex-col gap-2'>
                        {#each friends as friend}
                            <div class='rounded-md border border-divBorderLight dark:border-divBorderDark p-3'>
                                <div class='flex items-center justify-between gap-2 flex-wrap'>
                                    <div>
                                        <div class='text-sm font-semibold'>{friendLabel(friend)}</div>
                                        <div class='text-xs opacity-70'>{friend.friend.email ?? 'No email'}</div>
                                    </div>

                                    <div class='flex items-center gap-2 flex-wrap'>
                                        <select class='rounded-md px-2 py-1 text-xs border border-outlineLight dark:border-outlineDark
                                                    bg-bgLight dark:bg-bgDark'
                                            disabled={friendUpdateInFlightId === friend.friend.id}
                                            bind:value={friend.visibility}
                                            on:change={(event) => onFriendVisibilityChange(friend.friend.id, event)}>
                                            <option value='full'>Full schedule</option>
                                            <option value='busy_free'>Busy/free</option>
                                            <option value='off'>Off</option>
                                        </select>

                                        <a class='rounded-md px-2 py-1 text-xs border border-outlineLight dark:border-outlineDark
                                                hover:bg-hoverLight dark:hover:bg-hoverDark'
                                            href={`${base}/?view=${friend.friend.id}`}>
                                            View schedule
                                        </a>

                                        <button class='rounded-md px-2 py-1 text-xs border border-outlineLight dark:border-outlineDark
                                                    hover:bg-hoverLight dark:hover:bg-hoverDark'
                                            disabled={friendUpdateInFlightId === friend.friend.id}
                                            on:click={() => removeFriend(friend.friend.id)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>

            {#if message}
                <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                    {message}
                </div>
            {/if}

            {#if errorMessage}
                <div class='rounded-md border border-outlineLight dark:border-outlineDark p-3 text-sm'>
                    {errorMessage}
                </div>
            {/if}
        {/if}
    </div>
</div>
