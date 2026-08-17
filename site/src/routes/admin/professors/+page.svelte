<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps

Instructor matching.

Every entry here is a name the resolver could not settle, which means a
professor whose grade history is split across two records or attached to none.
Until this page existed the only way to work the queue was hand-written SQL,
and 257 entries had accumulated.

Behind the same key as the moderation queue, and it shares the storage key so
one login covers both. Lower blast radius in one sense -- nothing here
publishes text -- and higher in another: linking two records merges two real
people's grade histories, and there is no undo from the merged state. That is
why every candidate is shown with how much data it carries, and why `link` is
never the default action.
-->
<script lang="ts">
  import { client } from '../../../lib/client';
  import { formatSemester } from '../../../lib/course-planner/Grades';

  interface Candidate {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    grade_rows: number;
    sections: number;
    first_term: number | null;
    last_term: number | null;
  }

  interface QueueEntry {
    id: number;
    observed: string;
    observed_norm: string;
    source: string;
    context: Record<string, unknown> | null;
    created_at: string;
    candidates: Candidate[];
  }

  let adminKey = $state('');
  let remember = $state(false);
  let authed = $state(false);

  let entries = $state<QueueEntry[]>([]);
  let selected = $state(0);
  let status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  let errorMessage = $state('');
  let notice = $state('');
  let busy = $state(false);

  // Manual search, for when the resolver's candidates are all wrong. Its list
  // comes from a surname match, so it misses married names, transliterations,
  // and registrar spellings that share no token with the Testudo one -- exactly
  // the cases a person is better at than the algorithm.
  let searchTerm = $state('');
  let searchResults = $state<Candidate[]>([]);
  let searching = $state(false);

  // Same key as /admin/reviews on purpose: it is the same credential, and
  // making a moderator paste it twice teaches them to keep it somewhere
  // convenient, which is the opposite of what we want.
  const STORAGE_KEY = 'jupiterp-moderation-key';

  let current = $derived(entries[selected] ?? null);

  $effect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && !authed) {
      adminKey = saved;
      void load();
    }
  });

  async function call(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${client.dbUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async function load() {
    status = 'loading';
    errorMessage = '';
    try {
      const response = await call('/v1/admin/instructors/queue?limit=50');
      if (response.status === 401) {
        authed = false;
        status = 'error';
        errorMessage = 'That key was not accepted.';
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      entries = payload.entries ?? [];
      selected = Math.min(selected, Math.max(0, entries.length - 1));
      authed = true;
      status = 'ready';
      if (remember) {
        sessionStorage.setItem(STORAGE_KEY, adminKey);
      }
    } catch (error) {
      console.error(error);
      status = 'error';
      errorMessage = 'Could not load the queue.';
    }
  }

  async function runSearch() {
    if (searchTerm.trim().length < 2) {
      searchResults = [];
      return;
    }
    searching = true;
    try {
      const response = await call(`/v1/admin/instructors/search?q=${encodeURIComponent(searchTerm.trim())}`);
      searchResults = response.ok ? ((await response.json()).instructors ?? []) : [];
    } catch (error) {
      console.error(error);
      searchResults = [];
    } finally {
      searching = false;
    }
  }

  async function decide(action: 'link' | 'create' | 'dismiss', instructorId?: number) {
    const entry = current;
    if (!entry || busy) {
      return;
    }
    busy = true;
    errorMessage = '';
    notice = '';
    try {
      const response = await call(`/v1/admin/instructors/queue/${entry.id}`, {
        method: 'POST',
        body: JSON.stringify({ action, instructor_id: instructorId, actor: 'moderator' }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        errorMessage = body.error ?? `That did not work (HTTP ${response.status}).`;
        return;
      }
      const result = await response.json();
      notice = describe(result);

      // Drop it locally rather than reloading: the queue is worked top to
      // bottom, and a reload would move everything under the cursor.
      entries = entries.filter((row) => row.id !== entry.id);
      selected = Math.min(selected, Math.max(0, entries.length - 1));
      searchTerm = '';
      searchResults = [];
    } catch (error) {
      console.error(error);
      errorMessage = 'Could not save that decision.';
    } finally {
      busy = false;
    }
  }

  function describe(result: Record<string, unknown>): string {
    const moved = Number(result.moved_grade_rows ?? 0);
    const rows = `${moved.toLocaleString()} grade ${moved === 1 ? 'row' : 'rows'}`;
    if (result.status === 'created') {
      return `Created ${result.slug} and moved ${rows}.`;
    }
    if (result.status === 'linked') {
      return `Linked to ${result.slug} and moved ${rows}.`;
    }
    if (result.status === 'already_resolved') {
      return 'Someone else already decided that one.';
    }
    return 'Dismissed.';
  }

  function onKey(event: KeyboardEvent) {
    if (!authed || event.target instanceof HTMLInputElement) {
      return;
    }
    if (event.key === 'j') {
      selected = Math.min(selected + 1, entries.length - 1);
    } else if (event.key === 'k') {
      selected = Math.max(selected - 1, 0);
    } else if (event.key === 'n') {
      void decide('create');
    } else if (event.key === 'x') {
      void decide('dismiss');
    } else if (/^[1-9]$/.test(event.key)) {
      const candidate = current?.candidates[Number(event.key) - 1];
      if (candidate) {
        void decide('link', candidate.id);
      }
    }
  }

  function terms(c: Candidate): string {
    if (c.first_term === null || c.last_term === null) {
      return 'no terms recorded';
    }
    return c.first_term === c.last_term
      ? formatSemester(c.first_term)
      : `${formatSemester(c.first_term)} – ${formatSemester(c.last_term)}`;
  }
</script>

<svelte:window onkeydown={onKey} />

<svelte:head>
  <title>Instructor matching | Jupiterp</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="custom-scrollbar fixed inset-x-0 bottom-0 top-12 overflow-y-auto">
  <div class="mx-auto w-full max-w-5xl px-4 py-6">
    <h1 class="text-2xl font-bold">Instructor matching</h1>

    {#if !authed}
      <form
        class="border-outline my-4 flex max-w-md flex-col gap-3 rounded-lg border-2 p-4"
        onsubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label class="flex flex-col gap-1">
          <span class="text-sm font-bold">Moderator key</span>
          <input
            type="password"
            bind:value={adminKey}
            autocomplete="off"
            class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1"
          />
        </label>
        <label class="flex flex-row items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={remember} class="accent-orange" />
          Keep it for this tab
        </label>
        {#if errorMessage}
          <p class="text-danger text-sm" role="alert">{errorMessage}</p>
        {/if}
        <button class="bg-orange text-bg-primary rounded-lg px-4 py-2 font-bold" type="submit">
          {status === 'loading' ? 'Checking…' : 'Open queue'}
        </button>
      </form>
    {:else}
      <div class="text-text-secondary my-2 flex flex-row flex-wrap gap-3 text-sm">
        <span>{entries.length} awaiting a decision</span>
        <span>
          <kbd>j</kbd>/<kbd>k</kbd> move · <kbd>1</kbd>–<kbd>9</kbd> link · <kbd>n</kbd> new professor ·
          <kbd>x</kbd> dismiss
        </span>
        <button class="text-orange underline" onclick={() => load()}>Reload</button>
        <a class="text-orange underline" href="/admin/reviews">Review queue</a>
      </div>

      {#if notice}
        <p class="text-text-secondary my-2 text-sm">{notice}</p>
      {/if}
      {#if errorMessage}
        <p class="text-danger my-2 text-sm" role="alert">{errorMessage}</p>
      {/if}

      {#if entries.length === 0}
        <p class="my-6">Nothing left in the queue.</p>
      {:else}
        <div class="my-4 grid gap-4 lg:grid-cols-[16rem_1fr]">
          <!-- The queue -->
          <ol class="border-outline custom-scrollbar max-h-[70vh] overflow-y-auto rounded-lg border">
            {#each entries as entry, index (entry.id)}
              <li>
                <button
                  class="w-full border-b px-3 py-2 text-left text-sm {index === selected
                    ? 'bg-hover font-bold'
                    : ''}"
                  onclick={() => (selected = index)}
                >
                  <span class="block truncate">{entry.observed}</span>
                  <span class="text-text-secondary text-xs">
                    {entry.source} · {entry.candidates.length}
                    {entry.candidates.length === 1 ? 'candidate' : 'candidates'}
                  </span>
                </button>
              </li>
            {/each}
          </ol>

          <!-- The decision -->
          {#if current}
            <div class="border-outline rounded-lg border p-4">
              <h2 class="text-lg font-bold">{current.observed}</h2>
              <p class="text-text-secondary text-sm">
                Seen as <b>{current.source}</b>
                {#if current.context?.course_code}
                  in {current.context.course_code}
                {/if}
                {#if current.context?.term}
                  · {formatSemester(Number(current.context.term))}
                {/if}
              </p>

              <h3 class="mt-4 text-sm font-bold">Is this one of these?</h3>
              {#if current.candidates.length === 0}
                <p class="text-text-secondary my-2 text-sm">
                  The resolver found nothing similar. Search below, or create a new professor.
                </p>
              {:else}
                <ul class="my-2 flex flex-col gap-2">
                  {#each current.candidates as candidate, index (candidate.id)}
                    <li class="border-outline flex flex-row flex-wrap items-center gap-2 rounded-md border p-2">
                      <kbd class="text-text-secondary text-xs">{index + 1}</kbd>
                      <a
                        href="/professor/{candidate.slug}"
                        target="_blank"
                        rel="noopener"
                        class="text-orange font-bold underline"
                      >
                        {candidate.name}
                      </a>
                      <!-- The counts are the decision. Two names alone are a
                           coin flip; "340 grade rows over eleven terms" against
                           "none" is not. -->
                      <span class="text-text-secondary text-xs">
                        {candidate.grade_rows.toLocaleString()} grade rows ·
                        {candidate.sections} sections now ·
                        {terms(candidate)}
                      </span>
                      {#if candidate.is_active}
                        <span class="border-orange text-orange rounded-xl border px-2 text-xs">teaching</span>
                      {/if}
                      <button
                        class="bg-orange text-bg-primary ml-auto rounded-md px-3 py-1 text-sm font-bold"
                        disabled={busy}
                        onclick={() => decide('link', candidate.id)}
                      >
                        Link
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}

              <h3 class="mt-4 text-sm font-bold">Or find someone else</h3>
              <div class="my-2 flex flex-row gap-2">
                <input
                  bind:value={searchTerm}
                  placeholder="surname"
                  onkeydown={(event) => event.key === 'Enter' && runSearch()}
                  class="border-outline bg-bg-primary grow rounded-md border-2 px-2 py-1 text-sm"
                />
                <button class="border-outline rounded-md border px-3 py-1 text-sm" onclick={runSearch}>
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>
              {#if searchResults.length > 0}
                <ul class="my-2 flex flex-col gap-1">
                  {#each searchResults as result (result.id)}
                    <li class="flex flex-row items-center gap-2 text-sm">
                      <a
                        href="/professor/{result.slug}"
                        target="_blank"
                        rel="noopener"
                        class="text-orange underline"
                      >
                        {result.name}
                      </a>
                      <button
                        class="border-outline ml-auto rounded-md border px-2 py-0.5 text-xs"
                        disabled={busy}
                        onclick={() => decide('link', result.id)}
                      >
                        Link
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}

              <div class="border-border mt-4 flex flex-row flex-wrap gap-2 border-t pt-4">
                <button
                  class="border-orange text-orange rounded-md border px-3 py-1 text-sm font-bold"
                  disabled={busy}
                  onclick={() => decide('create')}
                >
                  New professor
                </button>
                <button
                  class="border-outline rounded-md border px-3 py-1 text-sm"
                  disabled={busy}
                  onclick={() => decide('dismiss')}
                >
                  Not a person
                </button>
              </div>
              <p class="text-text-secondary mt-2 text-xs">
                Linking moves every grade row under this spelling onto that professor and teaches the scraper the
                same answer. It cannot be undone from here.
              </p>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</main>
