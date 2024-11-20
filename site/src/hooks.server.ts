import { sequence } from "@sveltejs/kit/hooks";
import { handleErrorWithSentry, sentryHandle } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://24e8b736fa56aa42958e5ea40774e21a@o4507562502782976.ingest.us.sentry.io/4507562512023552',
  tracesSampleRate: 1.0, 
});

export const handle = sequence(sentryHandle());

export const handleError = handleErrorWithSentry();
