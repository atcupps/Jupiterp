/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview Sentry hooks for error tracking in the SvelteKit application.
 */
import { sequence } from "@sveltejs/kit/hooks";
import { handleErrorWithSentry, sentryHandle } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';

// format-check exempt 2
Sentry.init({
  dsn: 'https://24e8b736fa56aa42958e5ea40774e21a@o4507562502782976.ingest.us.sentry.io/4507562512023552',
  tracesSampleRate: 1.0, 
});

export const handle = sequence(sentryHandle());

export const handleError = handleErrorWithSentry();
