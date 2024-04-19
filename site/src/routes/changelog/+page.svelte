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

    <ChangelogItem title='Feedback' version='v1.0.1: Io' date='April 4, 2024'>
        Minor changes to improve Jupiterp based on feedback after launch (these were pushed separately but are merged to one version for organizational purposes. Fix major 'Classtime TBA' bug, wrap course titles in course search, and enable adding courses with no sections to your schedule.
    </ChangelogItem>
    
    <ChangelogItem title='Initial Release' version='v1.0.0: Jupiter' date='March 12, 2024'>
        The original version of Jupiterp when officially published. Complete with the ability to add courses to a schedule, save schedules locally, and easily see PlanetTerp reviews for professors.
    </ChangelogItem>

</div>