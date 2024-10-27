/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview Functions relating to searching for courses in Jupiterp.
 */

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
    // For an `input` to be worth searching, it should be at least the four
    // letter department code, and the department code must be in 
    // `courseLookup`. Jupiterp also doesn't care about whitespace, so it is 
    // removed.
    const simpleInput: string = input.toUpperCase().replace(/\s/g, '');
    if (simpleInput.length >= 4) {
        const dept: string = simpleInput.substring(0, 4);
        const deptCourses: Record<string, Course> = courseLookup[dept];
      
        if (deptCourses != undefined) {
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
    } 
    
    // If the search input is just numbers, match courses with that number
    if (simpleInput.length >= 1 && /^[0-9]+$/i.test(simpleInput)) {

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
 * Creates and returns an object mapping professor names to `Professor`s.
 * If there are multiple `Professor`s in `profs` with the same `name`,
 * neither will be in the result because in `CourseSearch`, professors'
 * ratings and slugs will only be looked for on the basis of their name, absent
 * of any additional information like what course they are teaching.
 * @param profs An array `Professor[]` to be included in a lookup
 * @returns A `Record<string, Professor>` where professor names as `string`s
 *              are mapped to `Professor` objects.
 */
export function getProfsLookup(profs: Professor[]): Record<string, Professor> {
    const result: Record<string, Professor> = {};
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