import { sequence } from "@sveltejs/kit/hooks";
import { handleErrorWithSentry, sentryHandle } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://bb807e65d7cbb0c0d006490fa1f8880d@o4507562502782976.ingest.us.sentry.io/4507562512023552',
  tracesSampleRate: 1.0, 
});

export const handle = sequence(sentryHandle());

export const handleError = handleErrorWithSentry();
