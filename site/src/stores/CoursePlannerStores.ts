import type { Course, Department, Instructor } from "@jupiterp/jupiterp";
import { writable, type Writable } from "svelte/store";
import type { CourseSectionPair, ScheduleSelection, StoredSchedule } from "../types";

/** `Record<string, Instructor>` for getting instructor data from names
/* Initially set to an empty record since the data used here is
/* loaded in `+page.svelte`.
 */
export const ProfsLookupStore: Writable<Record<string, Instructor>> = 
                                                writable({});

/** Track which section is being hovered by the user in Course Search */
export const HoveredSectionStore: Writable<ScheduleSelection | null> = 
                                                                writable(null);

/** Track selected sections in current schedule */
export const CurrentScheduleStore: Writable<StoredSchedule> = writable({
    scheduleName: "Schedule 1",
    selections: []
});

/** Track stored schedules that are not the active current schedule */
export const NonselectedScheduleStore: Writable<StoredSchedule[]> = 
                                                                writable([]);

// Track current course displayed in course info section
export const CourseInfoPairStore: Writable<CourseSectionPair | null> =
                                                            writable(null);
/** List of departments */
export const DepartmentsStore: Writable<Department[]> = writable([]);

/** Search results */
export const SearchResultsStore: Writable<Course[]> = writable([]);

/** Potential department suggestions for partial searches */
export const DeptSuggestionsStore: Writable<string[]> = writable([]);
