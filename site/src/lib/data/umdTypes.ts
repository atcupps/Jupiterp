export type Course = {
    id: string;
    title: string;
    credits: number;
    departmentId: string;
    description?: string;
    genEd?: string[];
    prerequisites?: string;
    lastSyncedAt: string;
};

export type CourseArea =
    | "core"
    | "systems"
    | "theory"
    | "ai"
    | "data"
    | "math"
    | "security"
    | "science"
    | "elective";

export type RequirementRule =
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
          type: "choose-n-areas";
          count: number;
          area: CourseArea;
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

export type RequirementEvaluation =
    | {
          rule: RequirementRule;
          satisfied: true;
          matchedCourses: string[];
      }
    | {
          rule: RequirementRule;
          satisfied: false;
          matchedCourses: string[];
          missingCount?: number;
          missingCourses?: string[];
      };