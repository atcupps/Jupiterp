<script lang="ts">
    import { schedulify } from './schedule';
    import ClassMeeting from './ClassMeeting.svelte';

    export let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(selections);

    $: if (selections === selections) {
        schedule = schedulify(selections);
        console.log(schedule);
    }
</script>

<div>
    <table style="border: 1px solid black;">
        <tr style="border: 1px solid black;">
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