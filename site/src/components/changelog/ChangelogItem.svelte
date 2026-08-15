<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
  interface Props {
    title: string;
    version: string;
    date: string;
    children?: import('svelte').Snippet;
    index: number;
  }

  let { title, version, date, children, index }: Props = $props();
</script>

<!-- Article uses pure fade-in -->
<article
  style="animation-delay: {index * 100}ms;"
  class="border-border hover:border-orange/50 animate-fade-in border-l-2 px-4 py-1 text-left opacity-0"
>
  <div class="relative mt-2 flex w-full flex-wrap items-baseline">
    <!-- Dot uses pure fade-in -->
    <div
      style="animation-delay: {index * 100}ms;"
      class="-left-6.75 bg-orange border-5 border-bg-primary animate-fade-in absolute top-1 h-5 w-5 rounded-2xl opacity-0"
    ></div>

    <!-- Contained wrapper for the header text -->
    <div class="w-full overflow-hidden">
      <div style="animation-delay: {index * 100}ms;" class="animate-fade-in-up flex w-full items-baseline opacity-0">
        <h3 id={version} class="mr-auto mt-0 w-fit scroll-mt-4 pr-4 text-lg font-bold">
          {title}
          <a href={`#${version}`} class="text-orange text-sm no-underline">
            v{version}
          </a>
        </h3>
        <span class="subtitle mt-1 block w-fit text-right">
          {date}
        </span>
      </div>
    </div>
  </div>

  <!-- Contained wrapper for the paragraph -->
  <div class="overflow-hidden">
    <p style="animation-delay: {index * 100}ms;" class="animate-fade-in-up opacity-0">
      {@render children?.()}
    </p>
  </div>
</article>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
      will-change: opacity;
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
      will-change: transform, opacity;
    }
  }
</style>
