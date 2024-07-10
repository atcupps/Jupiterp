<script lang='ts'>
    import { SunOutline } from "flowbite-svelte-icons";
    import { MoonOutline } from "flowbite-svelte-icons";

    function toggleDarkMode() {
        const isDark: boolean = (localStorage.theme === 'dark');
        if (isDark) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }

        document.documentElement.classList.toggle('dark');
    }
</script>

<button class='w-9 h-5 mx-4 bg-transparent border-solid border rounded-[10px]
                border-outlineLight dark:border-outlineDark static
                hover:border-black dark:hover:border-white 
                hover:transition-colors translate-y-[0%] xl:translate-y-[10%]'
        on:click={toggleDarkMode} >
    <div class='absolute rounded-[8px] h-4 w-4 top-[50%] translate-y-[-55%]
                left-0 dark:translate-x-[1.12rem]
                bg-bgSecondaryLight dark:bg-hoverDark transform
                transition-transform duration-300 ease-in-out'>
        <SunOutline class='relative left-[50%] top-[50%]
                            w-3 h-3
                            translate-x-[-55%] translate-y-[-50%]
                            text-black visible dark:hidden' />
        <MoonOutline class='relative w-3 h-3 left-[50%] top-[50%]
                            translate-x-[-50%] translate-y-[-50%]
                            text-white hidden dark:block' />
    </div>
</button>