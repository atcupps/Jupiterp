/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Keyboard shortcuts for the course planner page.
 */

function focusCourseSearchInput() {
	// Assume not on mobile device since shortcut is only triggered by keyboard events
	const searchInput = document.getElementById('planner-course-search-input');
	if (!(searchInput instanceof HTMLInputElement)) {
		return;
	}

	searchInput.focus({ preventScroll: true });
}

const COURSE_CARD_SELECTOR = '[data-planner-course-card]';
const COURSE_HEADER_SELECTOR = '[data-planner-course-header]';
const COURSE_SECTION_SELECTOR = '[data-planner-course-section]';
let lastCourseListSignature = '';

function focusCourseTarget(target: HTMLElement | null) {
	if (!target) {
		return;
	}

	target.focus({ preventScroll: true });
	target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

function getCurrentCourseCard(activeElement: Element | null): HTMLElement | null {
	if (!(activeElement instanceof HTMLElement)) {
		return null;
	}

	return activeElement.closest<HTMLElement>(COURSE_CARD_SELECTOR);
}

function getCurrentCourseHeader(activeElement: Element | null): HTMLElement | null {
	if (!(activeElement instanceof HTMLElement)) {
		return null;
	}

	return activeElement.closest<HTMLElement>(COURSE_HEADER_SELECTOR);
}

function getCurrentCourseSection(activeElement: Element | null): HTMLElement | null {
	if (!(activeElement instanceof HTMLElement)) {
		return null;
	}

	return activeElement.closest<HTMLElement>(COURSE_SECTION_SELECTOR);
}

function getAllCourseCards(): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>(COURSE_CARD_SELECTOR));
}

function getCourseSections(courseCard: HTMLElement): HTMLElement[] {
	return Array.from(courseCard.querySelectorAll<HTMLElement>(COURSE_SECTION_SELECTOR));
}

function getCourseHeader(courseCard: HTMLElement): HTMLElement | null {
	return courseCard.querySelector<HTMLElement>(COURSE_HEADER_SELECTOR);
}

function getCourseNodes(courseCard: HTMLElement): HTMLElement[] {
	const header = getCourseHeader(courseCard);
	const sections = getCourseSections(courseCard);
	return header ? [header, ...sections] : sections;
}

function getAllCourseNodes(): HTMLElement[] {
	return getAllCourseCards().flatMap((courseCard) => getCourseNodes(courseCard));
}

function getCourseListSignature(): string {
	return getAllCourseCards()
		.map((courseCard) => `${courseCard.id}:${getCourseSections(courseCard).length}`)
		.join('|');
}

function focusCourseHeader(courseCard: HTMLElement | null) {
	focusCourseTarget(courseCard ? getCourseHeader(courseCard) : null);
}

function moveToAdjacentCourseHeader(activeElement: Element | null, step: -1 | 1) {
	const courseCards = getAllCourseCards();
	if (courseCards.length === 0) {
		lastCourseListSignature = '';
		return false;
	}

	const courseListSignature = getCourseListSignature();
	const resultsChanged = courseListSignature !== lastCourseListSignature;
	lastCourseListSignature = courseListSignature;
	if (resultsChanged) {
		focusCourseHeader(courseCards[0] ?? null);
		return true;
	}

	const currentCourseCard = getCurrentCourseCard(activeElement);
	const currentIndex = currentCourseCard ? courseCards.indexOf(currentCourseCard) : -1;
	const baseIndex = currentIndex === -1 ? 0 : currentIndex;
	const nextIndex = Math.max(0, Math.min(courseCards.length - 1, baseIndex + step));
	if (nextIndex === baseIndex) {
		return true;
	}

	focusCourseHeader(courseCards[nextIndex] ?? null);
	return true;
}

function getCurrentCourseNode(activeElement: Element | null): HTMLElement | null {
	return getCurrentCourseHeader(activeElement) ?? getCurrentCourseSection(activeElement);
}

function moveThroughCourseNodes(activeElement: Element | null, step: -1 | 1) {
	const nodes = getAllCourseNodes();
	if (nodes.length === 0) {
		lastCourseListSignature = '';
		return false;
	}

	const courseListSignature = getCourseListSignature();
	const resultsChanged = courseListSignature !== lastCourseListSignature;
	lastCourseListSignature = courseListSignature;
	if (resultsChanged) {
		focusCourseTarget(nodes[0]);
		return true;
	}

	const currentNode = getCurrentCourseNode(activeElement);
	if (!currentNode) {
		focusCourseTarget(nodes[0]);
		return true;
	}

	const currentNodeIndex = nodes.indexOf(currentNode);
	if (currentNodeIndex === -1) {
		focusCourseTarget(nodes[0]);
		return true;
	}

	const nextNodeIndex = Math.max(0, Math.min(nodes.length - 1, currentNodeIndex + step));
	if (nextNodeIndex === currentNodeIndex) {
		return true;
	}

	focusCourseTarget(nodes[nextNodeIndex]);
	return true;
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
	switch (event.key) {
		case 'Escape':
			if (activeElement instanceof HTMLElement) {
				activeElement.blur();
			}
			return; // always prevent default for Escape to avoid conflicts with browser shortcuts
		case '/':
			if (activeElement?.id !== 'planner-course-search-input') {
				event.preventDefault();
				focusCourseSearchInput();
			}
			return;
		default:
			if (isInputFocused && !event.altKey) {
				return; // ignore shortcuts if an input is focused
			} // could use "alt" to skip this check
			break;
	}
	switch (event.key.toLowerCase()) {
		case 'w':
		case 'arrowup':
			event.preventDefault();
			moveThroughCourseNodes(activeElement, -1);
			break;
		case 's':
		case 'arrowdown':
			event.preventDefault();
			moveThroughCourseNodes(activeElement, 1);
			break;
		case 'a':
		case 'arrowleft':
			event.preventDefault();
			moveToAdjacentCourseHeader(activeElement, -1);
			break;
		case 'd':
		case 'arrowright':
			event.preventDefault();
			moveToAdjacentCourseHeader(activeElement, 1);
			break;
		case ',':
			if (!isDesktop) {
				event.preventDefault();
				const scheduleElement = document.getElementById('planner-schedule');
				scheduleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			break;
		case '.':
			if (!isDesktop) {
				event.preventDefault();
				const searchResultsElement = document.getElementById('planner-search-results');
				searchResultsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			break;
		default:
			break;
	}
}
