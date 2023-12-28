/**
 * This file is part of Jupiterp: https://github.com/atcupps/Jupiterp
 * 
 * @fileoverview The `+page.ts` file is run by Svelte when `+page.svlete` is
 * loaded; its purpose is to load JSON data for instructors, departments, and
 * courses, which it returns as an object in the `load` function. Svelte will
 * automatically take the return value of `load` and assign that to `data` in
 * `+page.svelte`.
 */

import instructors from '../../../datagen/data/instructors.json'
import deptsAndCourses from '../../../datagen/data/departments.json'

/**
 * @returns An object containing parsed instructors and departments data.
 */
export function load(): JupiterpData {
    return {
        professors: instructors,
        // See #5: This shows up as an error on VSCode because VSCode cannot
        // tokenize `departments.json` due to its large file size.
        departments: deptsAndCourses
    };
}