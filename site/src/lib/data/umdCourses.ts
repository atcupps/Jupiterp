import rawCourses from "../../../data/normalized/umdCourses.json";
import type { Course } from "./umdTypes";

export const UMD_COURSES: Course[] = rawCourses as Course[];

export function getCourseById(courseId: string): Course | undefined {
    return UMD_COURSES.find((course) => course.id === courseId);
}

export function getCoursesByDepartment(departmentId: string): Course[] {
    return UMD_COURSES.filter((course) => course.departmentId === departmentId);
}