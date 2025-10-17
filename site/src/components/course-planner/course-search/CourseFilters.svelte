<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2025 Andrew Cupps
-->
<script lang="ts">
    import { GenEd } from "@jupiterp/jupiterp";
import { AdjustmentsHorizontalOutline, AngleDownOutline } from "flowbite-svelte-icons";
    import { slide } from "svelte/transition";

    let appliedFiltersCount = 0;
    let showFiltersMenu = false;
    let showGenEdMenu = false;
</script>

<div class="flex flex-col
            text-secCodesLight dark:text-secCodesDark">
    <!-- Filters button -->
    <button class="w-full flex flex-row px-1 py-0.5 mt-1
                text-sm items-center rounded-md
                hover:text-textLight dark:hover:text-textDark"
            on:click={() => { showFiltersMenu = !showFiltersMenu }}>
        <AdjustmentsHorizontalOutline class="w-4 h-4 mr-1" />
        {appliedFiltersCount} filters applied
    </button>

    <!-- Filters menu -->
    {#if showFiltersMenu}
        <div class="flex flex-col px-2 py-1 mx-1 my-1"
            transition:slide>
            <!-- Clear filters -->


            <!-- Gen-Eds -->
            <div class="flex flex-row text-xs">
                <span class="mr-2 whitespace-nowrap">
                    Gen-Eds:
                </span>
                
                <div class="flex flex-col grow">
                    <button class="text-left flex flex-row group
                                items-center rounded-md
                                outline outline-1 
                                outline-secCodesLight dark:outline-divBorderDark"
                            on:click={() => { showGenEdMenu = !showGenEdMenu }}>
                        <span class="px-0.5 mr-1 border-r border-1 h-full rounded-l
                                    border-secCodesDark dark:border-divBorderDark
                                    group-hover:bg-hoverLight dark:group-hover:bg-divBorderDark">
                            <AngleDownOutline class="w-4 h-4" />
                        </span>
                        <span>
                            Select
                        </span>
                    </button>

                    {#if showGenEdMenu}
                        <div class="flex flex-col gap-2
                                    mt-1 p-2">
                            {#each GenEd.list() as genEd}
                                <div class="flex flex-row">
                                    <input type="checkbox"
                                        id={"gened-" + genEd.code}
                                        class="mr-2 mt-0.5" />
                                    <label for={"gened-" + genEd.code}
                                        class="text-xs">
                                        {genEd.code} - {genEd.name}
                                    </label>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Credits -->


            <!-- Total class size -->


            <!-- Only open sections -->


            <!-- Instructor -->


        </div>
    {/if}
</div>