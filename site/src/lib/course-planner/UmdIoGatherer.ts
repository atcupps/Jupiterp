/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Gather course and section data from umd.io and map it to the
 * Jupiterp course model used by the planner.
 */

import { GenEd, type Course } from '@jupiterp/jupiterp';
import type { ServerSideFilterParams } from '../../types';
import type { RequestInput } from './CourseDataCache';
import type { AcademicTerm } from './Terms';

const UMD_IO_BASE_URL = 'https://api.umd.io/v1';
const PAGE_SIZE = 100;
const COURSE_BATCH_SIZE = 40;

type PlannerTerm = AcademicTerm;

export interface AvailableTermYear {
    term: AcademicTerm;
    year: number;
    semester: string;
}

type UmdCourse = {
    course_id: string;
    semester: number;
    name: string;
    dept_id: string;
    department: string;
    credits: string;
    description: string | null;
    gen_ed?: string[] | null;
    relationships?: Record<string, string[] | string | null> | null;
};

type UmdCourseListItem = {
    course_id: string;
    name: string;
};

type UmdSection = {
    course?: string;
    course_id?: string;
    section_id?: string;
    number?: string;
    seats?: string | number;
    open_seats?: string | number;
    waitlist?: string | number;
    instructors?: string[];
    meetings?: unknown[];
};

type PlannerSection = {
    courseCode: string;
    sectionCode: string;
    instructors: string[];
    meetings: any[];
    openSeats: number;
    totalSeats: number;
    waitlist: number;
    holdfile: number | null;
};

let semesterCache: string[] | null = null;

export async function listAvailableTermYears(): Promise<AvailableTermYear[]> {
    const semesters = await fetchSemesters();
    const options: AvailableTermYear[] = [];

    for (const semester of semesters) {
        const mapped = mapSemesterToTermYear(semester);
        if (mapped) {
            options.push(mapped);
        }
    }

    return options;
}

export async function resolveMostRecentTermYear(
    term: AcademicTerm
): Promise<AvailableTermYear | null> {
    const options = await listAvailableTermYears();
    return options.find((option) => option.term === term) ?? null;
}

export async function gatherCoursesFromUmdIo(input: RequestInput): Promise<Course[]> {
    const semester = await resolveSemester(input.term, input.year);

    const courses = input.type === 'deptCode'
        ? await fetchCoursesByDept(input.value, semester)
        : await fetchCoursesByNumber(input.value, semester);

    if (courses.length === 0) {
        return [];
    }

    const sectionsByCourse = await fetchSectionsForCourses(
        courses.map((course) => course.course_id),
        semester
    );

    const filtered = applyServerSideFilters(courses, sectionsByCourse, input.filters);

    return filtered.map((course) => {
        const { minCredits, maxCredits } = parseCredits(course.credits);
        return {
            courseCode: course.course_id,
            name: course.name,
            minCredits,
            maxCredits,
            genEds: mapGenEds(course.gen_ed),
            conditions: mapRelationshipsToConditions(course.relationships),
            description: course.description,
            sections: (sectionsByCourse[course.course_id] ?? []).map(mapSection),
        };
    });
}

async function fetchCoursesByDept(deptCode: string, semester: string): Promise<UmdCourse[]> {
    const basePath = '/courses';
    const query: Record<string, string> = {
        semester: `${semester}|eq`,
        per_page: String(PAGE_SIZE),
        sort: 'course_id',
    };

    if (deptCode.length > 0) {
        query.dept_id = deptCode;
    }

    return fetchAllPages<UmdCourse>(basePath, query);
}

async function fetchCoursesByNumber(courseNumberPrefix: string, semester: string): Promise<UmdCourse[]> {
    const minifiedCourses = await fetchAllPages<UmdCourseListItem>('/courses/list', {
        semester: `${semester}|eq`,
        per_page: String(PAGE_SIZE),
        sort: 'course_id',
    });

    const matchingIds = minifiedCourses
        .map((course) => course.course_id)
        .filter((courseId) => {
            return courseId.length >= 7 && courseId.substring(4).startsWith(courseNumberPrefix);
        });

    if (matchingIds.length === 0) {
        return [];
    }

    const results: UmdCourse[] = [];
    for (const batch of chunkArray(matchingIds, COURSE_BATCH_SIZE)) {
        const path = `/courses/${encodeURIComponent(batch.join(','))}`;
        const courses = await fetchJson<UmdCourse[]>(path, {
            semester: `${semester}|eq`,
        });
        results.push(...courses);
    }

    return results;
}

async function fetchSectionsForCourses(
    courseIds: string[],
    semester: string
): Promise<Record<string, UmdSection[]>> {
    const byCourse: Record<string, UmdSection[]> = {};
    if (courseIds.length === 0) {
        return byCourse;
    }

    for (const batch of chunkArray(courseIds, COURSE_BATCH_SIZE)) {
        const path = `/courses/${encodeURIComponent(batch.join(','))}/sections`;
        const sections = await fetchJson<UmdSection[]>(path, {
            semester: `${semester}|eq`,
        });

        for (const section of sections) {
            const courseCode = section.course ?? section.course_id;
            if (!courseCode) {
                continue;
            }

            if (!byCourse[courseCode]) {
                byCourse[courseCode] = [];
            }
            byCourse[courseCode].push(section);
        }
    }

    return byCourse;
}

function applyServerSideFilters(
    courses: UmdCourse[],
    sectionsByCourse: Record<string, UmdSection[]>,
    filters?: ServerSideFilterParams
): UmdCourse[] {
    if (!filters) {
        return courses;
    }

    return courses.filter((course) => {
        if (filters.genEds && filters.genEds.length > 0) {
            const needed = filters.genEds.map((value) => value.code);
            const present = new Set((course.gen_ed ?? []).map((value) => value.toUpperCase()));
            for (const code of needed) {
                if (!present.has(code.toUpperCase())) {
                    return false;
                }
            }
        }

        if (filters.instructor && filters.instructor.length > 0) {
            const target = filters.instructor.trim().toLowerCase();
            const sections = sectionsByCourse[course.course_id] ?? [];
            const hasMatchingInstructor = sections.some((section) => {
                return (section.instructors ?? []).some((name) => {
                    return name.trim().toLowerCase() === target;
                });
            });

            if (!hasMatchingInstructor) {
                return false;
            }
        }

        return true;
    });
}

function mapSection(section: UmdSection): PlannerSection {
    const courseCode = section.course ?? section.course_id ?? '';
    const sectionCode = section.number ?? extractSectionCode(section.section_id) ?? 'TBA';
    const meetings = (section.meetings ?? []).map(mapMeeting).filter(Boolean);

    return {
        courseCode,
        sectionCode,
        instructors: section.instructors ?? [],
        meetings: meetings.length > 0 ? meetings : ['Unspecified'],
        openSeats: toNumber(section.open_seats),
        totalSeats: toNumber(section.seats),
        waitlist: toNumber(section.waitlist),
        holdfile: null,
    };
}

function mapMeeting(rawMeeting: unknown): any {
    if (!rawMeeting || typeof rawMeeting !== 'object') {
        return 'Unspecified';
    }

    const meeting = rawMeeting as Record<string, unknown>;
    const days = stringValue(
        meeting.days,
        meeting.day,
        meeting.weekdays,
        meeting['class_days']
    );
    const start = stringValue(
        meeting.start_time,
        meeting.start,
        meeting['meeting_start_time']
    );
    const end = stringValue(
        meeting.end_time,
        meeting.end,
        meeting['meeting_end_time']
    );

    const building = stringValue(
        meeting.building,
        meeting.bldg,
        meeting.location,
        meeting['building_code']
    );
    const room = stringValue(meeting.room, meeting['room_number']);

    if (days.toUpperCase() === 'TBA' || !start || !end) {
        if (building.toUpperCase().includes('ONLINE')) {
            return 'OnlineAsync';
        }
        return 'TBA';
    }

    return {
        classtime: {
            days,
            start: parseClock(start),
            end: parseClock(end),
        },
        location: {
            building,
            room: room.length > 0 ? room : null,
        },
    };
}

function mapGenEds(rawGenEds: string[] | null | undefined): GenEd[] | null {
    if (!rawGenEds || rawGenEds.length === 0) {
        return null;
    }

    const values: GenEd[] = [];
    for (const code of rawGenEds) {
        try {
            values.push(GenEd.fromCode(code));
        } catch {
            continue;
        }
    }

    return values.length > 0 ? values : null;
}

function mapRelationshipsToConditions(
    rawRelationships: Record<string, string[] | string | null> | null | undefined
): string[] | null {
    if (!rawRelationships) {
        return null;
    }

    const conditions: string[] = [];
    for (const [relation, value] of Object.entries(rawRelationships)) {
        if (Array.isArray(value) && value.length > 0) {
            conditions.push(`${relation}: ${value.join(', ')}`);
        } else if (typeof value === 'string' && value.length > 0) {
            conditions.push(`${relation}: ${value}`);
        }
    }

    return conditions.length > 0 ? conditions : null;
}

function parseCredits(rawCredits: string): { minCredits: number; maxCredits: number | null } {
    const trimmed = rawCredits.trim();
    if (trimmed.includes('-')) {
        const [minPart, maxPart] = trimmed.split('-');
        const minCredits = toNumber(minPart);
        const maxCredits = toNumber(maxPart);
        return {
            minCredits,
            maxCredits,
        };
    }

    return {
        minCredits: toNumber(trimmed),
        maxCredits: null,
    };
}

async function resolveSemester(
    term: string | undefined,
    year: number | undefined
): Promise<string> {
    if (!term) {
        const all = await fetchSemesters();
        return all[0] ?? `${new Date().getFullYear()}08`;
    }

    const plannerTerm = term as PlannerTerm;
    const available = await listAvailableTermYears();
    const matching = available.filter((option) => {
        if (option.term !== plannerTerm) {
            return false;
        }

        if (year === undefined || year === null) {
            return true;
        }

        return option.year === year;
    });

    if (matching.length > 0) {
        return matching[0].semester;
    }

    const fallback = await resolveMostRecentTermYear(plannerTerm);
    if (fallback) {
        return fallback.semester;
    }

    const all = await fetchSemesters();
    return all[0] ?? `${new Date().getFullYear()}08`;
}

async function fetchSemesters(): Promise<string[]> {
    if (semesterCache) {
        return semesterCache;
    }

    const data = await fetchJson<string[]>('/courses/semesters');
    semesterCache = [...data].sort((a, b) => b.localeCompare(a));
    return semesterCache;
}

function mapSemesterToTermYear(semester: string): AvailableTermYear | null {
    if (!/^[0-9]{6}$/.test(semester)) {
        return null;
    }

    const year = Number.parseInt(semester.substring(0, 4), 10);
    const code = semester.substring(4);
    let term: AcademicTerm | null = null;

    if (code === '01') {
        term = 'Spring';
    } else if (code === '05') {
        term = 'Summer';
    } else if (code === '08') {
        term = 'Fall';
    } else if (code === '12') {
        term = 'Winter';
    }

    if (!term) {
        return null;
    }

    return {
        term,
        year,
        semester,
    };
}

async function fetchAllPages<T>(path: string, query: Record<string, string>): Promise<T[]> {
    const output: T[] = [];
    let page = 1;

    while (true) {
        const rows = await fetchJson<T[]>(path, {
            ...query,
            page: String(page),
        });
        output.push(...rows);

        if (rows.length < PAGE_SIZE) {
            break;
        }

        page += 1;
    }

    return output;
}

async function fetchJson<T>(path: string, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, UMD_IO_BASE_URL);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            url.searchParams.set(key, value);
        }
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `umd.io request failed (${response.status} ${response.statusText}) ${path}${errorBody ? `\n${errorBody}` : ''}`
        );
    }

    return (await response.json()) as T;
}

function chunkArray<T>(values: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < values.length; i += size) {
        chunks.push(values.slice(i, i + size));
    }
    return chunks;
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function extractSectionCode(sectionId: string | undefined): string | null {
    if (!sectionId) {
        return null;
    }

    const dashIndex = sectionId.lastIndexOf('-');
    if (dashIndex === -1 || dashIndex === sectionId.length - 1) {
        return sectionId;
    }

    return sectionId.substring(dashIndex + 1);
}

function stringValue(...candidates: unknown[]): string {
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
    }

    return '';
}

function parseClock(value: string): number {
    const lower = value.toLowerCase().trim();
    const [hhRaw, mmRaw] = lower.split(':');
    const hoursRaw = Number.parseInt(hhRaw ?? '', 10);
    const minutesRaw = Number.parseInt((mmRaw ?? '').replace(/am|pm/g, ''), 10);

    let hours = Number.isFinite(hoursRaw) ? hoursRaw : 0;
    const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 0;

    if (lower.includes('pm') && hours < 12) {
        hours += 12;
    } else if (lower.includes('am') && hours === 12) {
        hours = 0;
    }

    return hours + minutes / 60;
}
