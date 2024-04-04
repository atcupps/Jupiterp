<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
 <script lang="ts">
    import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { PlusOutline, ChevronDownOutline, CloseOutline, ArrowUpDownOutline, ForwardSolid, PenNibOutline } from 'flowbite-svelte-icons';
    let dropdownOpen = false;
</script>

<div class="text-sm px-1 lg:px-0 grow">
    <Button class="w-full h-6 flex justify-between pl-2.5 bg-bgLight
                    dark:bg-bgDark text-outlineLight dark:text-[#9da3ae]
                    border-solid border-2 border-outlineLight dark:border-outlineDark">
        <span class="text-left">Options</span>
        <ChevronDownOutline class="w-5 h-5" />
    </Button>
    <Dropdown class="bg-bgLight dark:bg-divBorderDark w-24 rounded-b-md"
                bind:open={dropdownOpen}>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                                flex justify-start items-center"
                        on:click={() => (dropdownOpen = false)}>
            <PlusOutline class="w-3 h-3 mr-1" /> New
        </DropdownItem>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                             flex justify-start items-center"
                      on:click={() => (dropdownOpen = false)}>
            <CloseOutline class="w-3 h-3 mr-1" /> Delete
        </DropdownItem>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                             flex justify-start items-center"
                      on:click={() => (dropdownOpen = false)}>
            <ArrowUpDownOutline class="w-3 h-3 mr-1" /> Reorder
        </DropdownItem>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                      on:click={() => (dropdownOpen = false)}>
            <PenNibOutline class="w-3 h-3 mr-1" /> Rename
        </DropdownItem>
        <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                      on:click={() => (dropdownOpen = false)}>
            <ForwardSolid class="w-3 h-3 mr-1" /> Share
        </DropdownItem>
    </Dropdown>
</div>