/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

import type { Instructor } from "@jupiterp/jupiterp";

/**
 * Get a course-lookup object which can be used to find courses given a 
 * department and course number.
 * 
 * @param departments An array of `Department`s with courses to be available
 *                      for lookup
 * 
 * @returns A `Record` which can match department-name inputs to another 
 *          `Record` matching course numbers to `Course` objects.
 */
export function getCourseLookup(departments: Department[]):
                                    Record<string, Record<string, Course>> {
    const result: Record<string, Record<string, Course>> = {};
    departments.forEach((dept) => {
        const deptName: string = dept.name;
        const deptCourses: Course[] = dept.courses;
        const deptRecord: Record<string, Course> = {};
        for (const course of deptCourses) {
            const courseNum = course.code.substring(4);
            deptRecord[courseNum] = course;
        }
        result[deptName] = deptRecord;
    });
    return result;
}

/**
 * Given an `input` (which should already be simplified to remove whitespace
 * and convert to uppercase) and a `courseLookup`, return a course name map
 * for the department matching the input, or an empty list if no department
 * matches the input. This will match input as soon as the input resolves to
 * a single department code (ex. if the input is "CMS", the only department
 * that starts with "CMS" is "CMSC", so it will return all courses in CMSC;
 * if the input is "C", it matches multiple departments, so it returns an
 * empty list).
 * @param input The input string, simplified to uppercase and without
 *                  whitespace.
 * @param courseLookup A `Record` used to match departments and course numbers
 *                      to `Course`s; can be generated using `getCourseLookup`
 * @param deptList A list of 4-letter department codes used to search courses.
 * @returns A `Record<string, Course>` mapping course numbers to `Course`s
 *          for the department matching the input, or an empty list if no
 *          department matches the input.
 */
function getDeptCoursesForInput(input: string, courseLookup: 
                            Record<string, Record<string, Course>>,
                            deptList: string[]): Record<string, Course> {
    // Requests to the API for a course search should be made as soon as there
    // is only a single resolvable department code for their search.
    if (input.length >= 1) {
        let deptInput = input.length > 4 ? 
                            input.substring(0, 4) : input;
        const possibleDepts: string[] = 
            deptList.filter((dept) => dept.startsWith(deptInput));
        if (possibleDepts.length == 1) {
            console.log(`Resolved department input "${input}" to "${possibleDepts[0]}"`);
            return courseLookup[possibleDepts[0]];
        }
    }

    return {};
}

/**
 * Given an `input`, search for courses in a `courseLookup` and return a list
 * of possible `Course`s.
 * 
 * @param input A string of input used to search for `Course`s
 * @param courseLookup A `Record` used to match departments and course numbers
 *                      to `Course`s; can be generated using `getCourseLookup`
 * @param deptList A list of departments used to search for courses by number
 * 
 * @returns An array of possible courses given the `input`.
 */
export function searchCourses(input: string, courseLookup: 
                            Record<string, Record<string, Course>>, deptList: string[]): Course[] {
    const result: Course[] = [];

    // Don't care about case or whitespace in searches
    const simpleInput: string = input.toUpperCase().replace(/\s/g, '');

    // For an `input` to be worth searching, it should be at least the four
    // letter department code, and the department code must be in 
    // `courseLookup`.
    const deptCourses = getDeptCoursesForInput(simpleInput, courseLookup, deptList);
    if (Object.keys(deptCourses).length > 0) {
        for (const courseCode in deptCourses) {
            let shouldBeInResult = true;
            const inputCode = simpleInput.substring(4);
            if (inputCode.length > courseCode.length) {
                shouldBeInResult = false;
            } else {
                for (let i = 0; i < inputCode.length; i++) { 
                    if (inputCode[i] != courseCode[i]) {
                        shouldBeInResult = false;
                    }
                }
            }
            if (shouldBeInResult) {
                result.push(deptCourses[courseCode]);
            }
        }
    } 
    
    // If the search input is just numbers, match courses with that number
    if (simpleInput.length >= 2 && /^[0-9]+$/i.test(simpleInput)) {

        // get all the courses from every department 
        const allDeptCourses: Record<string, Course> = {};
        for (const dept of deptList) {
            const deptCourses = courseLookup[dept];
            if (deptCourses !== undefined) {
                for (const courseCode in deptCourses) {
                    const uniqueCourseCode = `${dept}-${courseCode}`;
                    allDeptCourses[uniqueCourseCode] = deptCourses[courseCode];
                }
            }
        }

        for (const courseCode in allDeptCourses) {
            let shouldBeInResult = true;
            if (simpleInput.length > courseCode.length) {
                shouldBeInResult = false;
            } else {
                const courseNumber = courseCode.substring(5);
                for (let i = 0; i < simpleInput.length; i++) { 
                    if (simpleInput[i] != courseNumber[i]) {
                        shouldBeInResult = false;
                    }
                }
            }
            if (shouldBeInResult) {
                result.push(allDeptCourses[courseCode]);
            }
        }
    }
    
    return result;
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