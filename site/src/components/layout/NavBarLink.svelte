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
    title?: string;
    children?: import('svelte').Snippet;
  }

  let { link, current = false, class: className = '', title = '', children }: Props = $props();
  let resolvedLink = $derived(resolve(link));
</script>

<a
  href={resolvedLink}
  target="_self"
  rel="canonical"
  class="hover:text-orange dark:hover:text-light-orange aria-current:text-orange aria-current:underline text-nowrap underline-offset-4 hover:transition-colors {className}"
  aria-current={current}
  {title}
>
  {@render children?.()}
</a>
