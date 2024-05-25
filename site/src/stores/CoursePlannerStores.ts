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

// Track selected sections
export const SelectedSectionsStore: Writable<ScheduleSelection[]> = 
                                                                writable([]);