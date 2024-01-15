<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import TimeLine from "./TimeLine.svelte";

    export let earliest: number;
    export let latest: number;
    
    let displayTimes: number[] = [];
    let numBars: number = 17;
    $: if (earliest || latest) {
        displayTimes = [];
        for (let i = earliest; i <= latest; i++) {
            displayTimes = [...displayTimes, i];
        }
        numBars = Math.min(21, (latest - earliest) * 2 + 1);
    }

    function formatDecTime(decTime: number): string {
        if (decTime < 12) {
            return decTime + ' AM';
        }
        if (decTime === 12) {
            return decTime + ' PM';
        }
        if (decTime > 12) {
            return (decTime - 12) + ' PM';
        }
        throw Error('Impossible `decTime` was not less than, equal to, or greater than 12');
    }

    let elt: HTMLDivElement;
    let innerHeight: number;
    export let h: number;
    $: if (elt || innerHeight) {
        h = elt.offsetHeight * (latest - earliest) * 2 / numBars;
    }
</script>

<svelte:window bind:innerHeight />

<div class='h-full' bind:this={elt}>
    <TimeLine number={formatDecTime(earliest)} position={0} />
    {#each displayTimes.slice(1, displayTimes.length) as time}
        <TimeLine position={((time - earliest) * 2 - 1) / numBars} />
        <TimeLine number={formatDecTime(time)} 
                        position={(time - earliest) * 2 / numBars} />
    {/each}
</div>