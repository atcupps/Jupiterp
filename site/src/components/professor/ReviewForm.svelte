<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { submitReview } from '../../lib/api/JupiterpApi';
  import StarRatingInput from './StarRatingInput.svelte';

  interface Props {
    instructorSlug: string;
    instructorName: string;
    /** Courses this professor has taught, for the course picker. */
    courseCodes?: string[];
  }

  let { instructorSlug, instructorName, courseCodes = [] }: Props = $props();

  const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'W', 'Other'];

  /**
   * Fall and Spring only, newest first.
   *
   * The grade dataset covers those two terms permanently, and the API rejects
   * anything else, so offering Summer here would only produce a confusing
   * server-side error after the user has written five hundred words.
   */
  const TERMS: { value: number; label: string }[] = (() => {
    const out: { value: number; label: string }[] = [];
    const now = new Date();
    const year = now.getFullYear();
    for (let y = year; y >= year - 8; y--) {
      out.push({ value: y * 100 + 8, label: `Fall ${y}` });
      out.push({ value: y * 100 + 1, label: `Spring ${y}` });
    }
    return out.filter((t) => t.value <= year * 100 + (now.getMonth() >= 7 ? 8 : 1));
  })();

  /**
   * The term in progress, which is the one nearly every review is about.
   *
   * TERMS is newest-first and already truncated to terms that have started, so
   * its first entry is the current one. Prefilled rather than left blank
   * because the alternative is a form where the most common answer is the one
   * requiring the most work, and an unset term makes a review much less useful
   * to the next student reading it.
   */
  const CURRENT_TERM = TERMS.length > 0 ? String(TERMS[0].value) : '';

  let rating = $state(4);
  let courseCode = $state('');
  let term = $state(CURRENT_TERM);
  let expectedGrade = $state('');
  let title = $state('');
  let body = $state('');
  let email = $state('');
  let agreed = $state(false);

  let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
  let errorMessage = $state('');

  let bodyLength = $derived([...body].length);
  let titleLength = $derived([...title].length);
  let canSubmit = $derived(status !== 'sending' && email.trim() !== '' && agreed);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    status = 'sending';
    errorMessage = '';

    const result = await submitReview({
      instructor_slug: instructorSlug,
      course_code: courseCode || undefined,
      term: term ? Number(term) : undefined,
      rating,
      expected_grade: expectedGrade || undefined,
      title: title.trim() || undefined,
      body: body.trim() || undefined,
      email: email.trim(),
      // Turnstile renders a token into a hidden input named cf-turnstile-response
      // when the widget script is present. Absent in development, where the
      // API treats captcha as satisfied.
      captcha_token:
        (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ?? undefined,
    });

    if (result.ok) {
      status = 'sent';
      return;
    }
    status = 'error';
    errorMessage = result.error ?? 'Something went wrong.';
  }
</script>

{#if status === 'sent'}
  <!-- Deliberately says nothing about whether this address had already
       reviewed this professor. The API answers identically either way, and
       leaking the difference here would undo that. -->
  <div class="border-outline rounded-lg border-2 p-4">
    <h3 class="text-lg font-bold">Check your email</h3>
    <p class="my-2 text-sm">
      If <b>{email}</b> is a valid UMD address, a confirmation link is on its way. Your review is not submitted until you
      click it.
    </p>
    <p class="text-text-secondary my-2 text-sm">
      The link expires in 48 hours. Check your spam folder — university mail filters are aggressive.
    </p>
  </div>
{:else}
  <form class="border-outline flex flex-col gap-4 rounded-lg border-2 p-4" onsubmit={handleSubmit}>
    <h3 class="text-lg font-bold">Review {instructorName}</h3>

    <div class="flex flex-col gap-1">
      <span class="text-sm font-bold">Rating</span>
      <StarRatingInput bind:value={rating} />
    </div>

    <div class="flex flex-row flex-wrap gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-bold">Course <span class="text-text-secondary">(optional)</span></span>
        <!--
          A select, matching Term and Grade beside it. This was an input with a
          datalist, which renders as a text box with a browser-drawn suggestion
          popup: a different height, a different control, and a dropdown that
          floats away from the field rather than under it.

          Nothing is lost by closing the list. The options are every course this
          professor is teaching now plus every one they have grade history for,
          so a student reviewing a course they took has it; and the field is
          optional, so a course that is somehow missing is left blank rather
          than blocking the review.
        -->
        <select bind:value={courseCode} class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1">
          <option value="">—</option>
          {#each courseCodes as code (code)}
            <option value={code}>{code}</option>
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-bold">Term <span class="text-text-secondary">(optional)</span></span>
        <select bind:value={term} class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1">
          <option value="">—</option>
          {#each TERMS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-bold">Your grade <span class="text-text-secondary">(optional)</span></span>
        <select bind:value={expectedGrade} class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1">
          <option value="">—</option>
          {#each GRADES as grade (grade)}
            <option value={grade}>{grade}</option>
          {/each}
        </select>
      </label>
    </div>

    <label class="flex flex-col gap-1">
      <span class="text-sm font-bold">
        Title <span class="text-text-secondary">(optional, {titleLength}/120)</span>
      </span>
      <input bind:value={title} maxlength="120" class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1" />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-sm font-bold">
        Review <span class="text-text-secondary">(optional, {bodyLength}/5000)</span>
      </span>
      <textarea
        bind:value={body}
        maxlength="5000"
        rows="6"
        placeholder="What was the course actually like? Workload, grading, whether the lectures helped."
        class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1"></textarea>
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-sm font-bold">UMD email</span>
      <input
        type="email"
        bind:value={email}
        required
        placeholder="you@terpmail.umd.edu"
        autocomplete="email"
        class="border-outline bg-bg-primary rounded-md border-2 px-2 py-1"
      />
      <!-- Explaining this inline rather than in a policy nobody opens is the
           difference between a form people complete and one they abandon. -->
      <span class="text-text-secondary text-xs">
        Used once to check you're at UMD and to stop duplicate reviews. Stored only as an irreversible hash — never
        shown to anyone, including the professor.
      </span>
    </label>

    <!-- Cloudflare Turnstile mounts here when the site key is configured. -->
    <div class="cf-turnstile" data-sitekey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? ''}></div>

    <label class="flex flex-row items-start gap-2 text-sm">
      <input type="checkbox" bind:checked={agreed} class="accent-orange mt-1" required />
      <span>
        This is my own first-hand experience of a course I took, and it follows the
        <a href={resolve('/review-policy')} class="text-orange underline" target="_blank" rel="noopener"
          >review policy</a
        >.
      </span>
    </label>

    {#if status === 'error'}
      <p class="text-danger text-sm" role="alert">{errorMessage}</p>
    {/if}

    <button
      type="submit"
      disabled={!canSubmit}
      class="bg-orange text-bg-primary rounded-lg px-4 py-2 font-bold disabled:opacity-50"
    >
      {status === 'sending' ? 'Sending…' : 'Submit review'}
    </button>

    <p class="text-text-secondary text-xs">
      Every review is read by a moderator before it appears. You'll get a link to edit or withdraw it.
    </p>
  </form>
{/if}
