<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang='ts'>
    import ChangelogItem from "../../components/changelog/ChangelogItem.svelte";
</script>

<div class='fixed flex flex-col w-full px-8 py-2
            text-textLight dark:text-textDark lg:px-8
            top-[3rem] lg:top-[3.5rem] xl:top-[4rem] bottom-0'>

    <ChangelogItem title='Saturp' version='v1.1.1: Titan'
                                                        date='Apr 7, 2025'>
        Add additional information for courses available in course search. 
        Add GenEd information for courses.
    </ChangelogItem>

    <ChangelogItem title='Saturp' version='v1.1.0: Saturn'
                                                        date='Nov 4, 2024'>
        Allow searching just by number; enable users having and switching
        between multiple schedules.
    </ChangelogItem>

    <ChangelogItem title='Have a Seat' version='v1.0.5: Amalthea'
                                                        date='Sep 23, 2024'>
        Display number of seats left in sections in both course search and in
        the course info panel. Reduce number of requests necessary to
        retreive course information from the Testudo SOC.
    </ChangelogItem>
    
    <ChangelogItem title='Galileo Time' version='v1.0.4: Callisto'
                                                        date='July 14, 2024'>
        Show class times and meetings on course info panel. Add dropdown 
        menus to site links. Make 'X' button to remove course on Schedule UI
        adapt to screen size. Improve tooltip descriptions for accessibility.
        Add Sentry error reporting.
    </ChangelogItem>

    <ChangelogItem title='The P = NP Update' version='v1.0.3: Ganymede'
                                                        date='May 24, 2024'>
        Fix bug preventing Sunday and Saturday classes from being added to 
        schedule. Provide classtimes in schedule course info panel. Make 
        light/dark theme toggleable. Fix negative times on schedule when only 
        async or weekend classes are added. Add error pages. Optimize spacing 
        of conflicting classes on schedule. Improve underlying code site code
        quality.
    </ChangelogItem>

    <ChangelogItem title='Minor Quality Changes' version='v1.0.2: Europa' 
                                                        date='April 30, 2024'>
        Add banner to show when classes are added or removed on mobile; add 
        changelog page. Add more colors for classes on the Schedule. Link to 
        buildings on the UMD Map in course search.
    </ChangelogItem>

    <ChangelogItem title='Feedback' version='v1.0.1: Io' date='April 4, 2024'>
        Minor changes to improve Jupiterp based on feedback after launch 
        (these were pushed separately but are merged to one version for 
        organizational purposes.
    </ChangelogItem>
    
    <ChangelogItem title='Initial Release' 
                version='v1.0.0: Jupiter' date='March 12, 2024'>
        The original version of Jupiterp when officially published. 
        Complete with the ability to add courses to a schedule, save schedules 
        locally, and easily see PlanetTerp reviews for professors.
    </ChangelogItem>

</div>