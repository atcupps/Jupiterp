/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Mobile chain-scroll helper for scrollable planner elements.
 */

import { onMount } from 'svelte';

/**
 * Specifically for src/+page.svelte and its exclusive components found in
 * site/src/components/course-planner/course-search and site/src/components/course-planner/schedule
 */
const ParentSelector = '#planner-container';
const CHAIN_SCROLL_SELECTOR = '.chain-scroll-only';
const LISTENER_OPTIONS = { passive: true, capture: true } as const;

function getUnconsumedDelta(element: HTMLElement, deltaY: number): number {
	const maxScrollTop = element.scrollHeight - element.clientHeight;
	if (maxScrollTop <= 0) {
		return deltaY;
	}

	const start = element.scrollTop;
	const clampedEnd = Math.min(maxScrollTop, Math.max(0, start + deltaY));
	const consumedByElement = clampedEnd - start;
	return deltaY - consumedByElement;
}

function chainScrollTarget(target: EventTarget | null): HTMLElement | null {
	if (!(target instanceof Element)) {
		return null;
	}
	return target.closest<HTMLElement>(CHAIN_SCROLL_SELECTOR);
}

export function setupChainScrollListener() {
	let enableChainScroll: boolean = true;
	let syncChainScrollListener: () => void = () => {};

	onMount(() => {
		let active: HTMLElement | null = null;
		let previousTouchY = 0;
		let attached = false;

		const parent = document.querySelector(ParentSelector) as HTMLElement | null;
		if (!parent) {
			console.warn(
				`Chain scroll listener could not find parent element with selector "${ParentSelector}".`
			);
			return;
		}

		const handleTouchStart = (event: TouchEvent) => {
			if (!enableChainScroll) {
				active = null;
				return;
			}

			if (event.touches.length !== 1) {
				active = null;
				return;
			}
			active = chainScrollTarget(event.target);
			if (active) {
				previousTouchY = event.touches[0].clientY;
			}
		};

		const handleTouchMove = (event: TouchEvent) => {
			if (!enableChainScroll || !active || event.touches.length !== 1) {
				return;
			}

			const currentTouchY = event.touches[0].clientY;
			const deltaY = previousTouchY - currentTouchY;
			previousTouchY = currentTouchY;

			const unconsumedDelta = getUnconsumedDelta(active, deltaY);
			if (Math.abs(unconsumedDelta) > 0.5) {
				parent.scrollTop += unconsumedDelta;
			}
		};

		const handleTouchEnd = () => {
			active = null;
		};

		const handleWheel = (event: WheelEvent) => {
			if (!enableChainScroll) {
				return;
			}

			const target = chainScrollTarget(event.target);
			if (!target) {
				return;
			}

			const unconsumedDelta = getUnconsumedDelta(target, event.deltaY);
			if (Math.abs(unconsumedDelta) > 0.5) {
				parent.scrollTop += unconsumedDelta;
			}
		};

		const addTouchListeners = () => {
			if (attached) {
				return;
			}

			parent.addEventListener('touchstart', handleTouchStart, LISTENER_OPTIONS);
			parent.addEventListener('touchmove', handleTouchMove, LISTENER_OPTIONS);
			parent.addEventListener('touchend', handleTouchEnd, LISTENER_OPTIONS);
			parent.addEventListener('touchcancel', handleTouchEnd, LISTENER_OPTIONS);
			parent.addEventListener('wheel', handleWheel, LISTENER_OPTIONS);
			attached = true;
		};

		const removeTouchListeners = () => {
			if (!attached) {
				return;
			}

			parent.removeEventListener('touchstart', handleTouchStart, { capture: true });
			parent.removeEventListener('touchmove', handleTouchMove, { capture: true });
			parent.removeEventListener('touchend', handleTouchEnd, { capture: true });
			parent.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
			parent.removeEventListener('wheel', handleWheel, { capture: true });
			attached = false;
		};

		syncChainScrollListener = () => {
			if (!enableChainScroll) {
				active = null;
				removeTouchListeners();
				return;
			}

			addTouchListeners();
		};

		syncChainScrollListener();

		return () => {
			removeTouchListeners();
			syncChainScrollListener = () => {};
		};
	});

	return (nextEnableChainScroll: boolean) => {
		enableChainScroll = nextEnableChainScroll;
		syncChainScrollListener();
	};
}
