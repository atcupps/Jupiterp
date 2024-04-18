<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
 <script lang="ts">
    import { Dropdown, DropdownItem } from 'flowbite-svelte';
    import {
        ForwardSolid, DotsVerticalOutline, 
        TrashBinOutline, FileCopyOutline, CloseOutline

    } from 'flowbite-svelte-icons';
    let dropdownOpen = false;
</script>

<button>
    <DotsVerticalOutline class="w-5 h-5" />
</button>
<Dropdown class="bg-bgLight dark:bg-divBorderDark w-24 rounded-b-md"
            bind:open={dropdownOpen}>
    <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                    on:click={() => (dropdownOpen = false)}>
        <CloseOutline class="w-3 h-3 mr-1" /> Clear
    </DropdownItem>
    <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                    on:click={() => (dropdownOpen = false)}>
        <TrashBinOutline class="w-3 h-3 mr-1" /> Delete
    </DropdownItem>
    <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                            flex justify-start items-center"
                    on:click={() => (dropdownOpen = false)}>
        <FileCopyOutline class="w-3 h-3 mr-1" /> Duplicate
    </DropdownItem>
    <DropdownItem class="hover:bg-hoverLight dark:hover:bg-hoverDark px-2
                        flex justify-start items-center"
                    on:click={() => (dropdownOpen = false)}>
        <ForwardSolid class="w-3 h-3 mr-1" /> Share
    </DropdownItem>
</Dropdown>