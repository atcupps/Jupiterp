/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Loading and shaping for a professor page.
 *
 * The same data object drives both the `/professor/[slug]` route, which
 * server-renders it, and the modal opened from the planner, which fetches it
 * client-side. Neither knows about the other; `ProfessorPanel` renders
 * whichever it is handed.
 */

import {
  instructorBySlug,
  instructorCourseGradeSummary,
  instructorGradeSummary,
  instructorTermGradeSummary,
} from '../api/JupiterpApi';
import type { InstructorFull } from '../api/types';
import { toDistribution, type GradeDistribution } from '../course-planner/Grades';

type Fetch = typeof globalThis.fetch;

/** One course a professor has taught, with their grade distribution in it. */
export interface ProfessorCourse {
  courseCode: string;
  distribution: GradeDistribution;
}

/** One term, for the trend chart. */
export interface ProfessorTerm {
  term: number;
  gpa: number | null;
  graded: number;
  courseCount: number;
}

export interface ProfessorData {
  instructor: InstructorFull;
  /** Across every course. Null when no grade data links to this professor. */
  overall: GradeDistribution | null;
  courses: ProfessorCourse[];
  terms: ProfessorTerm[];
  /**
   * Four-letter department codes inferred from the courses taught. Jupiterp
   * has no instructor-to-department mapping of its own, and a professor can
   * teach across several.
   */
  departments: string[];
}

/**
 * Load everything a professor page shows.
 *
 * Returns null when the slug matches no instructor, which the route turns into
 * a 404. Grade data being absent is NOT null: a professor with no linked grade
 * rows still has a page, showing their rating and an explanation. That case is
 * common and expected -- roughly 3% of grade rows name no instructor at all,
 * Testudo-only professors have no grade history yet, and the dataset covers
 * Fall and Spring only, so anyone who teaches solely in Summer has none.
 */
export async function loadProfessor(slug: string, fetchFn?: Fetch): Promise<ProfessorData | null> {
  const instructor = await instructorBySlug(slug, fetchFn);
  if (instructor === null) {
    return null;
  }

  // Requested together: they are independent queries against different views,
  // and serialising them would make the page wait three round trips deep.
  const [overallRow, coursePage, termPage] = await Promise.all([
    instructorGradeSummary(slug, fetchFn),
    instructorCourseGradeSummary(slug, {}, fetchFn),
    instructorTermGradeSummary(slug, fetchFn),
  ]);

  const courses: ProfessorCourse[] = coursePage.data.map((row) => ({
    courseCode: row.course_code,
    distribution: toDistribution(row),
  }));

  const terms: ProfessorTerm[] = termPage.data.map((row) => ({
    term: row.term,
    gpa: row.gpa === null ? null : Number(row.gpa),
    graded: row.graded,
    courseCount: row.course_count,
  }));

  return {
    instructor,
    overall: overallRow === null ? null : toDistribution(overallRow),
    courses,
    terms,
    departments: departmentsOf(courses),
  };
}

/**
 * Department codes are the first four characters of a course code.
 *
 * Sorted by how many courses fall under each, so a professor who has taught
 * one cross-listed course outside their home department does not get it listed
 * first.
 */
export function departmentsOf(courses: ProfessorCourse[]): string[] {
  const counts = new Map<string, number>();
  for (const course of courses) {
    const dept = course.courseCode.slice(0, 4);
    counts.set(dept, (counts.get(dept) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([dept]) => dept);
}

/**
 * The rating to display, and what it is made of.
 *
 * Never a single opaque blended number. A reader seeing "4.3" deserves to know
 * that it is twelve Jupiterp reviews and a frozen PlanetTerp average from 2026,
 * because those are different claims with different reliability.
 */
export interface RatingBreakdown {
  combined: number | null;
  jupiterp: number | null;
  jupiterpCount: number;
  planetterp: number | null;
  planetterpCount: number;
  planetterpAsOf: string | null;
  /** False when there is not enough behind the number to show it at all. */
  displayable: boolean;
}

/**
 * Minimum weighted reviews before a combined rating is shown.
 *
 * Below this, "4.9" means one person had a good semester. Showing
 * "Not enough reviews yet" is more informative than showing a number that
 * looks precise.
 */
export const MIN_REVIEWS_FOR_RATING = 3;

export function ratingBreakdown(instructor: InstructorFull): RatingBreakdown {
  const jupiterpCount = instructor.jupiterp_review_count ?? 0;
  const planetterpCount = instructor.pt_review_count ?? 0;
  const combined = instructor.combined_rating ?? numeric(instructor.average_rating);

  return {
    combined,
    jupiterp: instructor.jupiterp_rating,
    jupiterpCount,
    planetterp: instructor.pt_average_rating,
    planetterpCount,
    planetterpAsOf: instructor.pt_snapshot_at,
    displayable: combined !== null && jupiterpCount + planetterpCount >= MIN_REVIEWS_FOR_RATING,
  };
}

function numeric(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}
