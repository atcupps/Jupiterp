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
const PARENT_SCROLL_SMOOTHING = 0.6;
const MIN_SCROLL_DELTA = 0.5;
const MIN_PENDING_DELTA = 0.2;

function getConsumedDelta(element: HTMLElement, deltaY: number): number {
	const maxScrollTop = element.scrollHeight - element.clientHeight;
	if (maxScrollTop <= 0) {
		return 0;
	}

	const start = element.scrollTop;
	const clampedEnd = Math.min(maxScrollTop, Math.max(0, start + deltaY));
	return clampedEnd - start;
}

function getUnconsumedDelta(element: HTMLElement, deltaY: number): number {
	const consumedByElement = getConsumedDelta(element, deltaY);
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
		let pendingParentDelta = 0;
		let parentAnimationFrame: number | null = null;

		const parent = document.querySelector(ParentSelector) as HTMLElement | null;
		if (!parent) {
			console.warn(
				`Chain scroll listener could not find parent element with selector "${ParentSelector}".`
			);
			return;
		}

		const stopParentAnimation = () => {
			pendingParentDelta = 0;
			if (parentAnimationFrame !== null) {
				window.cancelAnimationFrame(parentAnimationFrame);
				parentAnimationFrame = null;
			}
		};

		const runParentScrollFrame = () => {
			parentAnimationFrame = null;

			if (Math.abs(pendingParentDelta) < MIN_PENDING_DELTA) {
				pendingParentDelta = 0;
				return;
			}

			const frameDelta = pendingParentDelta * PARENT_SCROLL_SMOOTHING;
			const consumedByParent = getConsumedDelta(parent, frameDelta);

			if (Math.abs(consumedByParent) < MIN_PENDING_DELTA) {
				pendingParentDelta = 0;
				return;
			}

			parent.scrollTop += consumedByParent;
			pendingParentDelta -= consumedByParent;

			if (Math.abs(pendingParentDelta) >= MIN_PENDING_DELTA) {
				parentAnimationFrame = window.requestAnimationFrame(runParentScrollFrame);
			}
		};

		const queueParentScroll = (deltaY: number) => {
			if (Math.abs(deltaY) < MIN_SCROLL_DELTA) {
				return;
			}

			pendingParentDelta += deltaY;
			if (parentAnimationFrame === null) {
				parentAnimationFrame = window.requestAnimationFrame(runParentScrollFrame);
			}
		};

		const handleTouchStart = (event: TouchEvent) => {
			if (!enableChainScroll) {
				active = null;
				stopParentAnimation();
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
			if (Math.abs(unconsumedDelta) > MIN_SCROLL_DELTA) {
				queueParentScroll(unconsumedDelta);
			}
		};

		const handleTouchEnd = () => {
			active = null;
		};

		const addTouchListeners = () => {
			if (attached) {
				return;
			}

			parent.addEventListener('touchstart', handleTouchStart, LISTENER_OPTIONS);
			parent.addEventListener('touchmove', handleTouchMove, LISTENER_OPTIONS);
			parent.addEventListener('touchend', handleTouchEnd, LISTENER_OPTIONS);
			parent.addEventListener('touchcancel', handleTouchEnd, LISTENER_OPTIONS);
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
			attached = false;
		};

		syncChainScrollListener = () => {
			if (!enableChainScroll) {
				active = null;
				stopParentAnimation();
				removeTouchListeners();
				return;
			}

			addTouchListeners();
		};

		syncChainScrollListener();

		return () => {
			stopParentAnimation();
			removeTouchListeners();
			syncChainScrollListener = () => {};
		};
	});

	return (nextEnableChainScroll: boolean) => {
		enableChainScroll = nextEnableChainScroll;
		syncChainScrollListener();
	};
}
