<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script>
    import '../app.css';
    import SiteLinks from './SiteLinks.svelte';
</script>

<div class='px-8 w-full fixed z-[50] bg-bgLight dark:bg-bgDark'>
    <div class='flex flex-row h-12 lg:h-14 xl:h-16 w-full border-b-2
                            border-divBorderLight dark:border-divBorderDark
                            justify-center lg:justify-start'>
        <img src='logo.svg' alt='Jupiterp Beta logo' class='flex'/>
        <SiteLinks />
    </div>
</div>

<div class='flex flex-col h-full w-full text-textLight
            dark:text-textDark lg:px-8'>
    <div class='flex'>
        <div class='flex flex-row h-12 lg:h-14 xl:h-16 px-2 w-full border-b-2
                        border-divBorderLight dark:border-divBorderDark
                        justify-center lg:justify-start'/>
    </div>
    <slot/>
</div>