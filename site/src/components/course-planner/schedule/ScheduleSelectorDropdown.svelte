<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang="ts">
    import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    let dropdownOpen = false;
</script>

<div class="text-sm px-1 lg:px-0 w-[70%] mr-0 lg:mr-1">
    <Button class="w-full h-6 flex justify-between pl-2.5 bg-bgLight
                   dark:bg-bgDark text-outlineLight dark:text-[#9da3ae]
                   border-solid border-2 border-outlineLight dark:border-outlineDark">
        <span class="text-left">Select schedule</span>
        <ChevronDownOutline class="w-5 h-5" />
    </Button>
    <Dropdown class="bg-bgLight dark:bg-divBorderDark w-52 rounded-b-md"
                bind:open={dropdownOpen}>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2"
                      on:click={() => (dropdownOpen = false)}>
            My schedule
        </DropdownItem>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2"
                      on:click={() => (dropdownOpen = false)}>
            Alan
        </DropdownItem>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2"
                      on:click={() => (dropdownOpen = false)}>
            Jupiterp jupiterp
        </DropdownItem>
    </Dropdown>
</div>