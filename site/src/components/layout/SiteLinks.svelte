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

<!-- [START] Nav Menu Toggle  -->
<input type="checkbox" id="nav-menu-toggle" class="peer hidden" />
<label for="nav-menu-toggle" class="-mr-4 flex cursor-pointer items-center px-4 peer-checked:hidden md:hidden">
  <BarsOutline class="h-6 w-6" />
</label>
<label
  for="nav-menu-toggle"
  class="-mr-4 hidden cursor-pointer items-center px-4 peer-checked:flex md:peer-checked:hidden"
>
  <CloseOutline class="h-6 w-6" />
  <div class="-z-1 fixed bottom-0 left-0 right-0 top-12 bg-black/50"></div>
</label>
<!-- [END] Nav Menu Toggle  -->

<aside
  class="max-md:bg-bg-primary max-md:scrollbar-gutter-both custom-scrollbar flex py-2 text-lg max-md:fixed max-md:bottom-0 max-md:right-0 max-md:top-12 max-md:min-w-60 max-md:translate-x-full max-md:flex-col max-md:overflow-y-scroll max-md:border-l-2 max-md:px-4 max-md:transition-transform max-md:duration-300 max-md:peer-checked:translate-x-0 md:gap-2"
>
  <div class="flex gap-2 max-md:flex-col md:gap-5">
    {#each navLinks as item, i (i)}
      {#if item.children}
        <div class="nav-list-wrapper relative">
          <NavBarLink link={item.link} current={currentPath === item.link}>
            {item.text}
          </NavBarLink>

          <!-- [START] Nav List Toggle  -->
          <input type="checkbox" id="nav-list-{i}" class="peer hidden" />
          <label
            for="nav-list-{i}"
            class="nav-list-toggle hover:text-orange dark:hover:text-light-orange float-right origin-center transition-transform max-md:peer-checked:rotate-180"
            ><AngleDownOutline height="1.75rem" width="1.75rem" class="p-0.75" />
          </label>
          <label for="nav-list-{i}" class="fixed inset-0 hidden bg-black/50 md:peer-checked:block"></label>
          <!-- [END] Nav List Toggle  -->

          <div
            style="transition: height 0.3s;"
            class="md:-left-4.25 md:bg-bg-primary md:peer-checked:border-border md:mt-2.75 -mt-px flex h-auto flex-col overflow-clip peer-checked:h-0 max-md:border-y md:absolute md:h-0 md:rounded-lg md:border md:peer-checked:h-auto"
          >
            {#each item.children as child, j (j)}
              <NavBarLink link={child.link} current={currentPath === child.link} class="md:hover:bg-hover px-4 py-1">
                {child.text}
              </NavBarLink>
            {/each}
          </div>
        </div>
      {:else}
        <NavBarLink link={item.link} current={currentPath === item.link}>
          {item.text}
        </NavBarLink>
      {/if}
    {/each}
  </div>
  <div class="mt-auto max-md:pt-4">
    <div class="flex flex-row justify-between md:gap-1">
      <DarkModeToggle />
      <NavBarLink
        link={'/bugs' as Pathname}
        class="hover:bg-hover rounded-lg px-4 py-1 md:p-1"
        current={currentPath === '/bugs'}
        title="Report a Bug or Issue"
      >
        <BugSolid class="h-6 w-6" />
      </NavBarLink>
      <a
        href="https://github.com/Jupiterp/Jupiterp"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-orange dark:hover:text-light-orange hover:bg-hover rounded-lg px-4 py-1 md:p-1"
        title="View GitHub Repository"
      >
        <GithubSolid class="h-6 w-6" />
      </a>
    </div>
    <p class="text-text-secondary my-2 text-sm md:hidden">Made with ❤ by the Jupiterp Team.</p>
  </div>
</aside>

<style>
  /* TEMP: Just to make sure height:auto can be calculated and animated */
  li.nav-list-wrapper {
    @supports (interpolate-size: allow-keywords) {
      interpolate-size: allow-keywords;
    }

    @media (min-width: 768px) {
      padding-bottom: 0.75rem;
      margin-bottom: -0.75rem;

      &:hover {
        > label.nav-list-toggle {
          transform: rotate(180deg);
        }
        > ul {
          height: auto;
          --tw-shadow:
            0 10px 15px -3px var(--tw-shadow-color, rgb(0 0 0 / 0.1)),
            0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
          box-shadow:
            var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
            var(--tw-shadow);
        }
      }
    }
  }
</style>
