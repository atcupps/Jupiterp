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
  }

  let { title, version, date, children }: Props = $props();
</script>

<div class="border-divBorderLight dark:border-divBorderDark mx-2 border-l-2 py-2">
  <div class="flex flex-col px-4">
    <div class="static flex flex-row items-end">
      <div class="bg-bgLight dark:bg-bgDark absolute h-5 w-5 translate-x-[-27px] translate-y-[-4px] p-1.5">
        <div class="bg-orange h-full w-full rounded-full"></div>
      </div>
      <span class="mr-2 text-xl font-bold dark:text-white">
        {title}
      </span>
      <span class="text-secCodesLight dark:text-secCodesDark font-light"> {version} </span>
    </div>
    <span class="align-top text-sm italic">
      {date}
    </span>

    <div>
      {@render children?.()}
    </div>
  </div>
</div>
