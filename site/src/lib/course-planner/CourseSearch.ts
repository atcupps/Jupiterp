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
import { DeptCodesStore, SearchResultsStore } from "../../stores/CoursePlannerStores";

const cache = new CourseDataCache();

// Load department list data
let deptList: string[];
DeptCodesStore.subscribe((codes) => { deptList = codes });

/**
 * Given an `input` (which should already be simplified to remove whitespace
 * and convert to uppercase), return a single department code that matches the
 * input if only one department matches the input, or `null` if either there
 * are no matching departments or multiple matching departments.
 * @param input 
 */
function resolveInputToDepartment(input: string): string | null {
    // You may think that if the input length is 4 or longer, we should just
    // use that as the input to get from the cache. But consider that we need
    // to check that the input is a valid department code, which is an O(n)
    // operation anyway. So there's no point in adding additional logic for the
    // case where the input length is a full department code.
    if (input.length >= 1) {
        let deptInput = input.length > 4 ? 
                            input.substring(0, 4) : input;
        const possibleDepts: string[] = 
            deptList.filter((dept) => dept.startsWith(deptInput));
        if (possibleDepts.length == 1) {
            return possibleDepts[0];
        }
    }

    return null;
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
    const dept = resolveInputToDepartment(simpleInput);
    if (dept !== null) {
        // Get from cache/API
        const deptCourses: Course[] = await cache.getCoursesForDept(dept);

        // Ensure that the department for this search is still the most recent
        // search. If not, abort to avoid displaying outdated results.
        if (cache.getMostRecentAccess() !== dept) {
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

    // Clear search results for now.
    SearchResultsStore.set([]);
    
    // If the search input is just numbers, match courses with that number
    // if (simpleInput.length >= 2 && /^[0-9]+$/i.test(simpleInput)) {

    //     // get all the courses from every department 
    //     const allDeptCourses: Record<string, Course> = {};
    //     for (const dept of deptList) {
    //         const deptCourses = courseLookup[dept];
    //         if (deptCourses !== undefined) {
    //             for (const courseCode in deptCourses) {
    //                 const uniqueCourseCode = `${dept}-${courseCode}`;
    //                 allDeptCourses[uniqueCourseCode] = deptCourses[courseCode];
    //             }
    //         }
    //     }

    //     for (const courseCode in allDeptCourses) {
    //         let shouldBeInResult = true;
    //         if (simpleInput.length > courseCode.length) {
    //             shouldBeInResult = false;
    //         } else {
    //             const courseNumber = courseCode.substring(5);
    //             for (let i = 0; i < simpleInput.length; i++) { 
    //                 if (simpleInput[i] != courseNumber[i]) {
    //                     shouldBeInResult = false;
    //                 }
    //             }
    //         }
    //         if (shouldBeInResult) {
    //             result.push(allDeptCourses[courseCode]);
    //         }
    //     }
    // }
    
    // return result;
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