<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { run } from 'svelte/legacy';

  interface Props {
    isDesktop?: boolean;
  }

  let { isDesktop = $bindable(false) }: Props = $props();

  let innerWidth: number = $state(0);

  run(() => {
    isDesktop = innerWidth >= 1024;
  });

  export { isDesktop };
</script>

<svelte:window bind:innerWidth />
