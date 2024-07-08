import { sequence } from "@sveltejs/kit/hooks";
import { handleErrorWithSentry, sentryHandle } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, 
});

export const handle = sequence(sentryHandle());

export const handleError = handleErrorWithSentry();
