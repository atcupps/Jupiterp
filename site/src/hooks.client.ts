import { handleErrorWithSentry } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://a4494d5cf591eeddd496ed18488c5faa@o4507562502782976.ingest.us.sentry.io/4507562512023552',
  tracesSampleRate: 1.0,
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
