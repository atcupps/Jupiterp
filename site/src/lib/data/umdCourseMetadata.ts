import type { Course, CourseArea, RequirementRule } from "./umdTypes";
import { COURSE_AREAS } from "./umdRequirements";

export type CourseWithMetadata = Course & {
    required: boolean;
    areas: CourseArea[];
};

export function isRequiredCourse(
    courseId: string,
    rules: RequirementRule[]
): boolean {
    return rules.some(
        (rule) => rule.type === "required-course" && rule.courseId === courseId
    );
}

export function getCourseAreas(courseId: string): CourseArea[] {
    return COURSE_AREAS[courseId] ?? [];
}

export function attachRequirementMetadata(
    courses: Course[],
    rules: RequirementRule[]
): CourseWithMetadata[] {
    return courses.map((course) => ({
        ...course,
        required: isRequiredCourse(course.id, rules),
        areas: getCourseAreas(course.id),
    }));
}