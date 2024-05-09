<script lang='ts'>
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

<button class='w-5 h-5 bg-orange' 
        on:click={toggleDarkMode} />