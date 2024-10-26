/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview The `+page.ts` file is run by Svelte when `+page.svelte` is
 * loaded; its purpose is to load JSON data for instructors, departments, and
 * courses, which it returns as an object in the `load` function. Svelte will
 * automatically take the return value of `load` and assign that to `data` in
 * `+page.svelte`.
 */

import instructors from '../../../datagen/data/instructors.json';
import deptsAndCourses from '../../../datagen/data/departments.json';
import { getMinCredits } from '$lib/course-planner/Formatting';
import { SharedSelectionsStore } from '../stores/CoursePlannerStores';

/**
 * @returns An object containing parsed instructors and departments data.
 */
export function load({ url }): JupiterpData {
    const hasQueryParams = [...url.searchParams].length > 0;
    if (hasQueryParams) {
        const scheduleName: string | null = url.searchParams.get('name');
        if (scheduleName) {
            const selections: ScheduleSelection[] = [];
            let colorNumber = 0;
            url.searchParams.getAll('course').forEach((courseParam) => {
                const [courseCode, sec_code] = courseParam.split(':');
                if (courseCode && sec_code) {
                    const deptName = courseCode.slice(0, 4);
                    const dept = deptsAndCourses.find(department => department.name === deptName);
                    if (dept) {
                        const course = dept.courses.find(
                            aCourse => aCourse.code === courseCode
                        );
                        if (course && course.sections !== null) {
                            const section = course.sections.find(
                                aSection => 
                                    aSection.sec_code === sec_code
                            );
                            if (section) {
                                const selection: ScheduleSelection = {
                                    courseCode,
                                    section,
                                    hover: false,
                                    differences: [],
                                    credits: getMinCredits(course.credits),
                                    course: course,
                                    colorNumber: colorNumber++,
                                }
                                selections.push(selection);
                            }
                        }
                    }
                }
            });
            if (selections) {
                SharedSelectionsStore.set({
                    scheduleName,
                    selections
                });
            }
        }
    }

    return {
        professors: instructors,
        // See #5: This shows up as an error on VSCode because VSCode cannot
        // tokenize `departments.json` due to its large file size.
        departments: deptsAndCourses
    };
}