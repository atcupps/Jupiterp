/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Unit tests for Grades.ts
 */

import {
	aggregateGradeRecords,
	bucketPercent,
	formatSemester,
	gpaFromLetters,
	gpaTier,
	ptCourseLink,
	type GradeDistribution,
	type LetterCounts,
	type LetterGrade,
	type PtGradesRecord
} from './Grades';
import { describe, expect, test } from '@jest/globals';

type SparseCounts = Partial<Record<LetterGrade, number>>;

/** Build a full letter-count record from a sparse one */
function letters(counts: SparseCounts): LetterCounts {
	return {
		'A+': 0,
		A: 0,
		'A-': 0,
		'B+': 0,
		B: 0,
		'B-': 0,
		'C+': 0,
		C: 0,
		'C-': 0,
		'D+': 0,
		D: 0,
		'D-': 0,
		F: 0,
		W: 0,
		Other: 0,
		...counts
	};
}

type RecordOverrides = Partial<PtGradesRecord> & {
	professor: string | null;
};

/** Build a `PtGradesRecord` with defaults for concise test setup */
function record(overrides: RecordOverrides): PtGradesRecord {
	return {
		course: 'TEST100',
		semester: '202001',
		section: '0101',
		...letters({}),
		...overrides
	};
}

describe('gpaFromLetters', () => {
	test('computes PlanetTerp GPA for a mixed distribution', () => {
		// numerator = 4 + 8 + 3.7 + 9 + 2 + 1 = 27.7
		// denominator = 1 + 2 + 1 + 3 + 1 + 1 + 1 + 1 = 11
		const mixed = { 'A+': 1, A: 2, 'A-': 1, B: 3, C: 1, D: 1, F: 1, W: 1 };
		const gpa = gpaFromLetters(letters(mixed));
		expect(gpa).toBeCloseTo(27.7 / 11, 10);
	});

	test('F and W count in denominator with 0 quality points', () => {
		const withoutFW = gpaFromLetters(letters({ A: 2 }));
		const withFW = gpaFromLetters(letters({ A: 2, F: 1, W: 1 }));
		expect(withoutFW).toBeCloseTo(4, 10);
		expect(withFW).toBeCloseTo(8 / 4, 10);
	});

	test('Other is excluded entirely', () => {
		const base = gpaFromLetters(letters({ A: 1, B: 1 }));
		const withOther = gpaFromLetters(letters({ A: 1, B: 1, Other: 50 }));
		expect(withOther).toEqual(base);
	});

	test('returns null when there are no counted students', () => {
		expect(gpaFromLetters(letters({}))).toBeNull();
		expect(gpaFromLetters(letters({ Other: 5 }))).toBeNull();
	});

	test('uses exact weights for plus/minus grades', () => {
		expect(gpaFromLetters(letters({ 'A-': 1 }))).toBeCloseTo(3.7, 10);
		expect(gpaFromLetters(letters({ 'B+': 1 }))).toBeCloseTo(3.3, 10);
		expect(gpaFromLetters(letters({ 'D-': 1 }))).toBeCloseTo(0.7, 10);
	});
});

describe('aggregateGradeRecords', () => {
	test('sums records for the same professor', () => {
		const result = aggregateGradeRecords([
			record({ professor: 'Prof X', A: 2, B: 1 }),
			record({ professor: 'Prof X', A: 1, C: 1, semester: '202108' })
		]);
		const dist = result.byProfessor['Prof X'];
		expect(dist.letters.A).toEqual(3);
		expect(dist.buckets.A).toEqual(3);
		expect(dist.buckets.B).toEqual(1);
		expect(dist.buckets.C).toEqual(1);
		expect(dist.totalStudents).toEqual(5);
	});

	test('separates different professors', () => {
		const result = aggregateGradeRecords([
			record({ professor: 'Prof X', A: 2 }),
			record({ professor: 'Prof Y', F: 2 })
		]);
		expect(result.byProfessor['Prof X'].gpa).toBeCloseTo(4, 10);
		expect(result.byProfessor['Prof Y'].gpa).toBeCloseTo(0, 10);
		expect(result.course.totalStudents).toEqual(4);
	});

	test('null-professor records count in course only', () => {
		const result = aggregateGradeRecords([
			record({ professor: null, A: 5 }),
			record({ professor: 'Prof X', B: 5 })
		]);
		expect(Object.keys(result.byProfessor)).toEqual(['Prof X']);
		expect(result.course.totalStudents).toEqual(10);
	});

	test('tracks earliest and latest semesters on unordered input', () => {
		const result = aggregateGradeRecords([
			record({ professor: 'Prof X', A: 1, semester: '202108' }),
			record({ professor: 'Prof X', A: 1, semester: '201701' }),
			record({ professor: 'Prof X', A: 1, semester: '201908' })
		]);
		expect(result.course.earliestSemester).toEqual('201701');
		expect(result.course.latestSemester).toEqual('202108');
	});

	test('empty input produces an empty course distribution', () => {
		const result = aggregateGradeRecords([]);
		expect(result.course.gpa).toBeNull();
		expect(result.course.totalStudents).toEqual(0);
		expect(result.course.earliestSemester).toBeNull();
		expect(Object.keys(result.byProfessor)).toEqual([]);
	});

	test('buckets group plus/minus letters together', () => {
		const recs = [record({ professor: 'Prof X', 'B+': 1, B: 2, 'B-': 3 })];
		const result = aggregateGradeRecords(recs);
		expect(result.course.buckets.B).toEqual(6);
	});
});

describe('formatSemester', () => {
	test('formats all four seasons', () => {
		expect(formatSemester('201801')).toEqual('Spring 2018');
		expect(formatSemester('202105')).toEqual('Summer 2021');
		expect(formatSemester('202008')).toEqual('Fall 2020');
		expect(formatSemester('202212')).toEqual('Winter 2022');
	});

	test('returns malformed codes unchanged', () => {
		expect(formatSemester('garbage')).toEqual('garbage');
		expect(formatSemester('202103')).toEqual('202103');
		expect(formatSemester('')).toEqual('');
	});
});

describe('gpaTier', () => {
	test('classifies boundary values', () => {
		expect(gpaTier(3.3)).toEqual('good');
		expect(gpaTier(3.29)).toEqual('mid');
		expect(gpaTier(2.8)).toEqual('mid');
		expect(gpaTier(2.79)).toEqual('low');
		expect(gpaTier(4)).toEqual('good');
		expect(gpaTier(0)).toEqual('low');
	});
});

describe('bucketPercent', () => {
	function distWith(counts: SparseCounts): GradeDistribution {
		const recs = [record({ professor: 'Prof X', ...counts })];
		return aggregateGradeRecords(recs).course;
	}

	test('rounds to whole percentages', () => {
		const dist = distWith({ A: 62, B: 21, C: 9, D: 4, F: 1, W: 3 });
		expect(bucketPercent(dist, 'A')).toEqual('62');
		expect(bucketPercent(dist, 'F')).toEqual('1');
	});

	test('shows <1 for nonzero counts that round to zero', () => {
		const dist = distWith({ A: 999, F: 1 });
		expect(bucketPercent(dist, 'F')).toEqual('<1');
	});

	test('shows 0 for empty buckets and empty distributions', () => {
		const dist = distWith({ A: 10 });
		expect(bucketPercent(dist, 'W')).toEqual('0');
		expect(bucketPercent(distWith({}), 'A')).toEqual('0');
	});
});

describe('ptCourseLink', () => {
	test('links to the PlanetTerp course page', () => {
		const url = 'https://planetterp.com/course/MATH401';
		expect(ptCourseLink('MATH401')).toEqual(url);
	});
});
