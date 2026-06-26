/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Encodes and decodes a schedule as a short, shareable URL
 * token ("permalink"). A schedule is fully reconstructable from an ordered
 * list of (courseCode, sectionCode) pairs; all other section data is
 * re-fetched live from the API when the link is opened. These functions are
 * pure (no API / `$lib` imports) so they can be unit tested directly; the
 * data-fetching reconstruction lives in `CourseLoad.ts`.
 */

import type { Course } from '@jupiterp/jupiterp';
import type { CourseSectionPair, ScheduleBlock, ScheduleSelection } from '../../types';
import { noDifferences } from './Schedule';

/** Query parameter that carries a shared schedule, e.g. `?s=1~CMSC131-0101`. */
export const SHARE_PARAM = 's';

/**
 * Schema version of the encoded token. Bump this if the encoding format
 * changes so old links can still be recognized (and rejected gracefully).
 */
const SCHEMA_VERSION = '1';

/** Separates encoded course/section pairs from each other. */
const PAIR_SEPARATOR = '.';

/** Separates a courseCode from a sectionCode within a single pair. */
const FIELD_SEPARATOR = '-';

/** Separates the schema version from the payload. */
const VERSION_SEPARATOR = '~';

/**
 * Encode a schedule's course selections into a compact, URL-safe token.
 *
 * Only real (non-preview) course sections are included; custom `UserEvent`s
 * are intentionally excluded. The token uses only RFC 3986 "unreserved"
 * characters, so it never needs percent-encoding.
 *
 * @param selections The schedule blocks to encode.
 * @returns A token like `1~CMSC131-0101.MATH140-0501`, or `''` if there are
 *          no course sections to share.
 */
export function encodeSchedule(selections: ScheduleBlock[]): string {
	const pairs = selections
		.filter((s): s is ScheduleSelection => 'course' in s && !s.hover)
		.map((s) => `${s.course.courseCode}${FIELD_SEPARATOR}${s.section.sectionCode}`);

	if (pairs.length === 0) {
		return '';
	}

	return `${SCHEMA_VERSION}${VERSION_SEPARATOR}${pairs.join(PAIR_SEPARATOR)}`;
}

/**
 * Decode a share token back into the course/section pairs it represents.
 *
 * Tolerant of malformed input: an unrecognized version or any unparseable
 * token yields `[]` (or skips just that pair) rather than throwing, so a
 * broken or truncated link degrades gracefully instead of crashing load.
 *
 * @param param The raw token from the `s` query parameter.
 * @returns The decoded `CourseSectionPair[]` (possibly empty).
 */
export function decodeSchedule(param: string): CourseSectionPair[] {
	if (!param) {
		return [];
	}

	const versionEnd = param.indexOf(VERSION_SEPARATOR);
	if (versionEnd === -1 || param.slice(0, versionEnd) !== SCHEMA_VERSION) {
		return [];
	}

	const payload = param.slice(versionEnd + 1);
	if (!payload) {
		return [];
	}

	const pairs: CourseSectionPair[] = [];
	for (const token of payload.split(PAIR_SEPARATOR)) {
		// Course codes never contain `-`, so the last `-` splits course/section.
		const split = token.lastIndexOf(FIELD_SEPARATOR);
		if (split <= 0 || split === token.length - 1) {
			continue;
		}
		pairs.push({
			courseCode: token.slice(0, split),
			sectionCode: token.slice(split + 1)
		});
	}

	return pairs;
}

/**
 * Reconstruct full `ScheduleSelection`s from decoded pairs and freshly-fetched
 * course data. Pairs whose course or section no longer exist are silently
 * skipped, so a stale link still opens whatever is still valid. Selections are
 * built directly from the live section (with `noDifferences()`) so the opened
 * schedule never shows a spurious "section changed" warning.
 *
 * This is pure: the caller is responsible for fetching `courses`.
 *
 * @param pairs Decoded course/section pairs, in display order.
 * @param courses Up-to-date course data keyed by course code.
 * @returns The reconstructed selections (color numbers assigned by index).
 */
export function buildSharedSelections(
	pairs: CourseSectionPair[],
	courses: Record<string, Course>
): ScheduleSelection[] {
	const result: ScheduleSelection[] = [];

	pairs.forEach((pair) => {
		const course = courses[pair.courseCode];
		if (!course || !course.sections) {
			return;
		}

		const section = course.sections.find((s) => s.sectionCode === pair.sectionCode);
		if (!section) {
			return;
		}

		result.push({
			course: {
				courseCode: course.courseCode,
				name: course.name,
				minCredits: course.minCredits,
				maxCredits: course.maxCredits,
				description: course.description,
				genEds: course.genEds,
				conditions: course.conditions
			},
			section,
			hover: false,
			differences: noDifferences(),
			colorNumber: result.length
		});
	});

	return result;
}
