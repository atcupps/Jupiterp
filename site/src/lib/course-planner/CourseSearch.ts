/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

import type { Course, Instructor } from "@jupiterp/jupiterp";
import { CourseDataCache, type RequestInput } from "./CourseDataCache";
import {
    DepartmentsStore,
    DeptSuggestionsStore,
    SearchResultsStore,
    ProfsLookupStore,
    CourseSearchFilterStore,
} from "../../stores/CoursePlannerStores";
import type { FilterParams } from "../../types";

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

// Load professor name data
let profNames: string[] = [];
let profNamesReverse: string[] = [];
ProfsLookupStore.subscribe((profs) => {
    profNames = Object.keys(profs);
    profNames.sort();

    profNamesReverse = profNames.map((name) => {
        const parts = name.split(' ');
        if (parts.length < 2) {
            return name;
        }

        const lastName = parts.pop();
        const firstNames = parts.join(' ');
        return `${lastName}, ${firstNames}`;
    });
    profNamesReverse.sort();
});

let mostRecentInput: string = "";

// Filtering data
let filters: FilterParams = {
    serverSideFilters: {},
    clientSideFilters: {}
};
CourseSearchFilterStore.subscribe((newFilters) => {
    filters = newFilters;
    setSearchResults(mostRecentInput);
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

function filterAndSortCourseArray(courses: Course[]): Course[] {
    const sorted = courses.sort((a, b) => {
        return a.courseCode.localeCompare(b.courseCode);
    });

    const fs = filters.clientSideFilters;

    const filtered = fs.onlyOpen !== true ? sorted :
        sorted.map((course) => {
            if (course.sections === null || course.sections.length === 0) {
                return course;
            }

            const openSections = course.sections.filter((section) => {
                return section.openSeats > 0;
            });

            return {
                ...course,
                sections: openSections,
            };
        });

    if (fs.maxCredits === undefined && fs.minCredits === undefined && 
        (fs.onlyOpen === undefined || fs.onlyOpen === false)) {
        return sorted;
    }

    return filtered.filter((course) => {
        if (fs.onlyOpen === true && 
            (course.sections === null || course.sections.length === 0)) {
            return false;
        }

        const maxCredits = fs.maxCredits ?? Number.MAX_SAFE_INTEGER;
        const minCredits = fs.minCredits ?? 0;
        
        if (course.maxCredits === null) {
            return course.minCredits >= minCredits && course.minCredits <= maxCredits;
        } else {
            return course.minCredits <= maxCredits && course.maxCredits >= minCredits;
        }
    });
}

/**
 * Given an `input`, search for any matching courses in the course data cache
 * (which retrieves from the API if necessary) and sets the `SearchResultsStore`
 * to the list of matching courses.
 * @param input A search input string
 */
export async function setSearchResults(input: string) {
    mostRecentInput = input;

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
        console.log(`Searching for dept: ${matchingDepts[0]}`);

        // Generate cache request input
        const requestInput: RequestInput = {
            type: "deptCode",
            value: matchingDepts[0],
            filters: filters.serverSideFilters,
        }

        // Get from cache/API
        const deptCourses: Course[] = 
            filterAndSortCourseArray(await cache.getCoursesAndSections(requestInput));

        // Ensure that the department for this search is still the most recent
        // search. If not, abort to avoid displaying outdated results.
        if (cache.getMostRecentAccess() !== requestInput) {
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

        const requestInput: RequestInput = {
            type: "courseNumber",
            value: numberInput,
            filters: filters.serverSideFilters,
        }

        const courses: Course[] =
            filterAndSortCourseArray(
                (await cache.getCoursesAndSections(requestInput))
                .filter((course) => {
                    // API only matches the number, but the input may
                    // include a letter suffix as well. Filter that here.
                    return course.courseCode
                            .substring(4)
                            .toUpperCase()
                            .startsWith(simpleInput);
                }));
        
        // Ensure that the course number for this search is still the most recent
        // search. If not, abort to avoid displaying outdated results.
        if (cache.getMostRecentAccess() !== requestInput) {
            return;
        }

        SearchResultsStore.set(courses);
        return;
    }

    // If we reach here, the input is not a valid department code or a course
    // number. If there is an instructor or GenEd filter applied, we can search
    // all courses for matches. Only do this if search is empty.
    const fs = filters.serverSideFilters;
    if (simpleInput.length === 0 
            && ((fs.genEds !== undefined && fs.genEds.length > 0) 
                || (fs.instructor !== undefined && fs.instructor.length > 0))) {
        const requestInput: RequestInput = {
            type: "deptCode",
            value: "", // Empty prefix to get all courses
            filters: filters.serverSideFilters,
        }

        const courses: Course[] =
            filterAndSortCourseArray(await cache.getCoursesAndSections(requestInput));

        // Ensure that the course number for this search is still the most recent
        // search. If not, abort to avoid displaying outdated results.
        if (cache.getMostRecentAccess() !== requestInput) {
            return;
        }

        SearchResultsStore.set(courses);
        return;
    }

    // If these filters aren't applied, clear results.
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

/**
 * Given a partial or un-formatted professor name, returns an array of
 * all matching standardized professor names. Also searches by last name.
 * @param partial A partial or un-formatted professor name
 */
export function matchingStandardizedProfessorNames(partial: string): string[] {
    const simpleInput: string = partial.toUpperCase().replace(/\s/g, '');
    const matches: string[] = [];
    for (const profName of profNames) {
        const simpleProfName: string =
            profName.toUpperCase().replace(/\s/g, '');
        if (simpleProfName.startsWith(simpleInput)) {
            matches.push(profName);
        }
    }
    for (const profName of profNamesReverse) {
        const simpleProfName: string =
            profName.toUpperCase().replace(/\s/g, '');
        if (simpleProfName.startsWith(simpleInput)) {
            // Convert back to normal name order
            const parts = profName.split(', ');
            if (parts.length < 2) {
                continue;
            }
            const firstNames = parts[1];
            const lastName = parts[0];
            const normalName = `${firstNames} ${lastName}`;
            if (!matches.includes(normalName)) {
                matches.push(normalName);
            }
        }
    }
    return matches;
}