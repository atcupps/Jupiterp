<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    export let link: string;
    export let text: string;
    export let target: string = '_self';
    export let fullWidth: boolean = false;
    export let isOnPage: boolean = false;
</script>

<a href={link} target={target}
        class='mx-4 px-1 font-normal transition'
        class:w-[90%]={fullWidth}
        class:siteLinkUnderline={isOnPage}
        class:text-orange={isOnPage}
        class:hover:text-orange={!isOnPage}
        class:dark:hover:text-lightOrange={!isOnPage}
        class:text-textLight={!isOnPage}
        class:dark:text-white={!isOnPage}>
    {text}
</a>

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