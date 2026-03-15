/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import type { RequestHandler } from './$types';

const UMD_IO_BASE_URL = 'https://api.umd.io/v1';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const upstreamPath = params.path;
	if (!upstreamPath || upstreamPath.length === 0) {
		return new Response('Missing upstream path.', { status: 400 });
	}

	const upstreamUrl = new URL(`${UMD_IO_BASE_URL}/${upstreamPath}`);
	for (const [key, value] of url.searchParams.entries()) {
		upstreamUrl.searchParams.append(key, value);
	}

	const upstreamResponse = await fetch(upstreamUrl.toString(), {
		method: 'GET',
		headers: {
			Accept: 'application/json'
		}
	});

	const body = await upstreamResponse.text();
	const headers = new Headers();
	const contentType = upstreamResponse.headers.get('content-type');
	if (contentType) {
		headers.set('content-type', contentType);
	}

	headers.set(
		'cache-control',
		upstreamResponse.headers.get('cache-control') ?? 'public, max-age=60'
	);

	return new Response(body, {
		status: upstreamResponse.status,
		headers
	});
};
