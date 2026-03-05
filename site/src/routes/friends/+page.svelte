<script lang='ts'>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import type { PageData } from './$types';
    import type {
        FriendRecord,
        FriendsSummary,
        FriendVisibility,
        IncomingFriendRequest,
        OutgoingFriendRequest,
    } from '$lib/friends/types';
    import {
        ensureUserProfile,
        getAccessToken,
        isSupabaseConfigured,
        updateFriendsVisibility,
    } from '$lib/supabase';

    const authEnabled = isSupabaseConfigured();
    export let data: PageData;

    let loading = true;
    let token: string | null = null;

    let emailInput = '';
    let friendCodeInput = '';
    let message: string | null = null;
    let errorMessage: string | null = null;

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

    function withAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'content-type': 'application/json',
        };

        if (token) {
            headers.authorization = `Bearer ${token}`;
        }

        return headers;
    }

    async function loadSummary() {
        if (!token) {
            incoming = [];
            outgoing = [];
            friends = [];
            return;
        }

        const response = await fetch(`${base}/api/friends/summary`, {
            headers: withAuthHeaders(),
        });

        const payload = await response.json() as FriendsSummary | { error: string };
        if (!response.ok || 'error' in payload) {
            throw new Error('error' in payload ? payload.error : 'Unable to load friends');
        }

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
            token = await getAccessToken();
            if (!token) {
                throw new Error('Sign in to use Friends');
            }
            await ensureUserProfile();
            await loadSummary();
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unable to load friends';
        } finally {
            loading = false;
        }
    }

    async function sendRequest(mode: 'email' | 'code') {
        const value = mode === 'email' ? emailInput : friendCodeInput;
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            errorMessage = mode === 'email'
                ? 'Enter an email first'
                : 'Enter a friend code first';
            return;
        }

        if (!token) {
            errorMessage = 'Sign in required';
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
            const response = await fetch(`${base}/api/friends/requests`, {
                method: 'POST',
                headers: withAuthHeaders(),
                body: JSON.stringify({
                    mode,
                    value: trimmed,
                }),
            });
            const payload = await response.json() as { ok: boolean, message: string };
            if (!response.ok || !payload.ok) {
                errorMessage = payload.message;
                return;
            }

            message = payload.message;
            if (mode === 'email') {
                emailInput = '';
            } else {
                friendCodeInput = '';
            }
            await loadSummary();
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unable to send request';
        } finally {
            sendingEmail = false;
            sendingCode = false;
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
            const response = await fetch(`${base}/api/friends/requests/${requestId}`, {
                method: 'POST',
                headers: withAuthHeaders(),
                body: JSON.stringify({ action }),
            });
            const payload = await response.json() as { ok: boolean, message: string };
            if (!response.ok || !payload.ok) {
                errorMessage = payload.message;
                return;
            }

            message = payload.message;
            await loadSummary();
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unable to update request';
        } finally {
            requestInFlightId = null;
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
            const response = await fetch(`${base}/api/friends/${friendId}`, {
                method: 'DELETE',
                headers: withAuthHeaders(),
            });
            const payload = await response.json() as { ok: boolean, message: string };
            if (!response.ok || !payload.ok) {
                errorMessage = payload.message;
                return;
            }

            message = payload.message;
            await loadSummary();
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unable to remove friend';
        } finally {
            friendUpdateInFlightId = null;
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
            const response = await fetch(`${base}/api/friends/${friendId}`, {
                method: 'PATCH',
                headers: withAuthHeaders(),
                body: JSON.stringify({ visibility }),
            });
            const payload = await response.json() as { ok: boolean, message: string };
            if (!response.ok || !payload.ok) {
                errorMessage = payload.message;
                return;
            }

            message = payload.message;
            await loadSummary();
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unable to update visibility';
        } finally {
            friendUpdateInFlightId = null;
        }
    }

    async function setDefaultVisibility(next: FriendVisibility) {
        defaultVisibility = next;
        updatingDefaultVisibility = true;
        message = null;
        errorMessage = null;

        try {
            await updateFriendsVisibility(next);
            message = 'Default visibility updated';
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unable to update default visibility';
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
            errorMessage = 'Supabase auth is not configured';
            return;
        }

        if (data.initialSummary) {
            incoming = data.initialSummary.incoming;
            outgoing = data.initialSummary.outgoing;
            friends = data.initialSummary.friends;
            selfFriendCode = data.initialSummary.selfProfile.friendCode;
            defaultVisibility = data.initialSummary.selfProfile.friendsVisibility;
            loading = false;
        }

        if (data.initialError) {
            errorMessage = data.initialError;
            loading = false;
        }

        if (!data.initialSummary) {
            refreshAll();
        }
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
