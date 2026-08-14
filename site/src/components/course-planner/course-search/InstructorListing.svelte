<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { ptLinkFromSlug } from '../../../lib/course-planner/Professors';
  import { ProfsLookupStore } from '../../../stores/CoursePlannerStores';

  // 1. Properly define the component props type contract
  interface Props {
    instructor?: string;
    profsHover: boolean;
    removeHoverSection: () => void;
  }

  // eslint-disable-next-line no-useless-assignment
  let { instructor = 'No instructor', profsHover = $bindable(), removeHoverSection }: Props = $props();

  let profs = $derived($ProfsLookupStore);

  let currentProf = $derived.by(() => {
    const name = instructor ?? 'No instructor';
    const profData = profs?.[name];

    if (profData && profData.average_rating != null) {
      return {
        name,
        slug: profData.slug,
        rating: profData.average_rating,
        starsStyle: `--rating: ${convertRating(profData.average_rating)}%`,
      };
    }
    return null;
  });

  // Convert rating to a percentage for CSS
  function convertRating(rating: string | null): number {
    if (rating == null) {
      throw Error('Rating was null in `convertRating`; this should never happen!');
    }
    return parseFloat(rating) * 20;
  }

  function handleLinkClick(event: MouseEvent) {
    // Prevent the event from propagating to the button
    event.stopPropagation();
  }
</script>

<div class="text-sm xl:text-base">
  {#if currentProf}
    <a
      href={ptLinkFromSlug(currentProf.slug)}
      rel="external noopener noreferrer"
      target="_blank"
      class="text-orange hover:bg-hover inline-flex flex-wrap rounded-md underline"
      onmouseenter={() => {
        profsHover = true; // Mutating properties directly updates parent binding
        removeHoverSection();
      }}
      onmouseleave={() => {
        profsHover = false;
        removeHoverSection();
      }}
      onclick={handleLinkClick}
      title="View Instructor on PlanetTerp"
    >
      {currentProf.name}
      <!-- format-check exempt 3 -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        height="12"
        width="12"
        class="mt-1"
      >
        <path
          d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"
        />
        <path
          d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"
        />
      </svg>
    </a>
    <span
      style={currentProf.starsStyle}
      class="stars text-orange text-xs font-bold xl:text-sm 2xl:text-base"
      title="{currentProf.rating} out of 5"
    >
      ★★★★★
    </span>
  {:else}
    {instructor ?? 'No instructor'}
  {/if}
</div>

<style>
  .stars {
    background: rgb(246, 116, 60);
    background: linear-gradient(
      90deg,
      rgba(246, 116, 60, 1) 0%,
      rgba(246, 116, 60, 1) var(--rating),
      rgba(115, 53, 26, 1) var(--rating),
      rgba(115, 53, 26, 1) 100%
    );

    /* Set the background size and repeat properties. */
    background-size: 100%;
    background-repeat: repeat;

    /* Use the text as a mask for the background. */
    /* This will show the gradient as a text color. */
    background-clip: text;
    -webkit-text-fill-color: transparent;
    -moz-background-clip: text;
    -moz-text-fill-color: transparent;
  }
</style>
