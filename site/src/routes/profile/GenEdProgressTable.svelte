<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
    import type { GenEdCategory, GenEdRequirementCode } from "$lib/gened/requirements";
    import type { GenEdProgressRow, GenEdStatus } from "$lib/gened/progress";
    import {
        formatTermCode,
        sortGenEdProgressRows,
        type GenEdSortKey,
        type SortDirection,
    } from "$lib/gened/sorting";

    export let rows: GenEdProgressRow[] = [];

    let sortKey: GenEdSortKey = "gen_ed_code";
    let sortDirection: SortDirection = "asc";
    let selectedCategory: GenEdCategory | "all" = "all";
    let selectedStatus: GenEdStatus | "all" = "all";
    let expandedCodes = new Set<GenEdRequirementCode>();

    const categories: (GenEdCategory | "all")[] = [
        "all",
        "Fundamental Studies",
        "Distributive Studies",
        "I-Series / Big Question",
        "Diversity",
    ];

    const statusFilters: (GenEdStatus | "all")[] = [
        "all",
        "not_started",
        "in_progress",
        "completed",
    ];

    function toggleExpanded(code: GenEdRequirementCode) {
        if (expandedCodes.has(code)) {
            expandedCodes.delete(code);
        } else {
            expandedCodes.add(code);
        }

        expandedCodes = new Set(expandedCodes);
    }

    function statusLabel(status: GenEdStatus): string {
        if (status === "not_started") {
            return "Not started";
        }
        if (status === "in_progress") {
            return "In progress";
        }
        return "Completed";
    }

    function statusClasses(status: GenEdStatus): string {
        if (status === "not_started") {
            return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        }
        if (status === "in_progress") {
            return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
        }
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }

    function fulfilledSummary(row: GenEdProgressRow): string {
        if (row.courses.length === 0) {
            return "-";
        }

        const visible = row.courses.slice(0, 2)
            .map((course) => `${course.course_id} (${course.term_code})`)
            .join(", ");

        if (row.courses.length <= 2) {
            return visible;
        }

        return `${visible}, +${row.courses.length - 2} more`;
    }

    $: filteredRows = rows.filter((row) => {
        const categoryOk = selectedCategory === "all"
            || row.requirement.category === selectedCategory;
        const statusOk = selectedStatus === "all"
            || row.status === selectedStatus;

        return categoryOk && statusOk;
    });

    $: sortedRows = sortGenEdProgressRows(filteredRows, sortKey, sortDirection);
</script>

<div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label class="text-xs flex flex-col gap-1">
                <span class="opacity-70">Sort by</span>
                <select
                    class="rounded-md border border-outlineLight dark:border-outlineDark
                           bg-bgLight dark:bg-bgDark px-2 py-1 text-sm"
                    bind:value={sortKey}>
                    <option value="gen_ed_code">Gen Ed code</option>
                    <option value="gen_ed_name">Gen Ed name</option>
                    <option value="category">Category</option>
                    <option value="earliest_term">Earliest term</option>
                    <option value="latest_term">Latest term</option>
                    <option value="status">Status</option>
                </select>
            </label>

            <label class="text-xs flex flex-col gap-1">
                <span class="opacity-70">Direction</span>
                <select
                    class="rounded-md border border-outlineLight dark:border-outlineDark
                           bg-bgLight dark:bg-bgDark px-2 py-1 text-sm"
                    bind:value={sortDirection}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </label>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label class="text-xs flex flex-col gap-1">
                <span class="opacity-70">Category</span>
                <select
                    class="rounded-md border border-outlineLight dark:border-outlineDark
                           bg-bgLight dark:bg-bgDark px-2 py-1 text-sm"
                    bind:value={selectedCategory}>
                    {#each categories as category}
                        <option value={category}>
                            {category === "all" ? "All categories" : category}
                        </option>
                    {/each}
                </select>
            </label>

            <label class="text-xs flex flex-col gap-1">
                <span class="opacity-70">Status</span>
                <select
                    class="rounded-md border border-outlineLight dark:border-outlineDark
                           bg-bgLight dark:bg-bgDark px-2 py-1 text-sm"
                    bind:value={selectedStatus}>
                    {#each statusFilters as status}
                        <option value={status}>
                            {status === "all" ? "All statuses" : statusLabel(status)}
                        </option>
                    {/each}
                </select>
            </label>
        </div>
    </div>

    <div class="overflow-x-auto rounded-md border border-outlineLight dark:border-outlineDark">
        <table class="min-w-full text-sm">
            <thead class="bg-hoverLight dark:bg-hoverDark text-left">
                <tr>
                    <th class="px-3 py-2 font-semibold">Gen Ed</th>
                    <th class="px-3 py-2 font-semibold">Category</th>
                    <th class="px-3 py-2 font-semibold">Status</th>
                    <th class="px-3 py-2 font-semibold">Required</th>
                    <th class="px-3 py-2 font-semibold">Completed</th>
                    <th class="px-3 py-2 font-semibold">Remaining</th>
                    <th class="px-3 py-2 font-semibold">Fulfilled By</th>
                    <th class="px-3 py-2 font-semibold">Details</th>
                </tr>
            </thead>
            <tbody>
                {#if sortedRows.length === 0}
                    <tr>
                        <td class="px-3 py-3 text-xs opacity-70" colspan="8">
                            No rows match the selected filters.
                        </td>
                    </tr>
                {/if}

                {#each sortedRows as row}
                    <tr class="border-t border-outlineLight dark:border-outlineDark align-top">
                        <td class="px-3 py-2">
                            <div class="font-semibold">
                                {row.requirement.code} - {row.requirement.displayName}
                            </div>
                            <div class="text-xs opacity-70">{row.requirement.description}</div>
                            {#if row.requirement.notes}
                                <div class="text-xs opacity-70">{row.requirement.notes}</div>
                            {/if}
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap">{row.requirement.category}</td>
                        <td class="px-3 py-2">
                            <span class={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClasses(row.status)}`}>
                                {statusLabel(row.status)}
                            </span>
                        </td>
                        <td class="px-3 py-2">{row.requirement.requiredCount}</td>
                        <td class="px-3 py-2">
                            <div>{row.completedCount}</div>
                            {#if row.requirement.requiredCount > 1}
                                <div class="mt-1 h-1.5 w-24 rounded-full bg-outlineLight dark:bg-outlineDark">
                                    <div
                                        class="h-1.5 rounded-full bg-orange"
                                        style={`width: ${Math.min(
                                            (Math.min(row.completedCount, row.requirement.requiredCount)
                                                / row.requirement.requiredCount) * 100,
                                            100
                                        )}%`}></div>
                                </div>
                            {/if}
                        </td>
                        <td class="px-3 py-2">{row.remainingCount}</td>
                        <td class="px-3 py-2 max-w-64">
                            <div class="truncate" title={fulfilledSummary(row)}>
                                {fulfilledSummary(row)}
                            </div>
                            <div class="text-xs opacity-70 mt-1">
                                Earliest: {formatTermCode(row.earliestTermCode)}
                                <span class="mx-1">|</span>
                                Latest: {formatTermCode(row.latestTermCode)}
                            </div>
                        </td>
                        <td class="px-3 py-2">
                            <button
                                class="rounded-md border border-outlineLight dark:border-outlineDark px-2 py-1 text-xs
                                       hover:bg-hoverLight dark:hover:bg-hoverDark"
                                on:click={() => { toggleExpanded(row.requirement.code); }}>
                                {expandedCodes.has(row.requirement.code) ? "Hide" : "View"}
                            </button>
                        </td>
                    </tr>

                    {#if expandedCodes.has(row.requirement.code)}
                        <tr class="border-t border-outlineLight dark:border-outlineDark">
                            <td colspan="8" class="px-3 py-2">
                                {#if row.courses.length === 0}
                                    <div class="text-xs opacity-70">No completed courses tagged for this requirement yet.</div>
                                {:else}
                                    <div class="grid grid-cols-1 gap-2 lg:hidden">
                                        {#each row.courses as course}
                                            <div class="rounded-md border border-outlineLight dark:border-outlineDark p-2 text-xs">
                                                <div class="font-semibold">{course.course_id} - {course.course_title}</div>
                                                <div>Term: {formatTermCode(course.term_code)}</div>
                                                <div>Grade: {course.grade ?? "-"}</div>
                                                {#if course.otherMatchingGenEdCodes.length > 0}
                                                    <div>
                                                        Also satisfies: {course.otherMatchingGenEdCodes.join(", ")}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>

                                    <table class="hidden lg:table min-w-full text-xs">
                                        <thead>
                                            <tr>
                                                <th class="text-left py-1">Course</th>
                                                <th class="text-left py-1">Term</th>
                                                <th class="text-left py-1">Grade</th>
                                                <th class="text-left py-1">Other Gen Ed Tags</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each row.courses as course}
                                                <tr class="border-t border-outlineLight dark:border-outlineDark">
                                                    <td class="py-1 pr-2">
                                                        {course.course_id} - {course.course_title}
                                                    </td>
                                                    <td class="py-1 pr-2">{formatTermCode(course.term_code)}</td>
                                                    <td class="py-1 pr-2">{course.grade ?? "-"}</td>
                                                    <td class="py-1">
                                                        {course.otherMatchingGenEdCodes.length > 0
                                                            ? course.otherMatchingGenEdCodes.join(", ")
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                {/if}
                            </td>
                        </tr>
                    {/if}
                {/each}
            </tbody>
        </table>
    </div>
</div>
