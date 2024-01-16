<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script>
    import '../app.css';
    import NavBarElement from './NavBarElement.svelte';
</script>

<div class='flex flex-col h-full w-full text-textLight dark:text-textDark'>
    <div class='flex'>
        <div class='flex flex-row h-16 px-2 w-full border-b-2
                        border-divBorderLight dark:border-divBorderDark'>
            <img src='logo.svg' alt='Jupiterp Beta logo' class='flex'/>
            <div class='flex grow justify-end self-center'>
                <NavBarElement link='./' text='Course Planner' />
                <NavBarElement link='./about' text='About' />
                <NavBarElement link='https://github.com/atcupps/Jupiterp'
                                                            text='GitHub'
                                                            target='_blank' />
            </div>
        </div>
    </div>
    <slot/>
</div>