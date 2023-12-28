# Jupiterp

Jupiterp is still a work-in-progress, but when finished, Jupiterp will be a schedule planning tool for students at the University of Maryland. Jupiterp will empower students to visualize what their course load will look like day-to-day by combining an intuitive, interactive user interface, updated course and section information directly from Testudo, and reviews from [PlanetTerp](https://planetterp.com).

Jupiterp is split into two components: `datagen` and `site`. The `datagen` component includes web-scraping and API tools which are responsible for obtaining course information and reviews, and is built using Rust. The `site` component contains the front and backend of the actual site students will be able to visit and use, and is built using SvelteKit with TypeScript.

Jupiterp is not officially affiliated with the University of Maryland. It is managed and maintained by @atcupps. Contact `(@ (dot at cupps) (dot gmail com))` for any inquiries.

For more information on Jupiterp and on contributing to this project, please see `CONTRIBUTING.md`.