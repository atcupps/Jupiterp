<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
    import CourseSearch from '../components/course-planner/course-search/CourseSearch.svelte';
    import CurrentSchedulePanel from '../components/course-planner/schedule/CurrentSchedulePanel.svelte';
    import { onDestroy, onMount } from 'svelte';
    import {
        ensureUpToDateAndSetStores,
        resolveSelections,
        resolveStoredSchedules
    } from '../lib/course-planner/CourseLoad';
    import { getProfsLookup } from '$lib/course-planner/CourseSearch';
    import {
        ProfsLookupStore,
        CurrentScheduleStore,
        NonselectedScheduleStore,
        DepartmentsStore
    } from '../stores/CoursePlannerStores';
    import { client } from '$lib/client';
    import {
        getAuthUser,
        isSupabaseConfigured,
        loadUserSchedules,
        onAuthStateChanged,
        saveUserSchedules,
    } from '$lib/supabase';
    import {
        getDefaultTermYear,
        getMaxScheduleYear,
        MIN_SCHEDULE_YEAR,
        normalizeStoredSchedule,
    } from '$lib/course-planner/Terms';
    import {
        type Instructor,
        type InstructorsConfig, 
        type InstructorsResponse
    } from '@jupiterp/jupiterp';
    import type { ScheduleSelection, StoredSchedule } from '../types';

    // Function to retreive professor data; called in `onMount`.
    async function fetchProfessorData() {
        try {
            let limit = 500;
            let offset = 0;
            let allInstructors: Instructor[] = [];
            let config: InstructorsConfig = {
                limit: limit,
                offset: offset,
            };
            let complete = false;
            while (!complete) {
                const response: InstructorsResponse =
                    await client.activeInstructors(config);
                if (response.ok() && response.data != null) {
                    allInstructors = [...allInstructors, ...response.data];
                    if (response.data.length < limit) {
                        complete = true;
                        break;
                    }
                    offset += limit;
                    config.offset = offset;
                } else {
                    // format-check exempt 1
                    throw new Error(`Failed to fetch data: ${response.statusCode} ${response.statusMessage} ${response.errorBody}`);
                }
            }

            // Update the ProfsLookupStore with the fetched data
            ProfsLookupStore.set(getProfsLookup(allInstructors));
        }
        catch (error) {
            console.error('Error fetching professor data:', error);
        }
    }

    // Function to get list of department codes as an array of strings
    // and set the DepartmentsStore.
    async function fetchDeptCodes() {
        const res = await client.deptList();
        if (res.ok() && res.data != null) {
            const depts = res.data;
            DepartmentsStore.set(depts);
        } else {
            console.error('Error fetching department codes:', res.errorBody);
        }
    }

    // Keep track of chosen sections
    let currentSchedule: StoredSchedule;
    let hasReadLocalStorage: boolean = false;
    let authUserId: string | null = null;
    let authUnsubscribe: (() => void) | null = null;
    let cloudSyncTimeout: ReturnType<typeof setTimeout> | null = null;
    CurrentScheduleStore.subscribe((stored) => {
        if (hasReadLocalStorage) {
            currentSchedule = stored;

            // Save to local storage
            if (currentSchedule) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('selectedSections', 
                                jsonifySections(currentSchedule.selections));
                    localStorage.setItem(
                        'scheduleName', currentSchedule.scheduleName
                    );
                    localStorage.setItem('scheduleTerm', currentSchedule.term);
                    localStorage.setItem(
                        'scheduleYear',
                        currentSchedule.year.toString()
                    );
                }
            }

            queueCloudSync();
        }
    });

    let nonselectedSchedules: StoredSchedule[] = [];
    // Save non-selected schedules to local storage
    NonselectedScheduleStore.subscribe((stored) => {
        if (hasReadLocalStorage) {
            nonselectedSchedules = stored;

            // Save to local storage
            if (nonselectedSchedules) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(
                        'nonselectedSchedules', 
                        JSON.stringify(nonselectedSchedules)
                    );
                }
            }

            queueCloudSync();
        }
    })

    async function hydrateFromCloud(userId: string) {
        try {
            const cloudValue = await loadUserSchedules(userId);
            if (!cloudValue) {
                if (currentSchedule) {
                    await saveUserSchedules(userId, {
                        currentSchedule,
                        nonselectedSchedules,
                    });
                }
                return;
            }

            const defaultTermYear = getDefaultTermYear();
            const cloudCurrent = normalizeStoredSchedule(
                cloudValue.currentSchedule,
                defaultTermYear
            );
            const cloudNonselected =
                cloudValue.nonselectedSchedules.map((schedule) => {
                    return normalizeStoredSchedule(schedule, defaultTermYear);
                });

            ensureUpToDateAndSetStores(cloudCurrent, cloudNonselected);
        } catch (error) {
            console.error('Failed loading cloud schedules:', error);
        }
    }

    function queueCloudSync() {
        if (!hasReadLocalStorage || !authUserId || !currentSchedule) {
            return;
        }

        if (!isSupabaseConfigured()) {
            return;
        }

        if (cloudSyncTimeout !== null) {
            clearTimeout(cloudSyncTimeout);
        }

        cloudSyncTimeout = setTimeout(async () => {
            if (!authUserId) {
                return;
            }

            try {
                await saveUserSchedules(authUserId, {
                    currentSchedule,
                    nonselectedSchedules,
                });
            } catch (error) {
                console.error('Failed saving cloud schedules:', error);
            }
        }, 400);
    }

    onMount(() => {
        // Fetch instructor data from API
        fetchProfessorData();

        // Fetch department codes from API
        fetchDeptCodes();

        // Retrieve data from client local storage
        try {
            if (typeof window !== 'undefined') {
                // Get stored selections from local storage
                const storedSelectionsOption = 
                                localStorage.getItem('selectedSections');
                let storedSelections: ScheduleSelection[];
                if (storedSelectionsOption) {
                    storedSelections = 
                        resolveSelections(storedSelectionsOption);
                } else {
                    storedSelections = [];
                }

                // Get stored current schedule name from local storage
                const storedScheduleNameOption = 
                                localStorage.getItem('scheduleName');
                let storedScheduleName: string;
                if (storedScheduleNameOption) {
                    storedScheduleName = storedScheduleNameOption;
                } else {
                    storedScheduleName = "Schedule 1";
                }

                const defaultTermYear = getDefaultTermYear();
                const storedScheduleTermOption =
                    localStorage.getItem('scheduleTerm');
                const storedScheduleYearOption =
                    localStorage.getItem('scheduleYear');
                const parsedStoredYear = Number(storedScheduleYearOption);
                const maxScheduleYear = getMaxScheduleYear();
                const storedScheduleYear = Number.isInteger(parsedStoredYear) &&
                        parsedStoredYear >= MIN_SCHEDULE_YEAR &&
                        parsedStoredYear <= maxScheduleYear
                    ? parsedStoredYear
                    : defaultTermYear.year;

                const currentScheduleFromStorage: StoredSchedule = {
                    scheduleName: storedScheduleName,
                    selections: storedSelections,
                    term: (
                        storedScheduleTermOption === 'Winter' ||
                        storedScheduleTermOption === 'Spring' ||
                        storedScheduleTermOption === 'Summer' ||
                        storedScheduleTermOption === 'Fall'
                    )
                        ? storedScheduleTermOption
                        : defaultTermYear.term,
                    year: storedScheduleYear,
                };

                // Get stored non-selected schedules from local storage
                const storedNonselectedSchedulesOption = 
                                localStorage.getItem('nonselectedSchedules');
                let storedNonselectedSchedules: StoredSchedule[];
                if (storedNonselectedSchedulesOption) {
                    storedNonselectedSchedules = 
                        resolveStoredSchedules(
                            storedNonselectedSchedulesOption);
                } else {
                    storedNonselectedSchedules = [];
                }

                // Find differences between stored selections and
                // most up-to-date course data, and update accordingly.
                ensureUpToDateAndSetStores(
                    currentScheduleFromStorage,
                    storedNonselectedSchedules
                );

                currentSchedule = currentScheduleFromStorage;
                nonselectedSchedules = storedNonselectedSchedules;

                hasReadLocalStorage = true;

                if (isSupabaseConfigured()) {
                    getAuthUser().then((user) => {
                        authUserId = user?.id ?? null;
                        if (authUserId) {
                            hydrateFromCloud(authUserId);
                        }
                    });

                    authUnsubscribe = onAuthStateChanged((user) => {
                        const nextAuthId = user?.id ?? null;
                        if (nextAuthId === authUserId) {
                            return;
                        }

                        authUserId = nextAuthId;
                        if (authUserId) {
                            hydrateFromCloud(authUserId);
                        }
                    });
                }
            }
        } catch (e) {
            console.log('Unable to retrieve courses: ' + e);
            const defaultTermYear = getDefaultTermYear();
            CurrentScheduleStore.set({
                scheduleName: "Schedule 1",
                selections: [],
                term: defaultTermYear.term,
                year: defaultTermYear.year,
            });
            NonselectedScheduleStore.set([]);
        }
    });

    onDestroy(() => {
        if (authUnsubscribe) {
            authUnsubscribe();
        }

        if (cloudSyncTimeout !== null) {
            clearTimeout(cloudSyncTimeout);
        }
    });

    function jsonifySections(sections: ScheduleSelection[]): string {
        let finalSelections: ScheduleSelection[] = [];
        for (let section of sections) {
            if (!section.hover) {
                finalSelections.push(section);
            }
        }
        return JSON.stringify(finalSelections);
    }

    let sidebarWidth = 260;
    let addClassesLayoutContainer: HTMLDivElement;
    let resizingAddClassesSidebar = false;

    function startAddClassesResize(event: MouseEvent) {
        event.preventDefault();
        resizingAddClassesSidebar = true;
    }

    function stopAddClassesResize() {
        resizingAddClassesSidebar = false;
    }

    function onAddClassesResize(event: MouseEvent) {
        if (!resizingAddClassesSidebar || !addClassesLayoutContainer) {
            return;
        }

        const bounds = addClassesLayoutContainer.getBoundingClientRect();
        const minSidebar = 180;
        const maxSidebar = Math.max(minSidebar, bounds.width - 320);
        const proposed = event.clientX - bounds.left;
        sidebarWidth = Math.max(minSidebar, Math.min(560, Math.min(maxSidebar, proposed)));
    }

</script>

<svelte:window on:mousemove={onAddClassesResize}
    on:mouseup={stopAddClassesResize} />

<div class='fixed flex flex-col w-full px-2 lg:px-3
            text-textLight dark:text-textDark
            top-[3rem] lg:top-[3.5rem] xl:top-[4rem] bottom-0'>
    <div class='grow min-h-0 flex flex-row pt-2'
        bind:this={addClassesLayoutContainer}
        class:select-none={resizingAddClassesSidebar}>
        <CourseSearch
            {sidebarWidth} />

        <button class='flex w-2 cursor-col-resize items-center justify-center
                        hover:bg-hoverLight dark:hover:bg-hoverDark rounded-sm transition-colors'
                type='button'
                aria-label='Resize schedule list sidebar'
                on:mousedown={startAddClassesResize}>
            <div class='h-full w-px bg-divBorderLight dark:bg-divBorderDark
                        hover:bg-textLight dark:hover:bg-textDark transition-colors' />
        </button>

        <CurrentSchedulePanel />
    </div>
</div>