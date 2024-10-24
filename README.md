# Jupiterp

Jupiterp is a website built to help students at the University of Maryland plan their schedules and make informed decisions about their course and section selections. Jupiterp provides a course planner that allows students to search for courses, see sections complete with professor reviews from [PlanetTerp](https://planetterp.com), and visualize their course schedule.

Jupiterp is split into two components: `datagen` and `site`. The `datagen` component includes web-scraping and API tools which are responsible for obtaining course information and reviews, and is built using Rust. The `site` component contains the front and backend of the actual site students will be able to visit and use, and is built using SvelteKit with TypeScript.

Jupiterp is not officially affiliated with the University of Maryland; it is primarily managed and maintained by @atcupps. Contact admin@jupiterp.com for any inquiries.

For more information on Jupiterp and on contributing to this project please see `CONTRIBUTING.md`. Otherwise, see the instructions below to learn how to work on this project.

## Getting Started

### Prerequisite Installations

Before working on Jupiterp, make sure your computer has the following installed and functional dependencies:
- [Rust](https://doc.rust-lang.org/book/ch01-01-installation.html)
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- [Node.js](https://nodejs.org/en/download)

#### Datagen

To run `datagen`, navigate to the `datagen` folder. Using `cargo`, you can run two different binaries:
- Use `cargo run --bin jupiterp_datagen -- <ARGS>` to run the `datagen` component. This generates data for all classes given a `term` (`202401` for Spring 2024, `202408` for Fall 2024, `202501` for Spring 2025 etc.)
- Use `cargo run --bin test -- <ARGS>` to run only parts of `datagen`; this is meant to help in the development process so developers do not have to run `datagen` for all departments and courses if they only want to test for a specific department or course.

For either of these, you can use `cargo run --bin <BIN> -- -h` to see possible arguments for each binary.

#### Site

To test the site, navigate to the `site` folder. Use `npm run dev` to run the site locally, then use a browser to navigate to http://localhost:5173/.

## Contributing

See `CONTRIBUTING.md` to view instructions on the collaborative development process for Jupiterp.