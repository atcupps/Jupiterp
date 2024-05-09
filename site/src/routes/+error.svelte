<script>
// @ts-nocheck

	import { page } from '$app/stores';
</script>

<div class='error'>
    <h1 class='text-black dark:text-white error-message'>
        Error {$page.status}:
        {$page.error.message}
    </h1>
</div>

<style>
    .error {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
        width: 100%;
        padding-left: 4rem;
    }

    .error-message {
        font-size: 3rem;
    }
</style>