<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps

Where the emailed confirmation link lands.

Client-side rather than a server load: the token must not end up in a server
access log or a referrer header, and this way it stays in the URL fragment of
one browser session.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { verifyReview } from '../../../lib/api/JupiterpApi';

  let status = $state<'working' | 'done' | 'failed'>('working');
  let message = $state('');
  let manageKey = $state('');
  let copied = $state(false);

  $effect(() => {
    const token = page.url.searchParams.get('token');
    if (!token) {
      status = 'failed';
      message = 'That link is missing its token. Try opening it again from your email.';
      return;
    }
    void (async () => {
      const result = await verifyReview(token);
      status = result.ok ? 'done' : 'failed';
      message = result.message;
      manageKey = result.manageKey ?? '';
    })();
  });

  async function copyKey() {
    await navigator.clipboard.writeText(manageKey);
    copied = true;
  }
</script>

<svelte:head>
  <title>Confirm your review | Jupiterp</title>
  <!-- Never index a page reached by a single-use token. -->
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto w-full max-w-2xl px-4 py-10">
  {#if status === 'working'}
    <h1 class="text-2xl font-bold">Confirming…</h1>
  {:else if status === 'failed'}
    <h1 class="text-2xl font-bold">That didn't work</h1>
    <p class="my-3">{message}</p>
    <a href={resolve('/professors')} class="text-orange underline">Back to professors</a>
  {:else}
    <h1 class="text-2xl font-bold">Thanks — your review is in the queue</h1>
    <p class="my-3">{message}</p>

    {#if manageKey}
      <div class="border-outline my-4 rounded-lg border-2 p-4">
        <h2 class="font-bold">Save this key</h2>
        <p class="my-2 text-sm">
          It is the only way to edit or withdraw your review later. We cannot recover it for you — by design, nothing
          links it back to you. We've emailed a copy too.
        </p>
        <code class="bg-bg-secondary block break-all rounded-md p-2 text-sm">{manageKey}</code>
        <button class="border-orange text-orange mt-2 rounded-md border px-3 py-1 text-sm font-bold" onclick={copyKey}>
          {copied ? 'Copied' : 'Copy key'}
        </button>
      </div>
    {/if}

    <p class="text-text-secondary text-sm">
      A moderator reads every review before it appears. See the
      <a href={resolve('/review-policy')} class="text-orange underline">review policy</a>.
    </p>
  {/if}
</main>
