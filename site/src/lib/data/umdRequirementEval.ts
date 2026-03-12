import type {
    CourseArea,
    RequirementEvaluation,
    RequirementRule,
} from "./umdTypes";
import { COURSE_AREAS } from "./umdRequirements";

export function courseHasArea(courseId: string, area: CourseArea): boolean {
    return COURSE_AREAS[courseId]?.includes(area) ?? false;
}


export function evaluateRequirement(
    rule: RequirementRule,
    completedCourseIds: string[]
): RequirementEvaluation {
    if (rule.type === "required-course") {
        const satisfied = completedCourseIds.includes(rule.courseId);

        return satisfied
            ? {
                  rule,
                  satisfied: true,
                  matchedCourses: [rule.courseId],
              }
            : {
                  rule,
                  satisfied: false,
                  matchedCourses: [],
                  missingCourses: [rule.courseId],
              };
    }

    if (rule.type === "choose-n-courses") {
        const matchedCourses = rule.from.filter((courseId) =>
            completedCourseIds.includes(courseId)
        );

        const satisfied = matchedCourses.length >= rule.count;

        return satisfied
            ? {
                  rule,
                  satisfied: true,
                  matchedCourses,
              }
            : {
                  rule,
                  satisfied: false,
                  matchedCourses,
                  missingCount: rule.count - matchedCourses.length,
                  missingCourses: rule.from.filter(
                      (courseId) => !completedCourseIds.includes(courseId)
                  ),
              };
    }

    if (rule.type === "choose-n-areas") {
        const matchedCourses = completedCourseIds.filter((courseId) =>
            courseHasArea(courseId, rule.area)
        );

        const satisfied = matchedCourses.length >= rule.count;

        return satisfied
            ? {
                  rule,
                  satisfied: true,
                  matchedCourses,
              }
            : {
                  rule,
                  satisfied: false,
                  matchedCourses,
                  missingCount: rule.count - matchedCourses.length,
              };
    }
    // For "choose-course-pattern", need to implement
    return {
        rule,
        satisfied: false,
        matchedCourses: [],
    };
}

export function evaluateRequirements(
    rules: RequirementRule[],
    completedCourseIds: string[]
): RequirementEvaluation[] {
    return rules.map((rule) => evaluateRequirement(rule, completedCourseIds));
}

export function areRequirementsSatisfied(
    rules: RequirementRule[],
    completedCourseIds: string[]
): boolean {
    return evaluateRequirements(rules, completedCourseIds).every(
        (result) => result.satisfied
    );
}