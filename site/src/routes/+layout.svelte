<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
  import { resolve } from '$app/paths';
  import '../app.css';
  import Analytics from '../components/layout/Analytics.svelte';
  import SiteLinks from '../components/layout/SiteLinks.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<svelte:head>
  <title>Jupiterp Course Planner</title>
  <meta
    name="description"
    content="Jupiterp, a free, open-source, web-based program to assist students at the University of Maryland - College Park in planning their schedules."
  />
</svelte:head>

<Analytics />

<div class="fixed z-50 w-full px-4">
  <div class="border-border flex h-12 flex-row justify-start border-b-2">
    <a href={resolve('/')} aria-label="Home" rel="canonical" class="flex py-1">
      <img
        src="logo.svg"
        alt="Jupiterp Logo"
        width="143.75"
        height="38"
        fetchpriority="high"
        decoding="sync"
        class="h-full w-auto"
      />
    </a>
    <SiteLinks />
  </div>
</div>

{@render children?.()}
