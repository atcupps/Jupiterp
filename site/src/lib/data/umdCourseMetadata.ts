import type { Course, BaseCourseArea, RequirementRule } from "./umdTypes";
import { BASE_COURSE_AREA_MAPPING } from "./umdRequirements";

export type CourseWithMetadata<TArea extends BaseCourseArea> = Course & {
    required: boolean;
    areas: TArea[];
};

export function isRequiredCourse<TArea extends BaseCourseArea>(
    courseId: string,
    rules: RequirementRule<TArea>[]
): boolean {
    return rules.some(
        (rule) => rule.type === "required-course" && rule.courseId === courseId
    );
}

export function getCourseAreas(courseId: string): BaseCourseArea[] {
    return BASE_COURSE_AREA_MAPPING[courseId] ?? [];
}

export function attachRequirementMetadata<TArea extends BaseCourseArea>(
    courses: Course[],
    rules: RequirementRule<TArea>[]
): CourseWithMetadata<TArea>[] {
    return courses.map((course) => ({
        ...course,
        required: isRequiredCourse(course.id, rules),
        areas: getCourseAreas(course.id) as TArea[],
    }));
}