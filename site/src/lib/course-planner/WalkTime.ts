/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Flags back-to-back classes that are too far apart to walk
 * between in the time available. Walking times are precomputed per building
 * pair in `src/lib/campus/walk-minutes.json`.
 */

import walkMinutesData from '../campus/walk-minutes.json';
import type { ClassMeetingExtended } from '../../types';

const walkMinutes: Record<string, number> = walkMinutesData;

/** A transition where the walk takes longer than the gap between classes. */
export interface TightTransition {
  /** Where to draw the warning, as a decimal hour (midpoint of the gap). */
  at: number;

  /** Minutes the walk takes. */
  needed: number;

  /** Minutes actually available between the two classes. */
  available: number;

  /** Building codes being walked between. */
  from: string;
  to: string;
}

/**
 * The building code a meeting takes place in, or `null` when there isn't one
 * to look up: (user events, "TBA", "async")
 */
function buildingOf(block: ClassMeetingExtended): string | null {
  if (block.userEvent) {
    return null;
  }
  const meeting = block.meeting;
  if (typeof meeting === 'string') {
    return null;
  }
  const building = meeting.location.building?.trim().toUpperCase();
  return building ? building : null;
}

/**
 * Walking time between two buildings in whole minutes, or `null` when it is
 * unknown. A `null` means the pair is off-campus (Shady Grove is ~20 miles
 * from College Park) or unrecognised, and must not be treated as "nearby".
 *
 * @param from A Testudo building code, e.g. `"CSI"`.
 * @param to Another building code.
 */
export function walkTimeBetween(from: string, to: string): number | null {
  if (from === to) {
    return 0;
  }
  const key = from < to ? `${from}|${to}` : `${to}|${from}`;
  return walkMinutes[key] ?? null;
}

/**
 * Find every transition in a single day where the walk between two
 * consecutive classes takes longer than the break between them.
 *
 * Overlapping meetings are skipped: they are already shown as a conflict, and
 * a walking warning on top of that is noise rather than news.
 *
 * @param classes One day's meetings, in start-time order (as `schedulify`
 *                produces them).
 */
export function tightTransitions(classes: ClassMeetingExtended[]): TightTransition[] {
  const result: TightTransition[] = [];

  for (let i = 0; i < classes.length - 1; i++) {
    const current = classes[i].meeting;
    const next = classes[i + 1].meeting;
    if (typeof current === 'string' || typeof next === 'string') {
      continue;
    }

    const from = buildingOf(classes[i]);
    const to = buildingOf(classes[i + 1]);
    if (from === null || to === null || from === to) {
      continue;
    }

    const needed = walkTimeBetween(from, to);
    if (needed === null || needed === 0) {
      continue;
    }

    const available = Math.round((next.classtime.start - current.classtime.end) * 60);
    if (available < 0 || needed <= available) {
      continue;
    }

    result.push({
      at: (current.classtime.end + next.classtime.start) / 2,
      needed,
      available,
      from,
      to,
    });
  }

  return result;
}
