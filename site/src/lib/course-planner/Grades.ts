/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Pure functions for aggregating PlanetTerp grade data into
 * per-professor and course-wide grade distributions with average GPAs.
 * This module intentionally has no runtime imports so it can be unit
 * tested with Jest. Grade data originates from UMD's IRPA via PlanetTerp
 * (https://planetterp.com/api/).
 */

/** A raw record from `GET planetterp.com/api/v1/grades?course=X` */
export interface PtGradesRecord {
  course: string;
  /** `null` for sections with no attributed professor */
  professor: string | null;
  /** e.g. '201801'; YYYY01 Spring, YYYY05 Summer, YYYY08 Fall, YYYY12 Winter */
  semester: string;
  section: string;
  'A+': number;
  A: number;
  'A-': number;
  'B+': number;
  B: number;
  'B-': number;
  'C+': number;
  C: number;
  'C-': number;
  'D+': number;
  D: number;
  'D-': number;
  F: number;
  W: number;
  Other: number;
}

export type LetterGrade =
  'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F' | 'W' | 'Other';

/** Coarse buckets used for the grade distribution bars */
export type GradeBucket = 'A' | 'B' | 'C' | 'D' | 'F' | 'W';

/** Counts of students per letter grade */
export type LetterCounts = Record<LetterGrade, number>;

/** An aggregate of grade counts across many `PtGradesRecord`s */
export interface GradeDistribution {
  /** Summed raw counts per letter grade */
  letters: LetterCounts;
  /** Coarse counts; e.g. bucket 'A' = A+ + A + A- */
  buckets: Record<GradeBucket, number>;
  /** All letter grades + F + W; 'Other' is excluded, matching PlanetTerp's GPA denominator */
  totalStudents: number;
  otherCount: number;
  /** Average GPA using PlanetTerp's formula, or `null` if no students */
  gpa: number | null;
  earliestSemester: string | null;
  latestSemester: string | null;
}

/** Aggregated grade data for a course */
export interface CourseGrades {
  /** Course-wide distribution, including unattributed sections */
  course: GradeDistribution;
  /** Distributions keyed by PlanetTerp professor name */
  byProfessor: Record<string, GradeDistribution>;
}

/** Tier used to color-code average GPAs */
export type GpaTier = 'good' | 'mid' | 'low';

const LETTER_GRADES: LetterGrade[] = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-',
  'F',
  'W',
  'Other',
];

/**
 * GPA weight per letter grade, matching PlanetTerp's calculation in
 * their `home/models.py`. F and W are worth 0 quality points but are
 * still counted in the GPA denominator; 'Other' is excluded entirely.
 */
const GPA_WEIGHTS: LetterCounts = {
  'A+': 4,
  A: 4,
  'A-': 3.7,
  'B+': 3.3,
  B: 3,
  'B-': 2.7,
  'C+': 2.3,
  C: 2,
  'C-': 1.7,
  'D+': 1.3,
  D: 1,
  'D-': 0.7,
  F: 0,
  W: 0,
  Other: 0,
};

/** Letters belonging to each bucket, ordered best grade first */
export const BUCKET_LETTERS: Record<GradeBucket, LetterGrade[]> = {
  A: ['A+', 'A', 'A-'],
  B: ['B+', 'B', 'B-'],
  C: ['C+', 'C', 'C-'],
  D: ['D+', 'D', 'D-'],
  F: ['F'],
  W: ['W'],
};

/** Ordered buckets for rendering distribution bars */
export const GRADE_BUCKETS: GradeBucket[] = ['A', 'B', 'C', 'D', 'F', 'W'];

/**
 * Compute an average GPA from summed letter grade counts using
 * PlanetTerp's exact formula: quality points over all letter grades
 * plus F and W, with 'Other' excluded.
 * @param letters Summed counts per letter grade
 * @returns The average GPA, or `null` if there are no counted students
 */
export function gpaFromLetters(letters: LetterCounts): number | null {
  let qualityPoints = 0;
  let students = 0;
  for (const letter of LETTER_GRADES) {
    if (letter === 'Other') {
      continue;
    }
    qualityPoints += letters[letter] * GPA_WEIGHTS[letter];
    students += letters[letter];
  }
  if (students === 0) {
    return null;
  }
  return qualityPoints / students;
}

/**
 * Create an empty `GradeDistribution` to accumulate records into.
 */
function emptyDistribution(): GradeDistribution {
  const letters = {} as LetterCounts;
  for (const letter of LETTER_GRADES) {
    letters[letter] = 0;
  }
  return {
    letters,
    buckets: { A: 0, B: 0, C: 0, D: 0, F: 0, W: 0 },
    totalStudents: 0,
    otherCount: 0,
    gpa: null,
    earliestSemester: null,
    latestSemester: null,
  };
}

/**
 * Add a single raw record's counts into a distribution. Buckets, totals,
 * and GPA are recomputed by `finalizeDistribution`.
 */
function addRecord(dist: GradeDistribution, record: PtGradesRecord): void {
  for (const letter of LETTER_GRADES) {
    const count = record[letter];
    if (typeof count === 'number' && Number.isFinite(count)) {
      dist.letters[letter] += count;
    }
  }
  // Zero-padded YYYYMM semester codes sort correctly as strings
  const sem = record.semester;
  if (dist.earliestSemester === null || sem < dist.earliestSemester) {
    dist.earliestSemester = sem;
  }
  if (dist.latestSemester === null || sem > dist.latestSemester) {
    dist.latestSemester = sem;
  }
}

/**
 * Derive buckets, student totals, and average GPA from summed letters.
 */
function finalizeDistribution(dist: GradeDistribution): void {
  dist.totalStudents = 0;
  for (const bucket of GRADE_BUCKETS) {
    let count = 0;
    for (const letter of BUCKET_LETTERS[bucket]) {
      count += dist.letters[letter];
    }
    dist.buckets[bucket] = count;
    dist.totalStudents += count;
  }
  dist.otherCount = dist.letters.Other;
  dist.gpa = gpaFromLetters(dist.letters);
}

/**
 * Aggregate raw PlanetTerp grade records for one course into a
 * course-wide distribution and per-professor distributions.
 *
 * Note: professors are keyed by their exact PlanetTerp name, so two
 * distinct professors sharing a name are merged (the same limitation as
 * the existing instructor ratings lookup). Records with a `null`
 * professor count toward the course-wide distribution only.
 * @param records Raw records from the PlanetTerp grades API
 * @returns Aggregated `CourseGrades`
 */
export function aggregateGradeRecords(records: PtGradesRecord[]): CourseGrades {
  const course = emptyDistribution();
  const byProfessor: Record<string, GradeDistribution> = {};
  for (const record of records) {
    addRecord(course, record);
    if (record.professor != null) {
      if (!(record.professor in byProfessor)) {
        byProfessor[record.professor] = emptyDistribution();
      }
      addRecord(byProfessor[record.professor], record);
    }
  }
  finalizeDistribution(course);
  for (const professor in byProfessor) {
    finalizeDistribution(byProfessor[professor]);
  }
  return { course, byProfessor };
}

/**
 * Format a PlanetTerp semester code as a human-readable string.
 * @param code A semester code such as '201801'
 * @returns e.g. 'Spring 2018'; returns `code` unchanged if malformed
 */
export function formatSemester(code: string): string {
  if (!/^\d{6}$/.test(code)) {
    return code;
  }
  const year = code.slice(0, 4);
  const seasons: Record<string, string> = {
    '01': 'Spring',
    '05': 'Summer',
    '08': 'Fall',
    '12': 'Winter',
  };
  const season = seasons[code.slice(4)];
  if (season === undefined) {
    return code;
  }
  return `${season} ${year}`;
}

/**
 * Classify an average GPA into a tier for color coding.
 * @param gpa An average GPA
 * @returns 'good' (>= 3.3), 'mid' (>= 2.8), or 'low'
 */
export function gpaTier(gpa: number): GpaTier {
  if (gpa >= 3.3) {
    return 'good';
  } else if (gpa >= 2.8) {
    return 'mid';
  } else {
    return 'low';
  }
}

/**
 * Format a bucket's share of students as a whole-number percentage.
 * @returns e.g. '62', or '<1' for nonzero counts that round to 0
 */
export function bucketPercent(dist: GradeDistribution, bucket: GradeBucket): string {
  if (dist.totalStudents === 0) {
    return '0';
  }
  const count = dist.buckets[bucket];
  const percent = Math.round((count / dist.totalStudents) * 100);
  if (percent === 0 && count > 0) {
    return '<1';
  }
  return percent.toString();
}

/**
 * Get a link to a course's page on PlanetTerp.
 * @param courseCode A course code, e.g. 'MATH401'
 * @returns The PlanetTerp course page URL
 */
export function ptCourseLink(courseCode: string): string {
  return 'https://planetterp.com/course/' + encodeURIComponent(courseCode);
}
