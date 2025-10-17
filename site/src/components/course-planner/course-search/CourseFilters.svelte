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
</script>

<div class="flex flex-col
            text-secCodesLight dark:text-secCodesDark">
    <!-- Filters button -->
    <button class="w-full flex flex-row px-1 py-0.5 mt-1
                text-sm items-center rounded-md
                hover:text-textLight dark:hover:text-textDark"
            title="Show/hide course search filters"
            on:click={() => { showFiltersMenu = !showFiltersMenu }}>
        <AdjustmentsHorizontalOutline class="w-4 h-4 mr-1" />
        {appliedFiltersCount} filters applied
    </button>

    <!-- Filters menu -->
    {#if showFiltersMenu}
        <div class="flex flex-col px-2 py-1 mx-1 my-1"
            transition:slide>

            <!-- Gen-Eds -->
            <div class="flex flex-row text-xs">
                <span class="mr-2 whitespace-nowrap">
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

            <!-- Credits -->


            <!-- Total class size -->


            <!-- Only open sections -->


            <!-- Instructor -->


        </div>
    {/if}
</div>