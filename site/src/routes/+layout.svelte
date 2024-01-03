<script>
    import '../app.css';
</script>

<div class='flex flex-col h-full w-full text-textLight dark:text-textDark'>
    <div class='flex h-20 border-b-2 border-divBorderLight dark:border-divBorderDark'>
        <img src='logo.svg' alt='Jupiterp logo' />
    </div>
    <slot/>
</div>