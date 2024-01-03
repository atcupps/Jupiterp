<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang="ts">
    import { schedulify } from './schedule';
    import ClassMeeting from './ClassMeeting.svelte';

    export let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(selections);

    // In order for Svelte to recreate `schedule` reactively as the user
    // selects new classes, this if block is needed to run `schedulify`
    // if `selections` changes.
    $: if (selections) {
        schedule = schedulify(selections);
        console.log(schedule);
    }
</script>

<div class='p-2 flex justify-center h-full w-full'>
    <table class='w-full'>
        <tr class='h-4'>
            <th class='border-2 border-solid border-outlineLight'>Monday</th>
            <th class='border-2 border-solid border-outlineLight'>Tuesday</th>
            <th class='border-2 border-solid border-outlineLight'>Wednesday</th>
            <th class='border-2 border-solid border-outlineLight'>Thursday</th>
            <th class='border-2 border-solid border-outlineLight'>Friday</th>
            {#if schedule.other.length > 0}
                <th class='border-2 border-solid border-outlineLight'>Other</th>
            {/if}
        </tr>
        <tr >
            <td class='border-2 border-solid border-outlineLight'>
                {#each schedule.monday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight'>
                {#each schedule.tuesday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight'>
                {#each schedule.wednesday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight'>
                {#each schedule.thursday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight'>
                {#each schedule.friday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            {#if schedule.other.length > 0}
                <td class='border-2 border-solid border-outlineLight'>
                    {#each schedule.other as classMeeting}
                        <ClassMeeting meeting={classMeeting} />
                    {/each}
                </td>
            {/if}
        </tr>
    </table>
</div>