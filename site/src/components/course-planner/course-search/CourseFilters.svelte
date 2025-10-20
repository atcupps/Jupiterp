<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2025 Andrew Cupps
-->
<script lang="ts">
    import { GenEd } from "@jupiterp/jupiterp";
    import {
        AdjustmentsHorizontalOutline,
        AngleDownOutline,
        CloseOutline
    } from "flowbite-svelte-icons";
    import { slide } from "svelte/transition";

    let appliedFiltersCount = 0;
    let showFiltersMenu = false;
    let showGenEdMenu = false;
    let genEdSelections: GenEd[] = [];

    const defaultMinCredits = 0;
    const defaultMaxCredits = 20;
    let minCredits: number = defaultMinCredits;
    let maxCredits: number = defaultMaxCredits;

    $: if (minCredits > maxCredits) {
        maxCredits = minCredits;
    }

    $: {
        appliedFiltersCount = 0;
        if (genEdSelections.length > 0) {
            appliedFiltersCount += 1;
        }
        if (minCredits !== 0) {
            appliedFiltersCount += 1;
        }
        if (maxCredits !== 20) {
            appliedFiltersCount += 1;
        }
    }

    function resetFilters() {
        genEdSelections = [];
        minCredits = defaultMinCredits;
        maxCredits = defaultMaxCredits;
    }
</script>

<div class="flex flex-col
            text-secCodesLight dark:text-[#8892a8]">
    <!-- Filters button -->
    <div class="flex flex-row items-center gap-1 justify-between
                 px-1 py-0.5 mt-1">
        <button class="grow flex flex-row
                    text-sm items-center rounded-md
                    hover:text-textLight dark:hover:text-textDark"
                title="Show/hide course search filters"
                on:click={() => { showFiltersMenu = !showFiltersMenu }}>
            <AdjustmentsHorizontalOutline class="w-4 h-4 mr-1" />
            {appliedFiltersCount} filter{appliedFiltersCount === 1 ? '' : 's'} applied
        </button>

        <button class="text-right text-sm
                    hover:text-textLight dark:hover:text-textDark"
                on:click={resetFilters}
                title="Clear all filters">
            Clear filters
        </button>
    </div>

    <!-- Filters menu -->
    {#if showFiltersMenu}
        <div class="flex flex-col px-2 py-1 mx-1 my-1 gap-2 text-xs"
            transition:slide>

            <!-- Gen-Eds -->
            <div class="flex flex-row text-xs">
                <span class="whitespace-nowrap min-w-16">
                    Gen-Eds:
                </span>
                
                <div class="flex flex-col grow">
                    <!-- Gen-Ed buttons -->
                    <div class="flex flex-row items-center w-full">
                        <!-- Show/hide gen-eds menu button -->
                        <button class="text-left flex flex-row grow
                                    hover:bg-hoverLight dark:hover:bg-divBorderDark
                                    items-center rounded-l-md h-full
                                    border-l border-t border-b border-1
                                    border-secCodesLight dark:border-divBorderDark
                                    focus-visible:ring"
                                title="Show/hide Gen Ed selection menu"
                                on:click={() => { showGenEdMenu = !showGenEdMenu }}>
                            <span class="px-0.5 border-r border-1
                                        border-secCodesDark dark:border-divBorderDark
                                        h-full content-center">
                                <AngleDownOutline class="w-4 h-4" />
                            </span>
                            <span class="px-1 bg-bgLight dark:bg-bgDark w-full">
                                {#if Array.from(genEdSelections).length === 0}
                                    Select Gen Eds
                                {:else}
                                    {Array.from(genEdSelections).map(g => g.code).join(', ')}
                                {/if}
                            </span>
                        </button>
                        
                        <!-- Clear gen-ed filters -->
                        <button class="rounded-r-md self-end px-0.5
                                    border border-1 h-full
                                    border-secCodesDark dark:border-divBorderDark
                                    hover:bg-hoverLight hover:dark:bg-hoverDark"
                                title="Clear Gen Ed filters"
                                on:click={() => { genEdSelections = []; }}>
                            <CloseOutline class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Gen Ed checkbox menu -->
                    {#if showGenEdMenu}
                        <div class="flex flex-col gap-2
                                    mt-1 py-2"
                             transition:slide>

                            <!-- Individual gen-ed checkbox -->
                            {#each GenEd.list() as genEd}
                                <div class="flex flex-row items-center">
                                    <input type="checkbox"
                                        checked={genEdSelections.includes(genEd)}
                                        id={"gened-" + genEd.code}
                                        class="mr-2 mt-0.5 rounded-md text-orange
                                            border-secCodesDark dark:border-divBorderDark
                                            bg-divBorderLight dark:bg-divBorderDark
                                            focus:ring-orange
                                            hover:cursor-pointer" 
                                        on:click={() => {
                                            if (genEdSelections.includes(genEd)) {
                                                genEdSelections = 
                                                    genEdSelections.filter(g => g !== genEd);
                                            } else {
                                                genEdSelections = [...genEdSelections, genEd];
                                            }
                                        }}/>
                                    <label for={"gened-" + genEd.code}
                                        class="text-xs hover:cursor-pointer">
                                        {genEd.code} - {genEd.name}
                                    </label>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Min credits -->
            <span class="flex flex-row items-center text-xs">
                <span class="min-w-16">
                    Min credits: 
                </span>
                <input type="number" min="0" step="1" max="20" placeholder="0"
                    bind:value={minCredits}
                    class="border border-secCodesDark dark:border-divBorderDark
                            rounded-md w-12 px-1 py-0 text-xs
                            bg-bgLight dark:bg-bgDark
                            focus:outline-none focus:ring
                            text-sm"/>
            </span>
                
            <!-- Max credits -->
            <span class="flex flex-row items-center text-xs">
                <span class="min-w-16">
                    Max credits: 
                </span>
                <input type="number" min="0" max="20" step="1" placeholder="10"
                    bind:value={maxCredits}
                    class="border border-secCodesDark dark:border-divBorderDark
                            rounded-md w-12 px-1 py-0
                            bg-bgLight dark:bg-bgDark text-xs
                            focus:outline-none focus:ring
                            text-sm"/>
            </span>

            <!-- Total class size -->


            <!-- Only open sections -->


            <!-- Instructor -->


        </div>
    {/if}
</div>