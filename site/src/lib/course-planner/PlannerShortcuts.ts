/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Keyboard shortcuts for the course planner page.
 */

function focusCourseSearchInput() {
	const searchInput = document.getElementById('course-search-input');
	if (!(searchInput instanceof HTMLInputElement)) {
		console.warn('Planner shortcut: course search input not found');
		return;
	}

	searchInput.focus({ preventScroll: true });
}

export function handlePlannerShortcutKeydown(event: KeyboardEvent) {
	if ((event.ctrlKey || event.metaKey) && event.key === '/' && !event.shiftKey && !event.altKey) {
		event.preventDefault();
		focusCourseSearchInput();
	}

	if (event.key === 'Escape' && !event.shiftKey && !event.altKey) {
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLElement && activeElement.closest('#planner-container')) {
			activeElement.blur();
		}
	}
}
