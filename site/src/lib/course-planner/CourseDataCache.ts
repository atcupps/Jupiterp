/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview A cache to store course data fetched from the API.
 */

import {
    SortBy,
    type Course,
    type CoursesWithSectionsConfig
} from "@jupiterp/jupiterp";
import { GenEd } from "@jupiterp/jupiterp";
import type { ServerSideFilterParams } from "../../types";
import { gatherCoursesFromUmdIo } from './UmdIoGatherer';
import { env } from '$env/dynamic/public';

type CourseDataSource = 'auto' | 'umd-io' | 'jupiter-api';

function getConfiguredCourseDataSource(): CourseDataSource {
    const value = (env.PUBLIC_COURSE_DATA_SOURCE ?? '').trim().toLowerCase();
    if (value === 'umd-io' || value === 'jupiter-api' || value === 'auto') {
        return value;
    }
    return 'auto';
}

export class CourseDataCache {
    /**
     * A cache storing data from the API. Matches a string constructed from
     * the request query and filter params to the cached data.
     */
    private cache: Record<string, CourseDataCacheEntry>;

    /**
     * Tracks in-flight requests so concurrent callers can await the same
     * promise instead of duplicating work.
     */
    private pendingRequests: Record<string, Promise<Course[]>>;

    /**
     * Incrementing counter used to derive a simple least-recently-used
     * ordering for cache entries.
     */
    private lruCounter: number = 0;

    /**
     * The current size of the cache (number of entries).
     */
    private size: number = 0;

    /**
     * The maximum number of entries to store in the cache.
     */
    private maxSize: number;

    /**
     * The most recently accessed department code. Since cache accesses are
     * asynchronous, this is used to validate that the list of courses used
     * in course search is the most recently requested one.
     */
    private mostRecentAccess: RequestInput | null = null;

    /**
     * @param maxSize The maximum number of entries to store in the cache.
     * Defaults to 20. When the cache exceeds this size, the least-recently
     * used entry will be removed.
     */
    constructor(maxSize: number = 20) {
        this.cache = {};
        this.pendingRequests = {};
        this.maxSize = maxSize;
    }

    /**
     * @returns The most recently-accessed department code, or `null` if no
     * accesses have been made yet.
     */
    public getMostRecentAccess(): RequestInput | null {
        return this.mostRecentAccess;
    }

    /**
     * Get course data for a department code. If the data is not in the
     * cache, it requests it from the API and stores it in the cache.
     * @returns A `Promise` which resolves to the list of `Course`s for
     *          the input.
     */
    public async getCoursesAndSections(input: RequestInput): Promise<Course[]> {
        const key = keyFromRequestInput(input);
        this.mostRecentAccess = input;
        const cacheEntry = this.cache[key];
        if (cacheEntry) {
            if (cacheEntry.status === "data") {
                this.lruCounter += 1;
                cacheEntry.lastUsed = this.lruCounter;
                return cacheEntry.data;
            }

            const pending = this.pendingRequests[key];
            if (cacheEntry.status === "request sent" && pending) {
                const data = await pending;
                const updatedEntry = this.cache[key];
                if (updatedEntry && updatedEntry.status === "data") {
                    this.lruCounter += 1;
                    updatedEntry.lastUsed = this.lruCounter;
                    return updatedEntry.data;
                }
                return data;
            }
        }

        const hadEntry = Boolean(cacheEntry);
        this.cache[key] = { status: "request sent" };
        const requestConfig =
            generateRequestConfig(input);
        this.pendingRequests[key] = 
            this.requestCoursesForDept(key, requestConfig, !hadEntry, input);
        if (!hadEntry) {
            this.size += 1;
        }

        try {
            return await this.pendingRequests[key];
        } finally {
            delete this.pendingRequests[key];
        }
    }

    private async requestCoursesForDept(
                    key: string, 
                    cfg: CoursesWithSectionsConfig,
                    isNewEntry: boolean,
                    input: RequestInput): Promise<Course[]> {
        try {
            const source = getConfiguredCourseDataSource();
            let courses: Course[];

            if (source === 'umd-io') {
                courses = await gatherCoursesFromUmdIo(input);
            } else if (source === 'jupiter-api') {
                courses = await fetchFromJupiterApi(key, cfg, input);
            } else {
                try {
                    courses = await gatherCoursesFromUmdIo(input);
                } catch {
                    courses = await fetchFromJupiterApi(key, cfg, input);
                }
            }

            const existingEntry = this.cache[key];
            if (!existingEntry || existingEntry.status !== "request sent") {
                return courses;
            }

            this.lruCounter += 1;
            this.cache[key] = {
                status: "data",
                data: courses,
                lastUsed: this.lruCounter
            };
            this.evictLeastRecentlyUsed(key);
            return courses;
        } catch (error) {
            if (key in this.cache) {
                delete this.cache[key];
                if (isNewEntry) {
                    this.size = Math.max(0, this.size - 1);
                }
            }
            throw error;
        }
    }

    private evictLeastRecentlyUsed(excludeKey: string): void {
        if (this.size <= this.maxSize) {
            return;
        }

        let candidateKey: string | null = null;
        let oldestMarker = Number.POSITIVE_INFINITY;

        for (const [key, entry] of Object.entries(this.cache)) {
            if (key === excludeKey) {
                continue;
            }

            if (entry.status === "data" && entry.lastUsed < oldestMarker) {
                oldestMarker = entry.lastUsed;
                candidateKey = key;
            }
        }

        if (candidateKey === null) {
            return;
        }

        if (candidateKey in this.cache) {
            delete this.cache[candidateKey];
            this.size = Math.max(0, this.size - 1);
            delete this.pendingRequests[candidateKey];
        }
    }

    public isPending(): boolean {
        // format-check exempt 2
        return this.mostRecentAccess !== null &&
                keyFromRequestInput(this.mostRecentAccess) in this.pendingRequests;
    }
}

function keyFromRequestInput(input: RequestInput): string {
    const filtersPart = JSON.stringify(input.filters);
    const semesterPart = input.semester ? `|semester:${input.semester}` : '';
    const termPart = input.term ? `|term:${input.term}` : '';
    const yearPart = input.year !== undefined && input.year !== null ? `|year:${input.year}` : '';
    return `${input.type}:${input.value}|filters:${filtersPart}${semesterPart}${termPart}${yearPart}`;
}

function generateRequestConfig(input: RequestInput): CoursesWithSectionsConfig {
    const cfg: CoursesWithSectionsConfig = {
        limit: 500,
        sortBy: new SortBy().ascending("course_code"),
    };

    const filters: ServerSideFilterParams = input.filters ?? {};

    if (input.type === "deptCode") {
        cfg.prefix = input.value;
    } else if (input.type === "courseNumber") {
        cfg.number = input.value;
    } else if (input.type === "courseCode") {
        cfg.courseCodes = new Set([input.value]);
    }

    if (filters.genEds && filters.genEds.length > 0) {
        cfg.genEds = new Set(filters.genEds);
    }

    if (filters.instructor && filters.instructor.length > 0) {
        cfg.instructor = filters.instructor;
    }

    return cfg;
}

type CourseDataCacheEntry =
    | { status: "request sent" }
    | { status: "data"; data: Course[]; lastUsed: number };

export interface RequestInput {
    type: "deptCode" | "courseNumber" | "courseCode";
    value: string;
    filters?: ServerSideFilterParams;
    semester?: string;
    term?: string;
    year?: number;
}

async function fetchFromJupiterApi(
    key: string,
    cfg: CoursesWithSectionsConfig,
    input: RequestInput
): Promise<Course[]> {
    const params = coursesWithSectionsQueryParams(cfg);
    if (input.term) {
        params.append('term', input.term);
    }
    if (input.year !== undefined && input.year !== null) {
        params.append('year', String(input.year));
    }

    const url = `https://api.jupiterp.com/v0/courses/withSections?${params.toString()}`;
    const res = await fetch(url);
    const statusCode = res.status;
    const statusMessage = res.statusText;

    if (!res.ok) {
        const errorBody = await res.text();
        // format-check exempt 2
        throw new Error(
            `API request to get courses for ${key} failed: ${statusCode} ${statusMessage}${errorBody ? `\n${errorBody}` : ''}`
        );
    }

    const raw = (await res.json()) as CourseRaw[];
    return raw.map(parseCourseRaw);
}

type CourseRaw = {
    course_code: string;
    name: string;
    min_credits: number;
    max_credits: number | null;
    gen_eds: string[] | null;
    conditions: string[] | null;
    description: string | null;
    sections: SectionRaw[] | null;
};

type SectionRaw = {
    course_code: string;
    sec_code: string;
    instructors: string[];
    meetings: string[];
    open_seats: number;
    total_seats: number;
    waitlist: number;
    holdfile: number | null;
};

function coursesWithSectionsQueryParams(cfg: CoursesWithSectionsConfig): URLSearchParams {
    const params = new URLSearchParams();

    if (cfg.courseCodes && cfg.courseCodes.size > 0) {
        params.append('courseCodes', Array.from(cfg.courseCodes).join(','));
    }

    if (cfg.prefix) {
        params.append('prefix', cfg.prefix);
    }

    if (cfg.number) {
        params.append('number', cfg.number);
    }

    if (cfg.genEds && cfg.genEds.size > 0) {
        const codes = Array.from(cfg.genEds).map((ge) => (ge as any).code ?? String(ge));
        params.append('genEds', codes.join(','));
    }

    if (cfg.limit !== null && cfg.limit !== undefined) {
        params.append('limit', String(cfg.limit));
    }

    if (cfg.offset !== null && cfg.offset !== undefined) {
        params.append('offset', String(cfg.offset));
    }

    if (cfg.creditFilters) {
        for (const clause of cfg.creditFilters.argsArray()) {
            params.append('credits', clause);
        }
    }

    if (cfg.sortBy && cfg.sortBy.length() > 0) {
        params.append('sortBy', cfg.sortBy.argsArray().join(','));
    }

    if (cfg.totalClassSize !== null && cfg.totalClassSize !== undefined) {
        params.append('totalClassSize', String(cfg.totalClassSize));
    }

    if (cfg.onlyOpen !== null && cfg.onlyOpen !== undefined) {
        params.append('onlyOpen', String(cfg.onlyOpen));
    }

    if (cfg.instructor) {
        params.append('instructor', cfg.instructor);
    }

    return params;
}

function parseCourseRaw(raw: CourseRaw): Course {
    return {
        courseCode: raw.course_code,
        name: raw.name,
        minCredits: raw.min_credits,
        maxCredits: raw.max_credits,
        genEds: raw.gen_eds ? raw.gen_eds.map(GenEd.fromCode) : null,
        conditions: raw.conditions,
        description: raw.description,
        sections: raw.sections ? raw.sections.map(parseSectionRaw) : null,
    };
}

function parseSectionRaw(raw: SectionRaw): any {
    const meetings = raw.meetings && raw.meetings.length > 0
        ? raw.meetings.map(parseMeeting)
        : ['No Sections'];

    return {
        courseCode: raw.course_code,
        sectionCode: raw.sec_code,
        instructors: raw.instructors,
        meetings,
        openSeats: raw.open_seats,
        totalSeats: raw.total_seats,
        waitlist: raw.waitlist,
        holdfile: raw.holdfile,
    };
}

function parseMeeting(raw: string): any {
    switch (raw) {
        case 'OnlineAsync':
        case 'Unknown':
        case 'TBA':
        case 'Unspecified':
            return raw;
        default:
            break;
    }

    const parts = raw.split('-');
    if (parts.length < 3) {
        return 'Unknown';
    }

    const days = parts[0];
    const start = parseClock(parts[1]);
    const end = parseClock(parts[2]);
    const building = parts[3] ?? '';
    const room = parts.length > 4 ? parts[4] : null;

    return {
        classtime: { days, start, end },
        location: { building, room },
    };
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