/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Grade and instructor calls against the Jupiterp API.
 *
 * `@jupiterp/jupiterp` v0.8.5 has no grade methods, so the endpoints the API
 * already serves are unreachable from the site. This module fills that gap and
 * is written to be lifted into the package unchanged; see `types.ts`.
 *
 * Every function takes an optional `fetch`. SvelteKit passes its own during
 * SSR so that server-side requests are traced and relative URLs resolve, and
 * `+page.ts` load functions are required to use it. Defaulting to the global
 * keeps client-side callers from having to care.
 */

import { client } from '../client';
import { normalizeName } from '../professor/Names';
import type {
  CourseGradeSummary,
  CourseInstructorGradeSummary,
  CourseTermGradeSummary,
  GradeTerm,
  InstructorFull,
  InstructorGradeSummary,
  InstructorTermGradeSummary,
  Page,
} from './types';

type Fetch = typeof globalThis.fetch;

/** Thrown for any non-2xx response, so callers get one failure mode. */
export class JupiterpApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    body: string
  ) {
    super(`Jupiterp API ${status} for ${path}${body ? `: ${body}` : ''}`);
    this.name = 'JupiterpApiError';
  }
}

async function get<T>(path: string, params: URLSearchParams, fetchFn: Fetch = fetch): Promise<Page<T>> {
  const url = `${client.dbUrl}${path}?${params.toString()}`;
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new JupiterpApiError(response.status, path, await response.text().catch(() => ''));
  }

  return {
    data: (await response.json()) as T[],
    total: parseContentRange(response.headers.get('Content-Range')),
  };
}

/**
 * Read the total out of a PostgREST `Content-Range` header.
 *
 * The format is `0-49/4812`. The total is `*` when the request
 * did not ask for an exact count, which is not an error -- it means the
 * caller did not pay for one.
 */
export function parseContentRange(header: string | null): number | null {
  if (header === null) {
    return null;
  }
  const total = header.split('/')[1];
  if (total === undefined || total === '*') {
    return null;
  }
  const parsed = Number.parseInt(total, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function build(entries: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== '' && value !== false) {
      params.set(key, String(value));
    }
  }
  return params;
}

/* ============================== grades ================================= */

export interface CourseGradesConfig {
  /** Comma-separated course codes. */
  courseCodes: string;
  minStudents?: number;
  sortBy?: string;
  limit?: number;
}

/** Course-wide grade distributions, one row per course. */
export async function courseGradeSummary(cfg: CourseGradesConfig, fetchFn?: Fetch): Promise<Page<CourseGradeSummary>> {
  return get<CourseGradeSummary>(
    '/v0/grades/summary',
    build({
      groupBy: 'course',
      courseCodes: cfg.courseCodes,
      minStudents: cfg.minStudents,
      sortBy: cfg.sortBy,
      limit: cfg.limit ?? 500,
    }),
    fetchFn
  );
}

export interface CourseInstructorGradesConfig extends CourseGradesConfig {
  /**
   * Also count sections whose instructor was carried across lecture groups or
   * into a differently-coded offering. Wider coverage, lower confidence; the
   * professor page exposes this as an explicit opt-in toggle.
   */
  includeCarried?: boolean;
}

/** Per-professor grade distributions within one or more courses. */
export async function courseInstructorGradeSummary(
  cfg: CourseInstructorGradesConfig,
  fetchFn?: Fetch
): Promise<Page<CourseInstructorGradeSummary>> {
  return get<CourseInstructorGradeSummary>(
    '/v0/grades/summary',
    build({
      groupBy: 'instructor',
      includeCarried: cfg.includeCarried,
      courseCodes: cfg.courseCodes,
      minStudents: cfg.minStudents,
      sortBy: cfg.sortBy,
      limit: cfg.limit ?? 500,
    }),
    fetchFn
  );
}

/**
 * One professor's grades across every course they have taught.
 *
 * Filtered by slug rather than name on purpose: the same professor is spelled
 * several ways across the registrar exports, Testudo, and PlanetTerp, and an
 * exact name match silently returns nothing for a large share of instructors.
 */
export async function instructorGradeSummary(
  instructorSlug: string,
  fetchFn?: Fetch
): Promise<InstructorGradeSummary | null> {
  const page = await get<InstructorGradeSummary>(
    '/v0/grades/summary',
    build({ groupBy: 'instructorOverall', instructorSlug, limit: 1 }),
    fetchFn
  );
  return page.data[0] ?? null;
}

/** One professor's grades per term, oldest first, for the trend chart. */
export async function instructorTermGradeSummary(
  instructorSlug: string,
  fetchFn?: Fetch
): Promise<Page<InstructorTermGradeSummary>> {
  return get<InstructorTermGradeSummary>(
    '/v0/grades/summary',
    build({
      groupBy: 'instructorTerm',
      instructorSlug,
      sortBy: 'term.asc',
      limit: 200,
    }),
    fetchFn
  );
}

/** One professor's grades per course, largest first. */
export async function instructorCourseGradeSummary(
  instructorSlug: string,
  options: { includeCarried?: boolean } = {},
  fetchFn?: Fetch
): Promise<Page<CourseInstructorGradeSummary>> {
  return get<CourseInstructorGradeSummary>(
    '/v0/grades/summary',
    build({
      groupBy: 'instructor',
      instructorSlug,
      includeCarried: options.includeCarried,
      sortBy: 'graded.desc',
      limit: 500,
    }),
    fetchFn
  );
}

/** Grade distributions for one course, per term. */
export async function courseTermGradeSummary(
  courseCodes: string,
  fetchFn?: Fetch
): Promise<Page<CourseTermGradeSummary>> {
  return get<CourseTermGradeSummary>(
    '/v0/grades/summary',
    build({ groupBy: 'term', courseCodes, sortBy: 'term.asc', limit: 200 }),
    fetchFn
  );
}

/** Every term for which grade data exists, newest first. */
export async function gradeTerms(fetchFn?: Fetch): Promise<Page<GradeTerm>> {
  return get<GradeTerm>('/v0/grades/terms', build({}), fetchFn);
}

/* ============================ instructors =============================== */

export interface InstructorSearchConfig {
  /** Case-insensitive substring match, normalized server-side. */
  nameSearch?: string;
  activeOnly?: boolean;
  sortBy?: string;
  limit?: number;
  offset?: number;
  /** Ask for a total row count in `Content-Range`. Costs an extra aggregate. */
  count?: boolean;
}

/**
 * Search instructors by partial name, server-side.
 *
 * The planner previously paged through every active instructor into a
 * client-side record on each page load -- several hundred KB, and untenable
 * once the directory covers the full historical instructor set.
 */
export async function searchInstructors(cfg: InstructorSearchConfig, fetchFn?: Fetch): Promise<Page<InstructorFull>> {
  return get<InstructorFull>(
    '/v0/instructors',
    build({
      // The server matches against a normalized column, so an
      // un-normalized query finds nothing: "O'Brien" against the stored
      // "o brien" fails on the apostrophe.
      nameSearch: normalizeName(cfg.nameSearch) ?? undefined,
      activeOnly: cfg.activeOnly,
      sortBy: cfg.sortBy,
      limit: cfg.limit ?? 50,
      offset: cfg.offset,
      count: cfg.count,
    }),
    fetchFn
  );
}

/** Fetch one instructor by slug, or null when there is no such professor. */
export async function instructorBySlug(slug: string, fetchFn?: Fetch): Promise<InstructorFull | null> {
  const page = await get<InstructorFull>('/v0/instructors', build({ instructorSlugs: slug, limit: 1 }), fetchFn);
  return page.data[0] ?? null;
}

export { normalizeName as normalizeSearchTerm };
