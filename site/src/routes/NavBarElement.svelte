<script lang='ts'>
    export let link: string;
    export let text: string;
    export let target: string = '_self';
</script>

<a href={link} target={target}
        class='mx-4 text-orange font-normal navbarelt'>
    {text}
</a>

<style>
    .navbarelt {
        display: inline-block;
        position: relative;
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