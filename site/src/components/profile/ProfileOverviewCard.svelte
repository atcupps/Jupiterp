<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
	import { base } from '$app/paths';

	export let email: string | null = null;
	export let greetingName = 'Student';
	export let academicLine = 'UMD student';
	export let termBlurb = '';
	export let majorsLabel = 'Not set';
	export let degreeType = 'Undergraduate';
	export let friendCode = '';
	export let visibility = 'full';
	export let graduationYear: number | null = null;
	export let totalCreditsTaken = 0;
	export let avatarUrl: string | null = null;
	export let avatarColor = '#b90e25';
	export let onSignOut: () => void = () => undefined;
	export let onEdit: () => void = () => undefined;

	let copied = false;

	function initialsFromName(name: string): string {
		const parts = name
			.trim()
			.split(/\s+/)
			.filter((part) => part.length > 0);
		if (parts.length === 0) {
			return 'JP';
		}

		if (parts.length === 1) {
			return parts[0].slice(0, 2).toUpperCase();
		}

		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}

	async function copyFriendCode() {
		if (!friendCode) {
			return;
		}

		try {
			await navigator.clipboard.writeText(friendCode);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1200);
		} catch {
			copied = false;
		}
	}
</script>

<div
	class="rounded-xl border border-outlineLight bg-bgSecondaryLight/70
            p-4 shadow-sm
            md:p-6 dark:border-outlineDark dark:bg-bgSecondaryDark/70"
>
	<button
		class="float-right rounded-md border border-outlineLight px-3 py-1
                    text-sm hover:bg-hoverLight
                    focus:outline-none focus:ring
                    dark:border-outlineDark dark:hover:bg-hoverDark"
		on:click={onSignOut}
	>
		Sign Out
	</button>

	<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
		<div class="flex flex-row items-start gap-4">
			<div class="relative">
				<div
					class="flex h-24 w-24 items-center
                            justify-center overflow-hidden rounded-full
                            border-4 border-white/90 bg-gradient-to-br
                            text-3xl font-semibold text-white shadow-lg dark:border-bgDark"
					style={`background: ${avatarColor};`}
				>
					{#if avatarUrl}
						<img src={avatarUrl} alt="Profile avatar" class="h-full w-full object-cover" />
					{:else}
						{initialsFromName(greetingName)}
					{/if}
				</div>
				<button
					class="absolute -bottom-1 -right-1 h-7 w-7 rounded-full
                                border border-outlineLight bg-bgLight
                                text-xs hover:bg-hoverLight focus:outline-none
                                focus:ring dark:border-outlineDark
                                dark:bg-bgDark dark:hover:bg-hoverDark"
					aria-label="Change avatar"
					title="Edit profile"
					on:click={onEdit}
				>
					Edit
				</button>
			</div>

			<div class="min-w-0">
				<h2 class="break-words text-2xl font-semibold leading-tight md:text-3xl">
					Hi, {greetingName}
				</h2>
				<div class="mt-1 text-xs opacity-70">Signed in as</div>
				<div class="break-all text-sm font-medium md:text-base" title={email ?? ''}>
					{email ?? 'Not signed in'}
				</div>
				<div class="mt-1 text-sm opacity-80">
					{academicLine}
				</div>
				{#if termBlurb}
					<div class="mt-2 text-xs opacity-70">{termBlurb}</div>
				{/if}
				{#if graduationYear}
					<span
						class="mt-2 inline-flex rounded-full border
                                border-outlineLight px-2
                                py-0.5 text-xs dark:border-outlineDark"
					>
						Class of {graduationYear}
					</span>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<h3 class="text-base font-semibold">Quick Profile</h3>
			<div class="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
				<div class="opacity-70">Major(s):</div>
				<div class="break-words">{majorsLabel}</div>

				<div class="opacity-70">Degree Type:</div>
				<div>{degreeType}</div>

				<div class="opacity-70">Friend code:</div>
				<div class="flex items-center gap-2">
					<code class="rounded-md bg-bgLight px-2 py-0.5 dark:bg-bgDark">
						{friendCode || 'N/A'}
					</code>
					<button
						class="rounded-md border border-outlineLight px-2 py-0.5
                                    text-xs hover:bg-hoverLight
                                    focus:outline-none focus:ring
                                    dark:border-outlineDark dark:hover:bg-hoverDark"
						aria-label="Copy friend code"
						on:click={copyFriendCode}
					>
						{copied ? 'Copied' : 'Copy'}
					</button>
				</div>

				<div class="opacity-70">Privacy:</div>
				<div class="flex items-center gap-2">
					<span
						class="inline-flex rounded-full border border-outlineLight px-2
                                 py-0.5 text-xs dark:border-outlineDark"
					>
						Profile visibility: {visibility}
					</span>
					<button
						class="rounded-md px-1 text-xs opacity-70 hover:opacity-100
                                    focus:outline-none focus:ring"
						aria-label="What friends can see"
						title="Determines how much of your schedule details friends can view."
					>
						i
					</button>
				</div>

				<div class="opacity-70">Credits taken:</div>
				<div>{totalCreditsTaken}</div>
			</div>

			<div class="flex flex-wrap gap-2 pt-1">
				<a
					class="rounded-md border border-outlineLight px-3 py-1
                         text-sm hover:bg-hoverLight
                         focus:outline-none focus:ring
                         dark:border-outlineDark dark:hover:bg-hoverDark"
					href={`${base}/major-minor-requirements`}
				>
					Manage Major/Minor Requirements
				</a>
				<a
					class="rounded-md border border-outlineLight px-3 py-1
                         text-sm hover:bg-hoverLight
                         focus:outline-none focus:ring
                         dark:border-outlineDark dark:hover:bg-hoverDark"
					href={`${base}/gen-eds`}
				>
					View Gen Ed Progress
				</a>
			</div>
		</div>
	</div>
</div>
