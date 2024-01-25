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
</script>

<a href={link} target={target}
        class='mx-4 font-normal navbarelt
                text-textLight dark:text-white'
        class:w-[90%]={fullWidth}>
    {text}
</a>

<style>
    .navbarelt {
        display: inline-block;
        position: relative;
    }

    .navbarelt:hover {
        color: #F6743C;
        transition: transform 0.15s ease-out;
    }

    .navbarelt::after {
        content: '';
        position: absolute;
        width: 100%;
        transform: scaleX(0);
        height: 2px;
        bottom: 0;
        left: 0;
        background-color: #F6743C;
        transform-origin: bottom center;
        transition: transform 0.15s ease-out;
    }

    .navbarelt:hover::after {
        transform: scaleX(1);
        transform-origin: bottom center;
    }
</style>