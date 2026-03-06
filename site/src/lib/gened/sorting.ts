/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import type { GenEdProgressRow, GenEdStatus } from "$lib/gened/progress";
import { compareTermCodes } from "$lib/gened/progress";

export type GenEdSortKey =
    | "gen_ed_code"
    | "gen_ed_name"
    | "category"
    | "earliest_term"
    | "latest_term"
    | "status";

export type SortDirection = "asc" | "desc";

const STATUS_ORDER: Record<GenEdStatus, number> = {
    not_started: 0,
    in_progress: 1,
    completed: 2,
};

function compareNullableTerm(
    a: string | null,
    b: string | null,
    direction: SortDirection
): number {
    if (a === null && b === null) {
        return 0;
    }

    if (a === null) {
        return direction === "asc" ? 1 : -1;
    }

    if (b === null) {
        return direction === "asc" ? -1 : 1;
    }

    return compareTermCodes(a, b);
}

export function sortGenEdProgressRows(
    rows: GenEdProgressRow[],
    sortKey: GenEdSortKey,
    direction: SortDirection
): GenEdProgressRow[] {
    const multiplier = direction === "asc" ? 1 : -1;

    return [...rows].sort((left, right) => {
        let result = 0;
        switch (sortKey) {
            case "gen_ed_code":
                result = left.requirement.code.localeCompare(right.requirement.code);
                break;
            case "gen_ed_name":
                result = left.requirement.displayName
                    .localeCompare(right.requirement.displayName);
                break;
            case "category":
                result = left.requirement.category.localeCompare(right.requirement.category);
                break;
            case "earliest_term":
                result = compareNullableTerm(
                    left.earliestTermCode,
                    right.earliestTermCode,
                    direction
                );
                break;
            case "latest_term":
                result = compareNullableTerm(
                    left.latestTermCode,
                    right.latestTermCode,
                    direction
                );
                break;
            case "status":
                result = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
                break;
            default:
                result = 0;
        }

        if (result === 0) {
            result = left.requirement.code.localeCompare(right.requirement.code);
        }

        return result * multiplier;
    });
}

export function formatTermCode(termCode: string | null): string {
    if (!termCode) {
        return "-";
    }

    const match = termCode.match(/^(\d{4})([A-Z]{2})$/);
    if (!match) {
        return termCode;
    }

    const suffixMap: Record<string, string> = {
        WI: "Winter",
        SP: "Spring",
        SU: "Summer",
        FA: "Fall",
    };

    const season = suffixMap[match[2]] ?? match[2];
    return `${season} ${match[1]}`;
}
