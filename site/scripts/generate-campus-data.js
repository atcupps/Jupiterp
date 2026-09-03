#!/usr/bin/env node
/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Regenerates the two lookup tables in `src/lib/campus`:
 *
 *   building-coords.json  Testudo building code -> { name, lat, lon, campus }
 *   walk-minutes.json     "AAA|BBB" (codes sorted) -> walking minutes
 *
 * Rerun after a semester rollover, or whenever a new building code shows up in
 * course data; the script prints any code it could not place.
 *
 * Walking times come from OSRM's pedestrian profile over OpenStreetMap, rounded
 * up. Only College Park buildings get pairwise times: Shady Grove is ~20 miles
 * away, so a missing pair means "not walkable", never "close by".
 *
 * Usage: node scripts/generate-campus-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'campus');

const JUPITERP = 'https://api.jupiterp.com/v0/sections';
const UMDIO = 'https://api.umd.io/v1/map/buildings';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const OSRM = 'https://routing.openstreetmap.de/routed-foot/table/v1/foot';

/** Codes umd.io leaves blank; matched against its building names instead. */
const NAME_HINTS = {
  IRB: 'brendan iribe center',
  EAF: 'e.a. fernandez idea factory',
  YDH: 'yahentamitsi',
  TMH: 'turner hall',
};

/** Codes resolved from OpenStreetMap when umd.io has neither code nor name. */
const OSM_HINTS = { ATL: 'atlantic' };

/** Off-campus sites. Courses here are Shady Grove / Smith School programs. */
const OFF_CAMPUS = {
  BLD2: ['Universities at Shady Grove (Building II)', 39.09315, -77.19979, 'shady-grove'],
  BLD3: ['Universities at Shady Grove (Building III)', 39.09315, -77.19979, 'shady-grove'],
  BLD4: ['Universities at Shady Grove (Building IV)', 39.09315, -77.19979, 'shady-grove'],
};

const MEETING = /^(?:M|Tu|W|Th|F|Sa|Su)+-\d{1,2}:\d{2}[ap]m-\d{1,2}:\d{2}[ap]m-[A-Z0-9]+-[A-Za-z0-9]+$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Overpass rejects requests without a User-Agent, and rate-limits shared
 * clients with 429/504, so transient failures are retried with backoff.
 */
async function getJson(url, init = {}, attempts = 4) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': 'jupiterp-campus-data', ...init.headers },
    });
    if (res.ok) return res.json();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === attempts) {
      throw new Error(`${res.status} ${res.statusText} for ${url}`);
    }
    const wait = 2000 * attempt;
    console.log(`  ${res.status} from ${new URL(url).host}, retrying in ${wait / 1000}s...`);
    await sleep(wait);
  }
}

/** Every building code that appears in a timed meeting, with how often. */
async function fetchBuildingCodes() {
  const counts = new Map();
  for (let offset = 0; ; offset += 500) {
    const page = await getJson(`${JUPITERP}?limit=500&offset=${offset}`);
    if (!page.length) break;
    for (const section of page) {
      for (const meeting of section.meetings ?? []) {
        if (typeof meeting !== 'string' || !MEETING.test(meeting)) continue;
        const code = meeting.split('-').at(-2);
        counts.set(code, (counts.get(code) ?? 0) + 1);
      }
    }
  }
  return counts;
}

async function fetchOsmBuildings() {
  const query = `[out:json][timeout:60];
    (way["building"]["name"](38.975,-76.960,39.005,-76.925);
     relation["building"]["name"](38.975,-76.960,39.005,-76.925););
    out tags center;`;
  const data = await getJson(OVERPASS, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
  });
  return data.elements.filter((e) => e.tags?.name && e.center);
}

async function main() {
  console.log('fetching course data, umd.io buildings, and OSM footprints...');
  const [counts, umdio, osm] = await Promise.all([fetchBuildingCodes(), getJson(UMDIO), fetchOsmBuildings()]);
  const totalMeetings = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`  ${counts.size} building codes across ${totalMeetings} timed meetings`);

  const byCode = new Map();
  for (const b of umdio) {
    const code = (b.code ?? '').trim().toUpperCase();
    if (code) byCode.set(code, b);
  }

  const buildings = {};
  const unresolved = [];
  for (const code of [...counts.keys()].sort()) {
    if (OFF_CAMPUS[code]) {
      const [name, lat, lon, campus] = OFF_CAMPUS[code];
      buildings[code] = { campus, lat, lon, name };
      continue;
    }
    const direct = byCode.get(code);
    if (direct) {
      buildings[code] = {
        campus: 'college-park',
        lat: Number(Number(direct.lat).toFixed(6)),
        lon: Number(Number(direct.long).toFixed(6)),
        name: direct.name,
      };
      continue;
    }
    const hint = NAME_HINTS[code];
    const named = hint && umdio.find((b) => b.name.toLowerCase().includes(hint));
    if (named) {
      buildings[code] = {
        campus: 'college-park',
        lat: Number(Number(named.lat).toFixed(6)),
        lon: Number(Number(named.long).toFixed(6)),
        name: named.name,
      };
      continue;
    }
    const osmHint = OSM_HINTS[code];
    const fromOsm = osmHint && osm.find((e) => e.tags.name.toLowerCase().startsWith(osmHint));
    if (fromOsm) {
      buildings[code] = {
        campus: 'college-park',
        lat: Number(fromOsm.center.lat.toFixed(6)),
        lon: Number(fromOsm.center.lon.toFixed(6)),
        name: fromOsm.tags.name,
      };
      continue;
    }
    unresolved.push(code);
  }

  const covered = Object.keys(buildings).reduce((a, c) => a + counts.get(c), 0);
  console.log(
    `  placed ${Object.keys(buildings).length}/${counts.size} codes ` +
      `(${((covered / totalMeetings) * 100).toFixed(1)}% of meetings)`
  );
  if (unresolved.length) {
    console.log(
      '  UNPLACED:',
      unresolved
        .sort((a, b) => counts.get(b) - counts.get(a))
        .map((c) => `${c}(${counts.get(c)})`)
        .join(' ')
    );
  }

  // Pairwise walking times, College Park only.
  const cp = Object.keys(buildings)
    .filter((c) => buildings[c].campus === 'college-park')
    .sort();
  console.log(`fetching walking matrix for ${cp.length} College Park buildings...`);
  const coords = cp.map((c) => `${buildings[c].lon},${buildings[c].lat}`).join(';');
  const table = await getJson(`${OSRM}/${coords}?annotations=duration`);
  if (table.code !== 'Ok') throw new Error(`OSRM: ${table.code}`);

  const walk = {};
  for (let i = 0; i < cp.length; i++) {
    for (let j = i + 1; j < cp.length; j++) {
      const seconds = table.durations[i][j];
      if (seconds == null) continue;
      walk[`${cp[i]}|${cp[j]}`] = Math.ceil(seconds / 60);
    }
  }
  console.log(`  ${Object.keys(walk).length} pairs`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const write = (file, data) => {
    // Sort by key so regenerating produces a reviewable diff. Note this must
    // be done by rebuilding the object: JSON.stringify's second argument is a
    // property allowlist, not a sort, and would strip the nested fields.
    const sorted = Object.fromEntries(
      Object.keys(data)
        .sort()
        .map((k) => [k, data[k]])
    );
    fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(sorted, null, 2) + '\n');
  };
  write('building-coords.json', buildings);
  write('walk-minutes.json', walk);
  console.log(`wrote building-coords.json and walk-minutes.json to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
