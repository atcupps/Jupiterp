<script lang='ts'>
    import { SeatDataStore } from "../../../stores/CoursePlannerStores";

    export let course: string;
    export let section: string;

    let seats: number[] | null;
    $: if (course && section) {
        SeatDataStore.subscribe((value) => {
            seats = value[course + '-' + section];
        });
    }
</script>

{#if seats}
    <div class='flex flex-row text-xs 2xl:text-base font-medium w-full'>
        {seats[0]} / {seats[1]} seats available
    </div>
{/if}