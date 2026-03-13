import type { CSCourseArea, BaseCourseArea, RequirementRule } from "./umdTypes";

export const BASE_COURSE_AREA_MAPPING: Record<string, BaseCourseArea[]> = {};

export const CS_COURSE_AREA_MAPPING: Record<string, CSCourseArea[]> = {
    CMSC131: ["core"],
    CMSC133: ["core"],
    CMSC216: ["core"],
    CMSC250: ["core"],
    CMSC330: ["core"],
    CMSC351: ["core"],
    CMSC411: ["Area 1: Systems"],
    CMSC412: ["Area 1: Systems"],
    CMSC414: ["Area 1: Systems"],
    CMSC417: ["Area 1: Systems"],
    CMSC498B: ["Area 1: Systems"],
    CMSC498C: ["Area 1: Systems"],
    CMSC420: ["Area 2: Info Processing"],
    CMSC421: ["Area 2: Info Processing"],
    CMSC422: ["Area 2: Info Processing"],
    CMSC423: ["Area 2: Info Processing"],
    CMSC424: ["Area 2: Info Processing"],
    CMSC426: ["Area 2: Info Processing"],
    CMSC427: ["Area 2: Info Processing"],
    CMSC470: ["Area 2: Info Processing"],
    CMSC471: ["Area 2: Info Processing", "Area 3: Software Engineering and Programming Languages"],
    CMSC498D: ["Area 2: Info Processing"],
    CMSC498E: ["Area 2: Info Processing"],
    CMSC498F: ["Area 2: Info Processing"],
    CMSC498K: ["Area 2: Info Processing"],
    CMSC498Y: ["Area 2: Info Processing"],
    CMSC498Z: ["Area 2: Info Processing"],
    CMSC430: ["Area 3: Software Engineering and Programming Languages"],
    CMSC433: ["Area 3: Software Engineering and Programming Languages"],
    CMSC434: ["Area 3: Software Engineering and Programming Languages"],
    CMSC435: ["Area 3: Software Engineering and Programming Languages"],
    CMSC436: ["Area 3: Software Engineering and Programming Languages"],
    CMSC498G: ["Area 3: Software Engineering and Programming Languages"],
    CMSC498J: ["Area 3: Software Engineering and Programming Languages"],
    CMSC451: ["Area 4: Theory"],
    CMSC452: ["Area 4: Theory"],
    CMSC454: ["Area 4: Theory"],
    CMSC456: ["Area 4: Theory"],
    CMSC457: ["Area 4: Theory"],
    CMSC474: ["Area 4: Theory"],
    CMSC460: ["Area 5: Numerical Analysis"],
    CMSC466: ["Area 5: Numerical Analysis"],

};

export const CS_ALL_REQUIREMENTS: RequirementRule<CSCourseArea>[] = [

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

export const CS_GENERAL_TRACK_REQUIREMENTS: RequirementRule<CSCourseArea>[] = [
    ...CS_ALL_REQUIREMENTS,
    {
        type: "choose-n-courses",
        count: 2,
        from: ["CMSC411", "CMSC412", "CMSC414", "CMSC417"],
        label: "Systems electives",
    },
    {
        type: "choose-n-areas",
        count: 3,
        area: ["Area 1: Systems", "Area 2: Info Processing", "Area 3: Software Engineering and Programming Languages", "Area 4: Theory"],
        label: "At least 3 areas",
    },
    {
        type: "choose-n-courses-from-x-areas",
        count: 5,
        area: ["Area 1: Systems", "Area 2: Info Processing", "Area 3: Software Engineering and Programming Languages", "Area 4: Theory"],
        label: "At least 3 areas",
    },
    // NOTE implement the 2 electives requirement - complicated
    // Need to have any area with more then 3 courses count as elective
    // then also have elective courses themselfs count as elective
    // TODO
];