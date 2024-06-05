<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    import { AngleDownOutline } from "flowbite-svelte-icons";

    export let link: string;
    export let text: string;
    export let target: string = '_self';
    export let fullWidth: boolean = false;
    export let isOnPage: boolean = false;

    let showExpandedLinks: boolean = false;
</script>

<!-- Ignoring a11y because `focus` supplements `mouse` -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='mx-4 px-1 font-normal relative'
        on:mouseenter={() => {showExpandedLinks = true;}}
        on:mouseleave={() => {showExpandedLinks = false;}}
        on:focusin={() => {showExpandedLinks = true}}
        on:focusout={() => {showExpandedLinks = false}}>
    <a href={link} target={target}
        class='transition inline-flex items-center'>
        <span
            class:w-[90%]={fullWidth}
            class:siteLinkUnderline={isOnPage}
            class:text-orange={isOnPage}
            class:hover:text-orange={!isOnPage}
            class:dark:hover:text-lightOrange={!isOnPage}
            class:text-textLight={!isOnPage}
            class:dark:text-white={!isOnPage}>
                {text}
        </span>
        <AngleDownOutline class='w-3 h-3 ml-1 
                                text-textLight dark:text-textDark' />
    </a>
    <div class='absolute top-full min-w-12 flex flex-col bg-bgLight
                dark:bg-bgDark p-2 translate-x-[-12%] rounded-lg visible
                border-2 border-divBorderLight dark:border-divBorderDark'
            class:hidden={!showExpandedLinks}>
        <slot/>
    </div>
</div>

<style>
    .siteLinkUnderline {
        display: inline-block;
        position: relative;
    }

    .siteLinkUnderline::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 2px;
        bottom: 0;
        left: 0;
        transform: scaleX(95%);
        transform-origin: center;
        background-color: #F6743C;
    }
</style>