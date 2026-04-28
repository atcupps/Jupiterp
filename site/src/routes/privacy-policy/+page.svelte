<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang="ts">
    const h1Classes =
        "text-2xl border-b-2 border-divBorderLight dark:border-divBorderDark";
    const h2Classes =
        "text-xl border-b-2 border-divBorderLight dark:border-divBorderDark border-t-0 mt-6";
    const pClasses =
        "my-2 text-normal leading-5 text-textLight dark:text-textDark";
</script>

<div
    class="text-textLight dark:text-white py-2 px-8 overflow-y-scroll
            top-[3rem] lg:top-[3.5rem] xl:top-[4rem] bottom-0 fixed"
>
    <h1 class={h1Classes}>Privacy Policy for Jupiterp</h1>

    Last Updated: April 20, 2026

    <h2 class={h2Classes}>Introduction</h2>
    <p class={pClasses}>
        Welcome to Jupiterp. We are committed to protecting your personal
        information and your right to privacy. This Privacy Policy governs your
        use of the Jupiterp website and explains how your data is collected,
        used, and protected when you use our authentication services, including
        Google Sign-In.
    </p>

    <h2 class={h2Classes}>What Data We Collect</h2>
    <p class={pClasses}>
        When you sign in using Google OAuth, we request access to the minimum
        requisite information necessary to implement our services. Specifically,
        we collect your email address, your basic profile information (such as
        your name), and any course schedules that you create while using our
        application.
    </p>

    <h2 class={h2Classes}>Why We Request Your Data</h2>
    <p class={pClasses}>
        We use your email address as a unique identifier to securely manage and
        maintain your account. The primary purpose of collecting this
        information is so we can save your created course schedules to your
        specific account, allowing you to reliably access and utilize your
        personalized schedules across multiple sessions or devices.
    </p>

    <h2 class={h2Classes}>How Your Data is Used and Shared</h2>
    <p class={pClasses}>
        Your data is strictly used for the core functionalities of Jupiterp—to
        authenticate your identity and store your schedules securely. We do not
        sell, rent, or distribute your email, profile information, or any user
        data to any third-party data brokers, advertising platforms, or
        information resellers. Furthermore, your data will not be accessed,
        aggregated, or analyzed for external sale or distribution to any party
        conducting surveillance.
    </p>
    <p class={pClasses}>
        Jupiterp's use and transfer to any other app of information received
        from Google APIs will adhere to the <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            class="text-orange hover:underline font-semibold"
            >Google API Services User Data Policy</a
        >, including the Limited Use requirements.
    </p>

    <h2 class={h2Classes}>Data Security</h2>
    <p class={pClasses}>
        We take reasonable and appropriate steps to protect all applications and
        systems that make use of Google API Services to ensure that user data is
        secure in transit and at rest against unauthorized or unlawful access,
        use, destruction, loss, alteration, or disclosure.
    </p>

    <h2 class={h2Classes}>Changes to This Policy</h2>
    <p class={pClasses}>
        Jupiterp reserves the right to modify this Privacy Policy at any time.
        If we change the way your application uses Google user data, we will
        notify users and prompt them to consent to an updated privacy policy
        before making use of that data in a new way.
    </p>

    <h2 class={h2Classes}>Contact Us</h2>
    <p class={pClasses}>
        For any questions or concerns regarding these policies, please contact
        us at
        <code
            class="text-sm bg-bgSecondaryLight dark:bg-bgSecondaryDark rounded-md p-1 ml-1"
        >
            admin@jupiterp.com</code
        >.
    </p>
</div>
