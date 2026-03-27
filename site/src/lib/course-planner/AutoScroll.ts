/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

import { onMount } from 'svelte';

/**
 *  Initialize: call `setupAutoScrollListener` in `onMount` of `+page.svelte`
 *  Usage: call `shouldEnableAutoScroll()` to check if auto-scroll should be enabled (returns a boolean)
 *  @returns cached boolean of whether auto-scroll should be enabled (recalculated on window resize)
 */
let shouldEnableAutoScrollCacheBoolean: boolean | null = null;
export function shouldEnableAutoScroll(): boolean {
	if (shouldEnableAutoScrollCacheBoolean === null) {
		shouldEnableAutoScrollCacheBoolean =
			typeof window !== 'undefined' && window.innerWidth < 1024 && window.innerHeight > 320;
	}
	return shouldEnableAutoScrollCacheBoolean;
}

export function setupAutoScrollListener() {
	onMount(() => {
		window.addEventListener('resize', () => {
			shouldEnableAutoScrollCacheBoolean = null;
		});
		return () => {
			window.removeEventListener('resize', () => {
				shouldEnableAutoScrollCacheBoolean = null;
			});
		};
	});
}
