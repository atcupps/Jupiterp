/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview Functions relating to instructors/professors in Jupiterp
 */

/**
 * Create a URL to a `PlanetTerp` page for a professor given their slug
 * 
 * @param slug The slug of a professor as a `string`
 * @returns A `string` incorporating `slug` into a PlanetTerp link
 */
export function ptLinkFromSlug(slug: string): string {
    const link = "https://planetterp.com/professor/" + slug
    return link;
}