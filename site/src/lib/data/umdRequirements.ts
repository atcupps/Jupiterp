import type { CourseArea, RequirementRule } from "./umdTypes";

export const COURSE_AREAS: Record<string, CourseArea[]> = {
    CMSC131: ["core"],
    CMSC133: ["core"],
    CMSC216: ["core"],
    CMSC250: ["core"],
    CMSC330: ["core"],
    CMSC351: ["core"],
};

export const CS_ALL_REQUIREMENTS: RequirementRule[] = [

    {
        type: "choose-n-courses",
        count: 1,
        from: ["CMSC131", "CMSC133"],
        label: "Intro programming sequence",
    },

    { type: "required-course", courseId: "CMSC132" },

    { type: "required-course", courseId: "CMSC216" },
    { type: "required-course", courseId: "CMSC250" },
    { type: "required-course", courseId: "CMSC330" },
    { type: "required-course", courseId: "CMSC351" },

    { type: "required-course", courseId: "MATH140" },
    { type: "required-course", courseId: "MATH141" },
    {
        type: "choose-course-pattern",
        count: 1,
        departments: ["STAT"],
        minLevel: 400,
        requiredPrereqs: ["MATH141"],
        excludedCrosslists: ["CMSC"],
        credits: [3],
        label: "STAT4XX (3) with prerequisite MATH141, not cross-listed with CMSC",
    },
    {
        type: "choose-course-pattern",
        count: 1,
        departments: ["MATH", "STAT"],
        minLevel: 300,
        requiredPrereqs: ["MATH141"],
        excludedCrosslists: ["CMSC"],
        credits: [3, 4],
        label: "MATH/STATXXX (3/4) with prerequisite MATH141, not cross-listed with CMSC",
    },
];

export const CS_GENERAL_TRACK_REQUIREMENTS: RequirementRule[] = [
    ...CS_ALL_REQUIREMENTS,
    {
        type: "choose-n-courses",
        count: 2,
        from: ["CMSC411", "CMSC412", "CMSC414", "CMSC417"],
        label: "Systems electives",
    },
    {
        type: "choose-n-areas",
        count: 1,
        area: "ai",
        label: "At least one AI course",
    },
];