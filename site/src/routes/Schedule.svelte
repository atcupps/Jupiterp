<script lang="ts">
    import { schedulify } from './schedule';

    export let selections: ScheduleSelection[] = [];

    let schedule: Schedule = schedulify(selections);

    $: if (selections === selections) {
        schedule = schedulify(selections);
        console.log(schedule);
    }
</script>

