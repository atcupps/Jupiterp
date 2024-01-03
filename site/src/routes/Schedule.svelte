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
    <table style="border: 1px solid black;" class='w-full'>
        <tr style="border: 1px solid black;" class='h-4'>
            <th style="border: 1px solid black;">Monday</th>
            <th style="border: 1px solid black;">Tuesday</th>
            <th style="border: 1px solid black;">Wednesday</th>
            <th style="border: 1px solid black;">Thursday</th>
            <th style="border: 1px solid black;">Friday</th>
            {#if schedule.other.length > 0}
                <th style="border: 1px solid black;">Other</th>
            {/if}
        </tr>
        <tr style="border: 1px solid black;">
            <td style="border: 1px solid black;">
                {#each schedule.monday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td style="border: 1px solid black;">
                {#each schedule.tuesday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td style="border: 1px solid black;">
                {#each schedule.wednesday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td style="border: 1px solid black;">
                {#each schedule.thursday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            <td style="border: 1px solid black;">
                {#each schedule.friday as classMeeting}
                    <ClassMeeting meeting={classMeeting} />
                {/each}
            </td>
            {#if schedule.other.length > 0}
                <td style="border: 1px solid black;">
                    {#each schedule.other as classMeeting}
                        <ClassMeeting meeting={classMeeting} />
                    {/each}
                </td>
            {/if}
        </tr>
    </table>
</div>