<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang='ts'>
    const h1Classes = 
        'text-2xl border-b-2 border-divBorderLight dark:border-divBorderDark';
    const h2Classes =
        'text-xl border-b-2 border-divBorderLight dark:border-divBorderDark';
    const pClasses = 
        'my-2 text-normal leading-5 text-textLight dark:text-textDark';
</script>

<div class='text-textLight dark:text-white py-2 px-8 overflow-y-scroll'>
    <h1 class={h1Classes}>
        About Jupiterp
    </h1>
    <p class={pClasses}>
        Jupiterp is a website built to help students plan their schedules and
        make informed decisions about their course and section selections.
        Jupiterp provides a course planner that allows students to search for
        courses, see sections complete with instructor reviews from
        <a href='https://planetterp.com' target='_blank'
            class='text-orange underline'>PlanetTerp</a>, and
        visualize their course schedule. Jupiterp aims to do this with several
        small user-interface and quality changes that improve the student
        experience relative to existing alternatives. Additionally, Jupiterp is
        completely open-source, allowing students to improve a tool they use.
    </p>
    <p class={pClasses}>
        Jupiterp is currently in beta phase - there may be issues. We are
        working to set up a system to report bugs; in the meantime, if you find
        something wrong on our site, please report it as an issue
        <a href='https://github.com/atcupps/Jupiterp/issues' target='_blank'
            class='text-orange underline'>here</a>.
    </p>
    <h2 class={h2Classes}>
        Open-Source
    </h2>
    <p class={pClasses}>
        Jupiterp is open-source and accepting contributions. Please visit our
        <a href='https://github.com/atcupps/Jupiterp' target='_blank'
            class='text-orange underline'>GitHub</a>
        to make contributions.
    </p>
    <h2 class={h2Classes}>
        Credits
    </h2>
    <p class={pClasses}>
        All course information is taken directly from the Testudo Schedule of
        Classes. Instructor information and reviews are gathered from
        the PlanetTerp API.
    </p>
    <h2 class={h2Classes}>
        Core Team
    </h2>
    <p class={pClasses}>
        Jupiterp is managed by our Core Team:
    </p>
    <ul class={pClasses + ' list-disc ml-8'}>
        <li>
            <a href='https://atcupps.github.io' 
                            target='_blank' class='text-orange underline'>
                AT Cupps 
            </a>
            <i class='text-sm'> - Lead Developer, Project Maintainer</i>
        </li>
        <li>
            <a href='https://planetterp.com/professor/liu_alan'
                            target='_blank' class='text-orange underline'>
                Alan Liu
            </a>
            <i class='text-sm'> - Developer</i>
        </li>
    </ul>
    <h2 class={h2Classes}>
        Contact
    </h2>
    <p class={pClasses}>
        To contact the Jupiterp team, email 
        <code class='text-sm bg-bgSecondaryLight dark:bg-bgSecondaryDark rounded-md'>
            (@ (dot at cupps) (dot gmail com))</code>.
    </p>
</div>