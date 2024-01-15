<script>
    import '../app.css';
</script>

<div class='flex flex-col h-full w-full text-textLight dark:text-textDark'>
    <div class='flex h-16 border-b-2 border-divBorderLight dark:border-divBorderDark'>
        <img src='logo.svg' alt='Jupiterp logo'/>
        <span class='absolute left-[17.2rem] top-1 text-xl italic text-orange'>
            beta
        </span>
    </div>
    <slot/>
</div>