<script lang="ts">
    export let selections: ScheduleSelection[] = [];
</script>

<div>
    <ul>
        {#each selections as selection}
            <li>{selection.courseCode} - {selection.section.sec_code}</li>
        {/each}
    </ul>
</div>