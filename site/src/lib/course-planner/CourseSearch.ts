/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

import type { Course, Instructor } from "@jupiterp/jupiterp";
import { CourseDataCache } from "./CourseDataCache";
import { DepartmentsStore, DeptSuggestionsStore, SearchResultsStore } from "../../stores/CoursePlannerStores";

const cache = new CourseDataCache();

// Load department list data
let deptCodes: string[];
export let deptCodeToName: Record<string, string> = {};
DepartmentsStore.subscribe((depts) => {
    deptCodes = depts.map(dept => dept.deptCode);
    deptCodeToName = {};
    depts.forEach(dept => {
        deptCodeToName[dept.deptCode] = dept.name;
    });
});

/**
 * Given an `input` (which should already be simplified to remove whitespace
 * and convert to uppercase), returns a list of department codes that match the
 * input.
 * @param input 
 */
function resolveInputToDepartment(input: string): string[] {
    if (!deptCodes || input.length < 1) {
        return [];
    }

    // You may think that if the input length is 4 or longer, we should just
    // use that as the input to get from the cache. But consider that we need
    // to check that the input is a valid department code, which is an O(n)
    // operation anyway. So there's no point in adding additional logic for the
    // case where the input length is a full department code.
    const deptInput = input.length > 4 ? input.substring(0, 4) : input;
    const possibleDepts: string[] =
        deptCodes.filter((dept) => dept.startsWith(deptInput));

    return possibleDepts;
}

/**
 * Given an `input`, search for any matching courses in the course data cache
 * (which retrieves from the API if necessary) and sets the `SearchResultsStore`
 * to the list of matching courses.
 * @param input A search input string
 */
export async function setSearchResults(input: string) {
    // Don't care about case or whitespace in searches
    const simpleInput: string = input.toUpperCase().replace(/\s/g, '');

    // If the search input matches a department code, get the courses for that
    // department and then filter by course number.
    const matchingDepts = resolveInputToDepartment(simpleInput);
    const shouldShowSuggestions =
        simpleInput.length > 0 && matchingDepts.length > 1;
    DeptSuggestionsStore.set(shouldShowSuggestions ? matchingDepts : []);

    if (matchingDepts.length === 1) {
        DeptSuggestionsStore.set([]);
        // Get from cache/API
        const deptCourses: Course[] = 
            (await cache.getCoursesForDept({
                type: "deptCode",
                value: matchingDepts[0]
            }))
            .sort((a, b) => {
                return a.courseCode.localeCompare(b.courseCode);
            });

        // Ensure that the department for this search is still the most recent
        // search. If not, abort to avoid displaying outdated results.
        if (cache.getMostRecentAccess() !== matchingDepts[0]) {
            return;
        }

        // If the input contains no numbers, all dept courses are matching.
        if (simpleInput.length <= 4) {
            SearchResultsStore.set(deptCourses);
            return;
        }

        // Otherwise, filter by course number
        const inputCode = simpleInput.substring(4);
        const matchingCourses = deptCourses.filter((course) => {
            return course.courseCode.startsWith(inputCode, 4);
        });
        SearchResultsStore.set(matchingCourses);
        return;
    }

    // If we reach here, the input does not match a single department code.
    // This could be because the input is just numbers, or because it is
    // not a valid department code.

    // If the search is 3 numbers and optionally a letter,
    // match courses with the number (+ letter).
    if (simpleInput.length >= 3 && /^[0-9]{3}[A-Z]?$/i.test(simpleInput)) {
        const numberInput = simpleInput.substring(0, 3);
        const courses: Course[] =
            (await cache.getCoursesForDept({
                type: "courseNumber",
                value: numberInput
            }))
            .filter((course) => {
                return course.courseCode
                        .substring(4)
                        .toUpperCase()
                        .startsWith(simpleInput);
            });

        SearchResultsStore.set(courses);
        return;
    }

    // If we reach here, the input is not a valid department code or a course
    // number. Clear results.
    SearchResultsStore.set([]);
    return;
}

/**
 * Creates and returns an object mapping instructor names to `Instructor`s.
 * If there are multiple `Instructor`s in `profs` with the same `name`,
 * neither will be in the result because in `CourseSearch`, instructors'
 * ratings and slugs will only be looked for on the basis of their name, absent
 * of any additional information like what course they are teaching.
 * @param profs An array `Instructor[]` to be included in a lookup
 * @returns A `Record<string, Instructor>` where instructor names as `string`s
 *              are mapped to `Instructor` objects.
 */
export function getProfsLookup(profs: Instructor[]): Record<string, Instructor> {
    const result: Record<string, Instructor> = {};
    const names: Set<string> = new Set<string>();
    for (const prof of profs) {
        const name = prof.name;
        if (names.has(name)) {
            delete result[name];
        } else {
            result[name] = prof;
            names.add(name);
        }
    }
    return result;
}

/**
 * Returns true if the most recent request is still awaiting results.
 */
export function pendingResults(): boolean {
    const result = cache.isPending();
    return result;
}