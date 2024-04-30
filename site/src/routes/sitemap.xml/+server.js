/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 * 
 * @fileoverview This file is the endpoint for Jupiterp's sitemap.xml file.
 */

export async function GET() {
    const pages = [
        { url: '/', changefreq: 'daily', priority: 0.7 },
        { url: '/about', changefreq: 'monthly', priority: 0.3 },
        { url: '/bugs', changefreq: 'monthly', priority: 0.2 },
    ];
    

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
                    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                        ${pages
                            .map(page => {
                                return `<url>
                            <loc>https://www.jupiterp.com${page.url}</loc>
                            <changefreq>${page.changefreq}</changefreq>
                            <priority>${page.priority}</priority>
                        </url>`;
                        })
                        .join('\n')}
                    </urlset>
                    `;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}