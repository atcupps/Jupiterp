export type Course = {
    id: string;
    title: string;
    credits: number;
    departmentId: string;
    description?: string;
    genEd?: string[];
    prerequisites?: string;
    also_offered_as?: string[],
    lastSyncedAt: string;
};

export type BaseCourseArea = string;

export type CSCourseArea =
    | "core"
    | "Area 1: Systems"
    | "Area 2: Info Processing"
    | "Area 3: Software Engineering and Programming Languages"
    | "Area 4: Theory"
    | "Area 5: Numerical Analysis";

export type RequirementRule<TArea extends BaseCourseArea> =
    | {
          type: "required-course";
          courseId: string;
          label?: string;
      }
    | {
          type: "choose-n-courses";
          count: number;
          from: string[];
          label?: string;
      }
    | {
          type: "choose-n-courses-from-x-areas";
          count: number;
          area: TArea[];
          label?: string;
      }
    | {
          type: "choose-n-areas";
          count: number;
          area: TArea[];
          label?: string;
      }
    | {
          type: "choose-course-pattern";
          count: number;
          departments: string[];
          minLevel?: number;
          maxLevel?: number;
          requiredPrereqs?: string[];
          excludedCrosslists?: string[];
          credits?: number[];
          label?: string;
      };

export type RequirementEvaluation<TArea extends BaseCourseArea>  =
    | {
          rule: RequirementRule<TArea>;
          satisfied: true;
          matchedCourses: string[];
      }
    | {
          rule: RequirementRule<TArea>;
          satisfied: false;
          matchedCourses: string[];
          missingCount?: number;
          missingCourses?: string[];
      };