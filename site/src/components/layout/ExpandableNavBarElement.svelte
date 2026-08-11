<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { AngleDownOutline } from 'flowbite-svelte-icons';

  interface Props {
    link: string;
    text: string;
    target?: string;
    isOnPage?: boolean;
    reduceXMargin?: boolean; // Added to prevent TypeScript errors from parent usage
    children?: import('svelte').Snippet;
  }

  let { link, text, target = '_self', isOnPage = false, reduceXMargin = false, children }: Props = $props();
</script>

<div class={`${reduceXMargin ? 'mx-1' : 'mx-4'} group relative px-1 font-normal`}>
  <!-- ERROR: Navigation without resolve as link can be external AND internal -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <a
    href={link}
    {target}
    rel={target === '_blank' ? 'noopener noreferrer' : 'canonical'}
    class="inline-flex items-center transition"
  >
    <span
      class={`${isOnPage ? 'siteLinkUnderline text-orange' : 'text-textLight hover:text-orange dark:hover:text-lightOrange dark:text-white'}`}
    >
      {text}
    </span>
  </a>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
  <button
    title="Show more links"
    class="text-textLight hover:text-orange group-focus-within:text-orange group-hover:text-orange dark:text-textDark dark:hover:text-lightOrange group-focus-within:dark:text-lightOrange group-hover:dark:text-lightOrange transition group-focus-within:rotate-180 group-hover:rotate-180"
  >
    <AngleDownOutline class="ml h-3.5 w-3.5" />
  </button>
  <div
    class="transition-visibility border-divBorderLight bg-bgLight dark:border-divBorderDark dark:bg-bgDark invisible absolute top-full flex min-w-12 translate-x-[-12%] flex-col gap-2 rounded-lg border-2 p-2 group-focus-within:visible group-hover:visible"
  >
    {@render children?.()}
  </div>
</div>

<style>
  .siteLinkUnderline {
    display: inline-block;
    position: relative;
  }

  .siteLinkUnderline::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    bottom: 0;
    left: 0;
    transform: scaleX(95%);
    transform-origin: center;
    background-color: #f6743c;
  }
</style>
