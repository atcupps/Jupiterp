/**
 * This file is part of Jupiterp: https://github.com/atcupps/Jupiterp
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
 * 
 * @returns An array of possible courses given the `input`.
 */
export function searchCourses(input: string, courseLookup: 
                            Record<string, Record<string, Course>>): Course[] {
    const result: Course[] = [];
    // For an `input` to be worth searching, it should be at least the four
    // letter department code, and the department code must be in 
    // `courseLookup`.
    if (input.length >= 4) {
        const dept: string = input.substring(0, 4);
        const deptCourses: Record<string, Course> = courseLookup[dept];
        if (deptCourses != undefined) {
            for (const courseCode in deptCourses) {
                let shouldBeInResult = true;
                const inputCode = input.substring(4);
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

    return result;
}