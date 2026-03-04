/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview robots.txt endpoint.
 */

export const prerender = true;

export async function GET() {
    const siteUrl = (process.env.PUBLIC_SITE_URL ?? 'https://www.jupiterp.com')
        .replace(/\/+$/, '');

    const body = [
        'User-agent: *',
        'Allow: /',
        `Sitemap: ${siteUrl}/sitemap.xml`,
    ].join('\n') + '\n';

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}
