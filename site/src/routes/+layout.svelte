<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang='ts'>
    import '../app.css';
    import Analytics from '../components/layout/Analytics.svelte';
    import SiteLinks from '../components/layout/SiteLinks.svelte';
</script>

<Analytics />

<div class='px-8 w-full fixed z-[50] bg-bgLight dark:bg-bgDark'>
    <div class='flex flex-row h-11 lg:h-12 xl:h-12 w-full border-b-2
                            border-divBorderLight dark:border-divBorderDark
                            justify-center lg:justify-start'>
        <a href='/' class='flex w-64 justify-center lg:justify-start'>
            <img src='logo.svg' alt='Jupiterp Beta logo'/>
        </a>
        <SiteLinks />
    </div>
</div>

<slot />