/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Window-size helpers for course planner behaviors.
 */

import { onMount } from 'svelte';

/**
 * Initialize by calling `setupisDesktopCheckListener` in `+page.svelte`.
 * Usage: call `isDesktopCheck()` to check if desktop behaviors should be enabled.
 * @returns cached boolean indicating if the window is currently considered "desktop" size (1024px or wider & 320px or taller).
 */
let isDesktopCheckCacheBoolean: boolean | null = null;

export function isDesktopCheck(): boolean {
	return typeof isDesktopCheckCacheBoolean === 'boolean' ? isDesktopCheckCacheBoolean : false;
}

export function setupisDesktopCheckListener() {
	onMount(() => {
		const handleResize = () => {
			isDesktopCheckCacheBoolean = window.innerWidth >= 1024 && window.innerHeight > 320;
		};

		handleResize();

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
}
