<script lang='ts'>
    import {
        AngleRightOutline, PlusOutline, TrashBinOutline
    } from "flowbite-svelte-icons";
    import {
        CurrentScheduleStore, NonselectedScheduleStore
    } from "../../../stores/CoursePlannerStores";
    import ScheduleOptionsDropdown from "./ScheduleOptionsDropdown.svelte";
    import { slide } from "svelte/transition";
    import { onMount } from "svelte";

    let dropdownOpen: boolean = false;

    let currentScheduleName: string;
    let currentScheduleSelections: ScheduleSelection[];
    CurrentScheduleStore.subscribe((stored) => {
        currentScheduleName = stored.scheduleName;
        currentScheduleSelections = stored.selections;
    });

    function changeScheduleName() {
        const inputScheduleName = scheduleNameElement.value;
        if (inputScheduleName.trim().length > 0) {
            currentScheduleName = enumeratedScheduleName(inputScheduleName, nonselectedSchedules);
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });
        }
        else {
            currentScheduleName = enumeratedScheduleName('My schedule', nonselectedSchedules);
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });
        }
    }

    function enumeratedScheduleName(
                    defaultName: string, schedules: StoredSchedule[]): string {
        let scheduleNames: Set<string> = new Set<string>();
        schedules.forEach((elt) => { scheduleNames.add(elt.scheduleName) });
        if (scheduleNames.has(defaultName)) {
            let i = 1;
            while (scheduleNames.has(defaultName + ' (' + i + ')')) {
                i++;
            }
            return defaultName + ' (' + i + ')';
        } else {
            return defaultName;
        }
    }

    let scheduleNameElement: HTMLInputElement;
    $: if (currentScheduleName && scheduleNameElement) {
        scheduleNameElement.value = currentScheduleName;
    }

    let nonselectedSchedules: StoredSchedule[] = [];
    NonselectedScheduleStore.subscribe((stored) => {
        nonselectedSchedules = stored;
    });

    function changeSchedule(newSchedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(newSchedule);
        if (index === -1) {
            // This should not be possible
            console.log('Could not find schedule: '+ newSchedule.scheduleName);
        }
        else {
            const scheduleToReplace: StoredSchedule = {
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            }
            nonselectedSchedules.splice(index, 1);
            nonselectedSchedules = [scheduleToReplace,...nonselectedSchedules];
            currentScheduleName = newSchedule.scheduleName;
            currentScheduleSelections = newSchedule.selections;
            
            CurrentScheduleStore.set({
                scheduleName: currentScheduleName,
                selections: currentScheduleSelections
            });

            NonselectedScheduleStore.set(nonselectedSchedules);
        }
        dropdownOpen = false;
    }

    function createNewSchedule() {
        const oldSchedule: StoredSchedule = {
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections
        };
        nonselectedSchedules = [oldSchedule, ...nonselectedSchedules];
        NonselectedScheduleStore.set(nonselectedSchedules);
        currentScheduleName = enumeratedScheduleName(
            'My schedule',
            nonselectedSchedules
        );
        currentScheduleSelections = [];
        CurrentScheduleStore.set({
            scheduleName: currentScheduleName,
            selections: currentScheduleSelections
        });
    }

    function deleteNonselectedSchedule(schedule: StoredSchedule) {
        const index = nonselectedSchedules.indexOf(schedule);
        if (index === -1) {
            // This should not be possible
            console.log('Could not find schedule: ' + schedule.scheduleName);
        }
        else {
            nonselectedSchedules.splice(index, 1);
            NonselectedScheduleStore.set(nonselectedSchedules);
        }
    }
</script>

<div class='flex w-full flex-col'>
    <div class='flex flex-row text-sm 2xl:text-md pb-1 w-full'>
        <div class='grow text-left justify-start py-1 px-0.5 flex flex-row
                        hover:bg-hoverLight hover:dark:bg-hoverDark rounded-md'>
            <button class:rotate-90={dropdownOpen}
                    class='transition origin-center'
                    on:click={() => dropdownOpen = !dropdownOpen }>
                <AngleRightOutline class='h-5 w-5' />
            </button>

            <input contenteditable="true"
                    bind:this={scheduleNameElement}
                    on:blur={changeScheduleName}
                    class='bg-bgLight dark:bg-bgDark
                            px-0.5 mr-1 rounded cursor-text grow'>
        </div>

        <ScheduleOptionsDropdown />

        <button class="rounded-md hover:bg-hoverLight
                        dark:hover:bg-hoverDark h-7"
                on:click={createNewSchedule}>
            <PlusOutline class="w-5 h-5 px-0.5" />
        </button>
    </div>

    {#if dropdownOpen}
        <div class='w-full pr-5 pl-4 pb-0.5' transition:slide>
            {#each nonselectedSchedules as schedule}
                <div class='h-6 w-full flex flex-row'>
                    <button class='text-sm hover:bg-hoverLight text-sm
                                    dark:hover:bg-hoverDark text-left rounded-md
                                    h-6 items-center grow pl-1.5'
                            on:click={() => changeSchedule(schedule)}>
                        <div>{schedule.scheduleName}</div>
                    </button>

                    <button class='rounded-md hover:bg-hoverLight
                                    dark:hover:bg-hoverDark h-6 w-6
                                    flex justify-center items-center'
                            on:click={()=>deleteNonselectedSchedule(schedule)}>
                        <TrashBinOutline class='w-4 h-4' />
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>