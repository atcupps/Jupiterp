<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script>
    import '../app.css';
    import SiteLinks from './SiteLinks.svelte';
</script>

<div class='flex flex-row h-12 lg:h-14 xl:h-16 px-2 w-full border-b-2
                        border-divBorderLight dark:border-divBorderDark
                        bg-bgLight dark:bg-bgDark z-[50]
                        justify-center lg:justify-start fixed'>
    <img src='logo.svg' alt='Jupiterp Beta logo' class='flex'/>
    <SiteLinks />
</div>

<div class='flex flex-col h-full w-full text-textLight
            dark:text-textDark lg:px-8'>
    <div class='flex'>
        <div class='flex flex-row h-12 lg:h-14 xl:h-16 px-2 w-full border-b-2
                        border-divBorderLight dark:border-divBorderDark
                        justify-center lg:justify-start'>
        </div>
    </div>
    <slot/>
</div>