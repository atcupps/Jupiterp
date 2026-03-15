<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import AboutContent from '../../components/about/AboutContent.svelte';
	import { JUPITERP_GITHUB_URL, JUPITERP_ISSUE_FORM_URL } from '$lib/config/links';
	import { ensureUserProfile } from '$lib/supabase';
	import { loadProfileState, ProfileStateStore, saveProfileStatePatch } from '$lib/profile/store';
	import type { ProfilePrivacyLevel } from '$lib/profile/types';

	const privacyOptions: Array<{ value: ProfilePrivacyLevel; label: string }> = [
		{ value: 'public', label: 'Public' },
		{ value: 'friends_only', label: 'Friends only' },
		{ value: 'umd_only', label: 'UMD only' },
		{ value: 'private', label: 'Private' }
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
			profilePrivacy: target.value as ProfilePrivacyLevel
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

<div
	class="fixed bottom-0 left-0 right-0 top-[3rem] overflow-y-auto
            px-6 py-6 text-textLight lg:top-[3.5rem] lg:px-8 xl:top-[4rem]
            dark:text-textDark"
>
	<div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
		<h1 class="text-2xl font-semibold">Settings</h1>

		<section
			class="flex flex-col gap-3 rounded-md border border-outlineLight p-4 dark:border-outlineDark"
		>
			<h2 class="text-lg font-semibold">Theme</h2>
			<div class="flex flex-row items-center justify-between gap-3">
				<div>
					<div class="text-sm font-semibold">Appearance</div>
					<div class="text-xs opacity-70">Choose light or dark mode.</div>
				</div>
				<button
					role="switch"
					aria-checked={isDark}
					aria-label="Toggle dark mode"
					class="relative h-7 w-14 rounded-full border border-outlineLight transition-colors
                               focus:outline-none focus:ring dark:border-outlineDark"
					class:bg-hoverDark={isDark}
					class:bg-hoverLight={!isDark}
					on:click={toggleTheme}
					on:keydown={handleSwitchKeydown}
				>
					<span
						class="h-5.5 w-5.5 absolute left-0.5 top-0.5 rounded-full
                                 bg-bgLight transition-transform dark:bg-bgDark"
						class:translate-x-7={isDark}
					></span>
				</button>
			</div>
		</section>

		<section
			id="privacy"
			class="flex flex-col gap-3 rounded-md border border-outlineLight p-4 dark:border-outlineDark"
		>
			<h2 class="text-lg font-semibold">Privacy</h2>
			<p class="text-sm opacity-75">
				This privacy level is shared with your Profile view and updates immediately.
			</p>
			<label class="flex max-w-sm flex-col gap-1">
				<span class="text-xs opacity-70">Who can view your profile details</span>
				<select
					class="rounded-md border border-outlineLight bg-bgLight
                               px-2 py-1 text-sm focus:outline-none focus:ring dark:border-outlineDark dark:bg-bgDark"
					bind:value={profileState.profilePrivacy}
					disabled={profileState.syncing}
					on:change={onPrivacyChanged}
				>
					{#each privacyOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
			{#if privacyMessage}
				<div class="text-sm">{privacyMessage}</div>
			{/if}
			{#if privacyError}
				<div class="text-red-500 text-sm">{privacyError}</div>
			{/if}
		</section>

		<section
			class="flex flex-col gap-3 rounded-md border border-outlineLight p-4 dark:border-outlineDark"
		>
			<h2 class="text-lg font-semibold">Links & Info</h2>
			<div class="flex flex-wrap gap-2">
				<a
					class="rounded-md border border-outlineLight px-3 py-1 text-sm
                           hover:bg-hoverLight dark:border-outlineDark dark:hover:bg-hoverDark"
					href={`${base}/bugs`}
				>
					Report an Issue
				</a>
				<a
					class="rounded-md border border-outlineLight px-3 py-1 text-sm
                           hover:bg-hoverLight dark:border-outlineDark dark:hover:bg-hoverDark"
					href={JUPITERP_GITHUB_URL}
					target="_blank"
				>
					GitHub
				</a>
				<a
					class="rounded-md border border-outlineLight px-3 py-1 text-sm
                           hover:bg-hoverLight dark:border-outlineDark dark:hover:bg-hoverDark"
					href={JUPITERP_ISSUE_FORM_URL}
					target="_blank"
				>
					Open Issue Form
				</a>
				<a
					class="rounded-md border border-outlineLight px-3 py-1 text-sm
                           hover:bg-hoverLight dark:border-outlineDark dark:hover:bg-hoverDark"
					href={`${base}/terms-of-use`}
				>
					Terms of Use
				</a>
				<a
					class="rounded-md border border-outlineLight px-3 py-1 text-sm
                           hover:bg-hoverLight dark:border-outlineDark dark:hover:bg-hoverDark"
					href={`${base}/changelog`}
				>
					Changelog
				</a>
			</div>
			<div class="mt-2 border-t border-divBorderLight pt-3 dark:border-divBorderDark">
				<h3 class="mb-2 text-base font-semibold">About</h3>
				<AboutContent />
			</div>
		</section>
	</div>
</div>
