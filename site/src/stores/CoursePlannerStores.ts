import { getProfsLookup } from "$lib/course-planner/CourseSearch";
import { writable, type Writable } from "svelte/store";

// `Record<string, Professor>` for getting professor data from names
// Initially set to an empty record since the data used here is
// loaded in `+page.svelte`.
export const ProfsLookupStore: Writable<Record<string, Professor>> = 
                                                writable(getProfsLookup([]));

// Track which section is being hovered by the user in Course Search
export const HoveredSectionStore: Writable<ScheduleSelection | null> = 
                                                                writable(null);

// Track selected sections in current schedule
export const CurrentScheduleStore: Writable<StoredSchedule> = writable({
    scheduleName: "Schedule 1",
    selections: []
});

// Track stored schedules that are not the active current schedule
export const NonselectedScheduleStore: Writable<StoredSchedule[]> = 
                                                                writable([]);

// Number of seats in each course-section combination
export const SeatDataStore: Writable<Record<string, number[]>> = 
                                                            writable({});