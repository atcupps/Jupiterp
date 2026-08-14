<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Pathname } from '$app/types';

  interface Props {
    link: Pathname;
    current?: boolean;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { link, current = false, children, class: className = '' }: Props = $props();
  let resolvedLink = $derived(resolve(link));
</script>

<a
  href={resolvedLink}
  target="_self"
  rel="canonical"
  class="aria-current:border-orange hover:text-orange dark:hover:text-light-orange aria-current:text-orange border-b-2 border-transparent hover:transition-colors {className}"
  aria-current={current}
>
  {@render children?.()}
</a>
