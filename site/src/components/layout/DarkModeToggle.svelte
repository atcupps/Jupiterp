<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { SunOutline } from 'flowbite-svelte-icons';
  import { MoonSolid } from 'flowbite-svelte-icons';

  function toggleDarkMode() {
    const isDark: boolean = localStorage.theme === 'dark';
    if (isDark) {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.setItem('theme', 'dark');
    }

    document.documentElement.classList.toggle('dark');
  }
</script>

<button
  class="hover:bg-hover hover:text-orange dark:hover:text-light-orange rounded-lg px-4 py-1 sm:p-1"
  title="Toggle Theme"
  onclick={toggleDarkMode}
>
  <SunOutline class="h-6 w-6 dark:hidden" />
  <MoonSolid class="hidden h-6 w-6 dark:block" />
</button>
