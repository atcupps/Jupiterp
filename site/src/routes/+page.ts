import instructors from '../../../datagen/data/instructors.json'
import deptsAndCourses from '../../../datagen/data/departments.json'

export function load(): JupiterpData {
    return {
        professors: instructors,
        // TODO(5): Figure out why TS marks this as an error, despite not
        // causing any issues, or figure out if there are hidden issues.
        departments: deptsAndCourses
    };
}