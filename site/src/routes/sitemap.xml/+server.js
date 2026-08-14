/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview This file is the endpoint for Jupiterp's sitemap.xml file.
 */

import { client } from '../../lib/client';

const STATIC_PAGES = [
  { url: '/', changefreq: 'daily', priority: 0.7 },
  { url: '/professors', changefreq: 'weekly', priority: 0.6 },
  { url: '/about', changefreq: 'monthly', priority: 0.3 },
  { url: '/bugs', changefreq: 'monthly', priority: 0.2 },
  { url: '/terms-of-use', changefreq: 'monthly', priority: 0.1 },
  { url: '/changelog', changefreq: 'monthly', priority: 0.1 },
  { url: '/privacy-policy', changefreq: 'monthly', priority: 0.1 },
];

/** PostgREST caps a page at 500 rows, so slugs are collected in batches. */
const PAGE_SIZE = 500;

/**
 * Hard ceiling on professor URLs emitted.
 *
 * The sitemap protocol allows 50,000 URLs per file. Past that this needs to
 * become a sitemap index rather than silently truncating, so the cap sits
 * below the limit and the shortfall is visible in the response rather than
 * discovered by a crawler.
 */
const MAX_PROFESSOR_URLS = 45000;

/**
 * Collect every professor slug.
 *
 * Only instructors that Jupiterp has a page worth indexing for; a record with
 * no grade data and no rating is a name in a table, and filling the sitemap
 * with thousands of near-empty pages is how a site earns a thin-content
 * problem. Sorted by slug so the output is stable between requests, which
 * makes a diff meaningful when something changes.
 *
 * @param {typeof globalThis.fetch} fetchFn
 * @returns {Promise<string[]>}
 */
async function professorSlugs(fetchFn) {
  /** @type {string[]} */
  const slugs = [];
  let offset = 0;

  while (slugs.length < MAX_PROFESSOR_URLS) {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      sortBy: 'slug.asc',
    });
    const response = await fetchFn(`${client.dbUrl}/v0/instructors?${params.toString()}`);
    if (!response.ok) {
      // A sitemap missing its professor pages is far better than a 500 that
      // makes a crawler drop the whole file, so this degrades rather than
      // throws.
      console.error('sitemap: instructor fetch failed with', response.status);
      break;
    }

    const page = await response.json();
    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    for (const instructor of page) {
      if (typeof instructor?.slug === 'string' && instructor.slug !== '') {
        slugs.push(instructor.slug);
      }
    }

    offset += page.length;
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  return slugs.slice(0, MAX_PROFESSOR_URLS);
}

/**
 * @param {string} path
 * @param {string} changefreq
 * @param {number} priority
 * @returns {string}
 */
function urlEntry(path, changefreq, priority) {
  return `<url>
    <loc>https://www.jupiterp.com${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
</url>`;
}

export async function GET({ fetch }) {
  const slugs = await professorSlugs(fetch);

  const entries = [
    ...STATIC_PAGES.map((page) => urlEntry(page.url, page.changefreq, page.priority)),
    ...slugs.map((slug) => urlEntry(`/professor/${encodeURIComponent(slug)}`, 'monthly', 0.5)),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      // Thousands of URLs assembled from several hundred upstream requests.
      // Rebuilding that per crawl would be the most expensive route on the
      // site by a wide margin, and the contents change once a term.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
