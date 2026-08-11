<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  interface Props {
    link: string;
    text: string;
    target?: string;
    isOnPage?: boolean;
    reduceXMargin?: boolean;
  }

  let { link, text, target = '_self', isOnPage = false, reduceXMargin = false }: Props = $props();
</script>

<div class="mx-4 px-1 font-normal" class:mx-0={reduceXMargin}>
  <!-- BUG: This should be 'canonical' if isOnPage is true, but that cause resolve error -->
  <a
    href={link}
    {target}
    rel="external"
    class="text-nowrap transition"
    class:siteLinkUnderline={isOnPage}
    class:text-orange={isOnPage}
    class:hover:text-orange={!isOnPage}
    class:dark:hover:text-lightOrange={!isOnPage}
    class:text-textLight={!isOnPage}
    class:dark:text-white={!isOnPage}
  >
    {text}
  </a>
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
