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
    }
</script>

<div class='p-2 flex justify-center h-full w-full'>
    <table class='w-full'>
        <tr class='h-4'>
            <th class='border-2 border-solid border-outlineLight dark:border-outlineDark'>Monday</th>
            <th class='border-2 border-solid border-outlineLight dark:border-outlineDark'>Tuesday</th>
            <th class='border-2 border-solid border-outlineLight dark:border-outlineDark'>Wednesday</th>
            <th class='border-2 border-solid border-outlineLight dark:border-outlineDark'>Thursday</th>
            <th class='border-2 border-solid border-outlineLight dark:border-outlineDark'>Friday</th>
            {#if schedule.other.length > 0}
                <th class='border-2 border-solid border-outlineLight dark:border-outlineDark'>Other</th>
            {/if}
        </tr>
        <tr >
            <td class='border-2 border-solid border-outlineLight dark:border-outlineDark'>
                {#each schedule.monday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight dark:border-outlineDark'>
                {#each schedule.tuesday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight dark:border-outlineDark'>
                {#each schedule.wednesday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight dark:border-outlineDark'>
                {#each schedule.thursday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td class='border-2 border-solid border-outlineLight dark:border-outlineDark'>
                {#each schedule.friday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            {#if schedule.other.length > 0}
                <td class='border-2 border-solid border-outlineLight dark:border-outlineDark'>
                    {#each schedule.other as classMeeting}
                        <ClassMeeting meeting={classMeeting} />
                    {/each}
                </td>
            {/if}
        </tr>
    </table>
</div>