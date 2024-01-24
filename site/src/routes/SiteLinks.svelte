<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { fade } from 'svelte/transition';
    import NavBarElement from './NavBarElement.svelte';

    let siteLinksSelected: boolean = false;
</script>

<!-- For larger screens -->
<div class='grow justify-end self-center hidden lg:flex'>
    <NavBarElement link='./' text='Course Planner' />
    <NavBarElement link='./about' text='About' />
    <NavBarElement link='https://github.com/atcupps/Jupiterp'
                                                text='GitHub'
                                                target='_blank' />
</div>

<!-- Button to toggle course search on mobile -->
<button class='absolute h-6 w-6 top-3 right-5 visible lg:hidden z-[52]'
        on:click={() => {siteLinksSelected = !siteLinksSelected}}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"
            class='visible h-full w-full transition 
                    fill-textLight dark:fill-textDark'
            class:hidden={siteLinksSelected}>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"
            class='visible h-full w-full transition 
                    fill-textLight dark:fill-textDark'
            class:hidden={!siteLinksSelected}>
                <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
</button>
    
<!-- Layer to exit course search if user taps on the Schedule -->
<!-- Using this method to avoid having to listen to a variable on Schedule -->
{#if siteLinksSelected}
    <button class='fixed w-full top-[3rem] bg-black bg-opacity-20 z-[55]
                    visible lg:hidden'
            style='height: calc(100% - 3rem);'
        in:fade={{ duration: 150 }}
        out:fade={{ duration: 150 }} 
        on:click={() => siteLinksSelected = false}/>
{/if}

<!-- Mobile site links -->
<div class='flex flex-col w-[300px] fixed site-links z-[61] border-l-2
            border-divBorderLight dark:border-divBorderDark  
            border-solid p-2 visible lg:hidden bg-bgLight dark:bg-bgDark
            right-0 top-[3rem] transition-transform duration-300'
        class:site-links-transition={!siteLinksSelected}
        class:shadow-lg={siteLinksSelected}>
    <div class='w-full my-2 text-lg'>
        <NavBarElement link='./' text='Course Planner' fullWidth={true}/>
    </div>
    <div class='w-full my-2 text-lg'>
        <NavBarElement link='./about' text='About'  fullWidth={true}/>
    </div>
    <div class='w-full my-2 text-lg'>
        <NavBarElement link='https://github.com/atcupps/Jupiterp'
                                                    text='GitHub'
                                                    target='_blank' 
                                                    fullWidth={true}/>
    </div>
</div>

<style>
    @media screen and (max-width: 1023px) {
        .site-links {
            height: calc(100vh - 3rem);
        }

        .site-links-transition {
            transition-property: transform;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
            transform: translateX(100%);
        }
    }
</style>