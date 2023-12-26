// This file is part of Jupiterp: https://github.com/atcupps/Jupiterp

import instructors from '../../../datagen/data/instructors.json'
import deptsAndCourses from '../../../datagen/data/departments.json'

export function load(): JupiterpData {
    return {
        professors: instructors,
        // See #5: This shows up as an error on VSCode because VSCode cannot
        // tokenize `departments.json` due to its large file size.
        departments: deptsAndCourses
    };
}