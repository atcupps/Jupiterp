import type { BaseCourseArea, RequirementEvaluation, RequirementRule } from './umdTypes';
import { BASE_COURSE_AREA_MAPPING } from './umdRequirements';
import type { TabCtxType } from 'flowbite-svelte/Tabs.svelte';

export function courseHasArea(courseId: string, area: BaseCourseArea[]): boolean {
	return (
		BASE_COURSE_AREA_MAPPING[courseId]?.some((BaseCourseArea) => area.includes(BaseCourseArea)) ??
		false
	);
}

export function evaluateRequirement<TArea extends BaseCourseArea>(
	rule: RequirementRule<TArea>,
	completedCourseIds: string[]
): RequirementEvaluation<TArea> {
	if (rule.type === 'required-course') {
		const satisfied = completedCourseIds.includes(rule.courseId);

		return satisfied
			? {
					rule,
					satisfied: true,
					matchedCourses: [rule.courseId]
				}
			: {
					rule,
					satisfied: false,
					matchedCourses: [],
					missingCourses: [rule.courseId]
				};
	}

	if (rule.type === 'choose-n-courses') {
		const matchedCourses = rule.from.filter((courseId) => completedCourseIds.includes(courseId));

		const satisfied = matchedCourses.length >= rule.count;

		return satisfied
			? {
					rule,
					satisfied: true,
					matchedCourses
				}
			: {
					rule,
					satisfied: false,
					matchedCourses,
					missingCount: rule.count - matchedCourses.length,
					missingCourses: rule.from.filter((courseId) => !completedCourseIds.includes(courseId))
				};
	}

	if (rule.type === 'choose-n-areas') {
		const matchedCourses = completedCourseIds.filter((courseId) =>
			courseHasArea(courseId, rule.area)
		);

		const satisfied = matchedCourses.length >= rule.count;

		return satisfied
			? {
					rule,
					satisfied: true,
					matchedCourses
				}
			: {
					rule,
					satisfied: false,
					matchedCourses,
					missingCount: rule.count - matchedCourses.length
				};
	}
	// For "choose-course-pattern", need to implement
	return {
		rule,
		satisfied: false,
		matchedCourses: []
	};
}

export function evaluateRequirements<TArea extends BaseCourseArea>(
	rules: RequirementRule<TArea>[],
	completedCourseIds: string[]
): RequirementEvaluation<TArea>[] {
	return rules.map((rule) => evaluateRequirement(rule, completedCourseIds));
}

export function areRequirementsSatisfied<TArea extends BaseCourseArea>(
	rules: RequirementRule<TArea>[],
	completedCourseIds: string[]
): boolean {
	return evaluateRequirements(rules, completedCourseIds).every((result) => result.satisfied);
}
