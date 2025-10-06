/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2025 Andrew Cupps
 * 
 * @fileoverview A cache to store course data fetched from the API.
 */

import type { Course, CoursesConfig } from "@jupiterp/jupiterp";
import { client } from "$lib/client";

export class CourseDataCache {
    /**
     * A cache storing data from the API. Matches department
     * codes to `Course[]`.
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
    private mostRecentAccess: string | null = null;

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
    public getMostRecentAccess(): string | null {
        return this.mostRecentAccess;
    }

    /**
     * Get course data for a department code. If the data is not in the
     * cache, it requests it from the API and stores it in the cache.
     * @returns A `Promise` which resolves to the list of `Course`s for
     *          the department code.
     */
    public async getCoursesForDept(input: RequestInput): Promise<Course[]> {
        this.mostRecentAccess = input.value;
        const cacheEntry = this.cache[input.value];
        if (cacheEntry) {
            if (cacheEntry.status === "data") {
                this.lruCounter += 1;
                cacheEntry.lastUsed = this.lruCounter;
                return cacheEntry.data;
            }

            const pending = this.pendingRequests[input.value];
            if (cacheEntry.status === "request sent" && pending) {
                const data = await pending;
                const updatedEntry = this.cache[input.value];
                if (updatedEntry && updatedEntry.status === "data") {
                    this.lruCounter += 1;
                    updatedEntry.lastUsed = this.lruCounter;
                    return updatedEntry.data;
                }
                return data;
            }
        }

        const hadEntry = Boolean(cacheEntry);
        this.cache[input.value] = { status: "request sent" };
        const requestConfig: CoursesConfig = 
            input.type === "deptCode" ?
            { prefix: input.value, limit: 500 } :
            { number: input.value, limit: 500 };
        this.pendingRequests[input.value] = 
            this.requestCoursesForDept(input.value, requestConfig, !hadEntry);
        if (!hadEntry) {
            this.size += 1;
        }

        try {
            return await this.pendingRequests[input.value];
        } finally {
            delete this.pendingRequests[input.value];
        }
    }

    private async requestCoursesForDept(input: string, 
                    cfg: CoursesConfig, isNewEntry: boolean): Promise<Course[]> {
        try {
            const response = await client.coursesWithSections(cfg);

            if (!response.ok()) {
                throw new Error(
                    `API request to get courses for ${input} failed: ${response.statusCode} ${response.statusMessage}`
                );
            }

            const courses = response.data;
            if (courses == null) {
                throw new Error(`Null course data returned for ${input}`);
            }

            const existingEntry = this.cache[input];
            if (!existingEntry || existingEntry.status !== "request sent") {
                return courses;
            }

            this.lruCounter += 1;
            this.cache[input] = { status: "data", data: courses, lastUsed: this.lruCounter };
            this.evictLeastRecentlyUsed(input);
            return courses;
        } catch (error) {
            if (input in this.cache) {
                delete this.cache[input];
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

            if (entry.status === "data") {
                if (entry.lastUsed < oldestMarker) {
                    oldestMarker = entry.lastUsed;
                    candidateKey = key;
                }
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
        return this.mostRecentAccess !== null 
                && this.mostRecentAccess in this.pendingRequests;
    }
}

type CourseDataCacheEntry =
    | { status: "request sent" }
    | { status: "data"; data: Course[]; lastUsed: number };

export interface RequestInput {
    type: "deptCode" | "courseNumber";
    value: string;
}