<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
 -->
<script lang="ts">
  import { resolve } from '$app/paths';
  let resolvedChangelogLink = $derived(resolve('/changelog'));
</script>

<svelte:head>
  <title>About | Jupiterp</title>
</svelte:head>

<main class="prose">
  <article>
    <h1>About Jupiterp</h1>
    <p>
      Jupiterp is a website built to help students at the <a href="https://umd.edu">University of Maryland</a> plan
      their schedules and make informed decisions about their course and section selections. Jupiterp provides a course
      planner that allows students to search for courses, see sections complete with instructor reviews from
      <a href="https://planetterp.com" target="_blank" rel="external noopener noreferrer">PlanetTerp</a>, and visualize
      their course schedule. Unlike other course planners, Jupiterp is built specifically by and for students at UMD,
      because we know that students here know best what they need; that's why Jupiterp is also completely open-source,
      so that students can contribute to the project and make it better for both themselves and everyone else.
    </p>
    <p>
      Jupiterp is currently in beta phase - there may be issues. We are working to set up a system to report bugs; in
      the meantime, if you find something wrong on our site, please report it as <a
        href="https://github.com/atcupps/Jupiterp/issues"
        target="_blank"
        aria-label="Report an issue on GitHub"
        rel="external noopener noreferrer">an issue</a
      >.
    </p>
    <a href={resolvedChangelogLink} aria-label="View changelog" rel="canonical">View changelog</a>
    <h2>Professor Ratings</h2>
    <p>
      Stars next to a professor's name indicate their average rating as shown on PlanetTerp. These ratings are based on
      anonymous student reviews and can vary in accuracy and reliability. Reviews are subjective and may not be
      representative of the professor's ability to teach or the average student experience in their class. We encourage
      students to visit PlanetTerp and read reviews to get a better understanding of a professor's teaching style and
      the student experience in their classes.
    </p>
    <h2>Open-Source</h2>
    <p>
      Jupiterp is open-source and accepting contributions. Please visit our <a
        href="https://github.com/atcupps/Jupiterp"
        target="_blank"
        aria-label="Visit our GitHub">GitHub</a
      > to make contributions.
    </p>
    <h2>Credits</h2>
    <p>
      All course information is taken directly from the <a href="https://umd.edu">Testudo Schedule of Classes</a>.
      Instructor information and reviews are gathered from the PlanetTerp API.
    </p>
    <h3>Core Team</h3>
    <p>
      Jupiterp is open-source, so anyone can contribute! It is primarily maintained by <a
        href="https://atcupps.github.io/"
        target="_blank"
        aria-label="Visit Andrew Cupps's website"
        rel="external noopener noreferrer">Andrew Cupps</a
      >. Jupiterp is run at personal cost, and doesn't make any money from ads, selling data, etc., so if you want to
      support continued work on Jupiterp, please consider
      <a href="https://buymeacoffee.com/jupiterp" target="_blank" rel="external noopener noreferrer">donating</a> a small
      amount!
    </p>
    <h2>Contact</h2>
    <p>
      To contact the Jupiterp team, email <code>admin@jupiterp.com</code>.
    </p>
  </article>
</main>
