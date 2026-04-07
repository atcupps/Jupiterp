/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Keyboard shortcuts for the course planner page.
 */

function focusCourseSearchInput() {
	const searchInput = document.getElementById('planner-course-search-input');
	if (!(searchInput instanceof HTMLInputElement)) {
		return;
	}

	searchInput.focus({ preventScroll: true });
}

export function handlePlannerShortcutKeydown(event: KeyboardEvent, isDesktop: boolean) {
	// NOTE: use alt instead of ctrl/cmd to avoid conflicts with assistive technologies and browser shortcuts
	if (event.ctrlKey || event.metaKey) {
		return; // ignore shortcuts if ctrl or cmd is pressed
	}

	// make sure to check if event is coming from an input, textarea, or contenteditable element and ignore it if so (unless it's the course search input)
	const activeElement = document.activeElement;
	const isInputFocused =
		activeElement instanceof HTMLInputElement ||
		activeElement instanceof HTMLTextAreaElement ||
		(activeElement instanceof HTMLElement && activeElement.isContentEditable);

	// use switch statement for better readability and to allow for future expansion of shortcuts
	if (event.key === 'Escape' && !event.altKey && !event.shiftKey) {
		if (activeElement instanceof HTMLElement) {
			activeElement.blur();
		}
	} else if (isInputFocused && !event.altKey && !event.shiftKey) {
		return; // all shortcuts require alt to be pressed, except for escape which is handled above
	} else if (
		event.key.toLowerCase() === '/' &&
		activeElement?.id !== 'planner-course-search-input'
	) {
		event.preventDefault();
		focusCourseSearchInput();
	} else if (!isDesktop) {
		if (event.key === ',') {
			event.preventDefault();
			const scheduleElement = document.getElementById('planner-schedule');
			scheduleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else if (event.key === '.') {
			event.preventDefault();
			const searchResultsElement = document.getElementById('planner-search-results');
			searchResultsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
}
