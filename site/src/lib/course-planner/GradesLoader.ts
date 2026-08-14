/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Fetches grade data for courses from the PlanetTerp API
 * and populates the `CourseGradesStore`. Handles in-flight deduplication,
 * a concurrency limit so Jupiterp is polite to PlanetTerp's API, and a
 * Svelte action that lazily loads grades for course cards the user
 * actually dwells on. Aggregation logic lives in `Grades.ts`.
 */

import { get } from 'svelte/store';
import { CourseGradesStore } from '../../stores/CoursePlannerStores';
import type { CourseGradesEntry } from '../../stores/CoursePlannerStores';
import { aggregateGradeRecords, type PtGradesRecord } from './Grades';

const PT_GRADES_URL = 'https://planetterp.com/api/v1/grades?course=';

/** Max simultaneous requests to PlanetTerp */
const MAX_CONCURRENT_FETCHES = 3;

/** How long a course card must stay visible before grades are fetched */
const AUTOLOAD_DWELL_MS = 300;

const inFlight: Map<string, Promise<void>> = new Map();

let activeFetches = 0;
const fetchQueue: (() => void)[] = [];

/**
 * Resolve immediately if a fetch slot is free; otherwise queue until one
 * is released. Keeps at most `MAX_CONCURRENT_FETCHES` requests active.
 */
function acquireFetchSlot(): Promise<void> {
  if (activeFetches < MAX_CONCURRENT_FETCHES) {
    activeFetches++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    fetchQueue.push(() => {
      activeFetches++;
      resolve();
    });
  });
}

function releaseFetchSlot(): void {
  activeFetches--;
  const next = fetchQueue.shift();
  if (next !== undefined) {
    next();
  }
}

function setEntry(courseCode: string, entry: CourseGradesEntry): void {
  CourseGradesStore.update((store) => ({ ...store, [courseCode]: entry }));
}

/**
 * Load PlanetTerp grade data for a course into `CourseGradesStore`.
 * No-ops if the course already has an entry, unless the entry is an
 * error and `opts.retryError` is set. Errors are logged and swallowed
 * so a grades failure never blocks the rest of the page.
 * @param courseCode The course to load grades for, e.g. 'MATH401'
 * @param opts Set `retryError` to refetch after a previous failure
 */
export async function loadCourseGrades(courseCode: string, opts: { retryError?: boolean } = {}): Promise<void> {
  const entry = get(CourseGradesStore)[courseCode];
  if (entry !== undefined && (entry.status !== 'error' || !opts.retryError)) {
    return;
  }
  const pending = inFlight.get(courseCode);
  if (pending !== undefined) {
    return pending;
  }
  const promise = fetchCourseGrades(courseCode);
  inFlight.set(courseCode, promise);
  try {
    await promise;
  } finally {
    inFlight.delete(courseCode);
  }
}

async function fetchCourseGrades(courseCode: string): Promise<void> {
  setEntry(courseCode, { status: 'loading' });
  await acquireFetchSlot();
  try {
    const response = await fetch(PT_GRADES_URL + encodeURIComponent(courseCode));
    // PlanetTerp responds 400 for courses it has no record of
    if (response.status === 400) {
      setEntry(courseCode, { status: 'none' });
      return;
    }
    if (!response.ok) {
      throw new Error(`PlanetTerp grades request failed: ${response.status}`);
    }
    const records = (await response.json()) as PtGradesRecord[];
    if (!Array.isArray(records) || records.length === 0) {
      setEntry(courseCode, { status: 'none' });
      return;
    }
    setEntry(courseCode, {
      status: 'loaded',
      grades: aggregateGradeRecords(records),
    });
  } catch (error) {
    console.error('Error fetching PlanetTerp grade data:', error);
    setEntry(courseCode, { status: 'error' });
  } finally {
    releaseFetchSlot();
  }
}

/**
 * Svelte action that loads grades for a course once its element has
 * been visible for `AUTOLOAD_DWELL_MS`. Cards scrolled past quickly
 * never trigger a request, bounding load on PlanetTerp's API even when
 * a department search renders hundreds of cards.
 *
 * Usage: `<div use:gradesAutoload={course.courseCode}>`
 */
export function gradesAutoload(node: HTMLElement, courseCode: string): { destroy(): void } {
  if (typeof IntersectionObserver === 'undefined' || get(CourseGradesStore)[courseCode] !== undefined) {
    return {
      destroy() {},
    };
  }
  let dwellTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (dwellTimer === null) {
            dwellTimer = setTimeout(() => {
              observer.disconnect();
              void loadCourseGrades(courseCode);
            }, AUTOLOAD_DWELL_MS);
          }
        } else if (dwellTimer !== null) {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(node);
  return {
    destroy() {
      if (dwellTimer !== null) {
        clearTimeout(dwellTimer);
      }
      observer.disconnect();
    },
  };
}
