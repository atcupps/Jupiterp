<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
  import { page } from '$app/state';
  import type { Pathname } from '$app/types';
  import NavBarLink from './NavBarLink.svelte';
  import DarkModeToggle from './DarkModeToggle.svelte';
  import { BarsOutline, CloseOutline, AngleDownOutline, GithubSolid, BugSolid } from 'flowbite-svelte-icons';

  interface NavLink {
    link: Pathname;
    text: string;
    children?: { link: Pathname; text: string }[];
  }

  const navLinks: NavLink[] = [
    { link: '/', text: 'Course Planner' },
    { link: '/generate', text: 'Schedule Generator' },
    {
      link: '/about',
      text: 'About',
      children: [
        { link: '/terms-of-use', text: 'Terms of Use' },
        { link: '/privacy-policy', text: 'Privacy Policy' },
        { link: '/changelog', text: 'Changelog' },
      ],
    },
  ];

  const currentPath: string = $derived(page.url.pathname);
</script>

<input type="checkbox" id="nav-menu-toggle" class="peer hidden" />

<label for="nav-menu-toggle" class="-mr-4 flex cursor-pointer items-center px-4 peer-checked:hidden">
  <BarsOutline class="h-6 w-6" />
</label>

<label for="nav-menu-toggle" class="-mr-4 hidden cursor-pointer items-center px-4 peer-checked:flex">
  <CloseOutline class="h-6 w-6" />
</label>

<aside
  class="bg-bg-primary scrollbar-gutter-both custom-scrollbar fixed bottom-0 right-0 top-12 flex min-w-60 translate-x-full flex-col overflow-y-scroll border-l-2 px-4 py-2 text-lg font-bold transition-transform duration-300 peer-checked:translate-x-0"
>
  <ul class="flex flex-col gap-2">
    {#each navLinks as item, i (i)}
      {#if item.children}
        <li class="nav-list-wrapper relative">
          <!-- Hidden Checkbox acting as state toggle -->
          <input type="checkbox" id="nav-list-{i}" class="peer hidden" />

          <!-- Label acts as the clickable summary header -->
          <label for="nav-list-{i}" class="relative flex cursor-pointer items-center justify-between">
            <NavBarLink link={item.link} class="grow" current={currentPath === item.link}>
              {item.text}
            </NavBarLink>
          </label>

          <label
            for="nav-list-{i}"
            class="hover:text-orange dark:hover:text-light-orange absolute right-0 top-0 p-0.5 transition-transform peer-checked:rotate-180"
            ><AngleDownOutline height="1.5rem" width="1.5rem" />
          </label>

          <ul
            style="transition: height 0.3s;"
            class="border-y -mt-0.5 sm:mt-0 sm:border-y-0 flex h-auto flex-col overflow-clip pl-4 peer-checked:h-0 sm:h-0 sm:peer-checked:h-auto"
          >
            {#each item.children as child, j (j)}
              <NavBarLink link={child.link} current={currentPath === child.link} class="my-1">
                <span class="text-text-primary mr-2 select-none">-</span>
                {child.text}
              </NavBarLink>
            {/each}
          </ul>
        </li>
      {:else}
        <NavBarLink link={item.link} current={currentPath === item.link}>
          {item.text}
        </NavBarLink>
      {/if}
    {/each}
  </ul>
  <div class="mt-auto pt-4">
    <div class="flex flex-row justify-between">
      <DarkModeToggle />
      <NavBarLink
        link={'/bugs' as Pathname}
        class="hover:bg-hover rounded-lg px-4 py-1"
        current={currentPath === '/report-bug'}
      >
        <BugSolid class="h-6 w-6" />
      </NavBarLink>
      <a
        href="https://github.com/Jupiterp/Jupiterp"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-orange dark:hover:text-light-orange hover:bg-hover rounded-lg px-4 py-1"
      >
        <GithubSolid class="h-6 w-6" />
      </a>
    </div>
    <p class="text-text-secondary my-2 text-sm">Made with ❤ by the Jupiterp Team.</p>
  </div>
</aside>

<style>
  /* TEMP: Just to make sure height:auto can be calculated and animated */
  li.nav-list-wrapper {
    @supports (interpolate-size: allow-keywords) {
      interpolate-size: allow-keywords;
    }
  }
</style>
