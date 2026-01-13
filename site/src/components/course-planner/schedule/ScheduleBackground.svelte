<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
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
        let decTimeInDay = decTime % 24;
        if (decTimeInDay < 12) {
            return (decTimeInDay !== 0 ? decTimeInDay : '12') + ' AM';
        }
        if (decTimeInDay === 12) {
            return decTimeInDay + ' PM';
        }
        if (decTimeInDay > 12) {
            return (decTimeInDay - 12) + ' PM';
        }
        throw Error('Impossible `decTime` was not less than, equal to, or greater than 12');
    }

    let elt: HTMLDivElement;
    let innerHeight: number;
    let innerWidth: number;
    export let h: number;
    $: if (elt || (innerHeight && innerWidth)) {
        h = elt.offsetHeight * (latest - earliest) * 2 / numBars;
    }
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<div class='h-full' bind:this={elt}>
    <TimeLine number={formatDecTime(earliest)} position={0} />
    {#each displayTimes.slice(1, displayTimes.length) as time}
        <TimeLine position={((time - earliest) * 2 - 1) / numBars} />
        <TimeLine number={formatDecTime(time)} 
                        position={(time - earliest) * 2 / numBars} />
    {/each}
</div>