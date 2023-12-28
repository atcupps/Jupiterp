# Contributing to Jupiterp

## Introduction
Jupiterp is a WIP open-source schedule planning and building tool for students at the University of Maryland. Jupiterp expands on the capabilities of existing tools like Venus and the Testudo schedule visualizer by integrating reviews and a more intuitive interface to provide a user experience aimed at improving students' lives and the course selection process.

## Code of Conduct

Any contributor to Jupiterp must abide by our code of conduct. To foster an inclusive and productive environment, all contributors must maintain respect toward others' age, ethnicity, race, gender identity and expression, sexual identity and expression, level of experience or skill, religion, or any other aspect of identity or belief. Jupiterp should be a friendly, collaborative community focused on improving the experience of UMD students; as such, contributors are expected to be cordial and professional with others.

Examples of behavior that contributes to creating a positive environment include:

-   Using welcoming and inclusive language
-   Being respectful of differing viewpoints and experiences
-   Gracefully accepting constructive criticism
-   Focusing on what is best for the community
-   Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

-   The use of sexualized language or imagery and unwelcome sexual attention or advances
-   Trolling, insulting/derogatory comments, and personal or political attacks
-   Public or private harassment
-   Publishing others' private information, such as a physical or electronic address, without explicit permission
-   Other conduct which could reasonably be considered inappropriate in a professional setting

### Leadership

This project is led and maintained by the core team, which currently consists of:
- @atcupps
- @alanliu2009

The core team is tasked with managing Jupiterp and ensuring all contributions are productive and aligned with the mission of Jupiterp. The core team has the rights and responsibilities to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned with this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviors that they deem inappropriate, threatening, offensive, or harmful.

If Jupiterp becomes a monetized operation, the core team will be responsible for determining how funds are acquired and used. Both contributors and Jupiterp users should expect that the core team be mission-driven, rather than profit-driven. But, community members should understand that, although Jupiterp is an open-source project, contributing to Jupiterp does not entitle them to any share of revenue generated.

Within the core team and the project as a whole, @atcupps has ultimate decision-making and administrative power. Any contributors should expect both @atcupps and the rest of the core team to fulfill their roles within this project dutifully, and should hold them accountable should they stray from the mission and values of Jupiterp. However, contributors should also understand that unpopular or controversial decisions do not necessarily constitute an abuse of power by the core team.

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the core team. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances. The core team is obligated to maintain confidentiality with regard to the reporter of an incident.

Project maintainers who do not follow or enforce the Code of Conduct in good faith may face temporary or permanent repercussions as determined by other members of the project's leadership.

## Getting Started

Jupiterp is separated into two components:
- The `datagen` component, which is built in Rust. This component uses web-scraping and APIs to gather professor, course, and section data and write it to easily-parsable JSON files used by the `site` component.
- The `site` component, which is built using Svelte with TypeScript. This is both the front and back ends of the actual site users will be able to use and interact with.

Contributors are recommended to learn Git before working on Jupiterp.

### Local Project Setup

In order to work on Jupiterp, you will need to install the following dependencies locally:
- Rust (with Cargo)
- Bun

Next, you will need to fork this repository and clone it locally; you can find instructions on that [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo).

### Finding Issues to Work On

You can navigate to the "Issues" tab above to find issues that need to be resolved. Feel free to work on any issues, although it is best not to work on issues already assigned to another contributor. Beginner-friendly issues are marked with the "good first issue" tag.

### Filing an Issue

If you discover a bug or other issue with Jupiterp, you can file an issue on the same "Issues" tab. You can add labels to your issue or assign other contributors, but refrain from doing so without an understanding of what the labels mean. Your labels may be removed or changed to more accurately reflect the issue.

## Contribution Process

### Making Changes

Changes should be made locally, rather than attempting to edit project code on GitHub. It is recommended that contributors keep a `main` branch which is synced with the `main` branch of Jupiterp in order to easily merge with other branches and resolve merge conflicts. Changes should be made on new branches and merged as is appropriate.

When you make changes, please abide by the style guide found in `STYLE.md`.

### Opening a Pull Request (PR)

If you are not finished with development on a task, but want to share your code or receive feedback or review, you can open up a draft pull request from your local or forked branch to a branch of Jupiterp. This can then be viewed by other contributors; when ready, the draft PR can be converted to a normal PR and merged, or closed.

If you are ready to merge changes on a local or forked branch to `main` of Jupiterp, you can open a pull request on GitHub. Provide a brief description of what your PR does and link any relevant issues rather than closing them.

### Code Review

When you open a pull request, you are required to receive approval from appropriate contributors in the code review process. You can also request a review from others, which is especially recommended if a particular contributor is especially knowledgeable of or responsible for an area of code you have altered.

If you are conducting a review, do so in a respectful and constructive way. Using [Conventional Comments](https://conventionalcomments.org/) is suggested to clarify the meaning of your comments.

### CI Jobs

When you open a pull request, your code will be subject to continuous integration (CI) test jobs. They ensure the code is linted, formatted, and passes all tests before merging. Refer to `STYLE.md` for more details.

## Communication

Currently, the Jupiterp community is small and has no official communications channels. If you are interested in contributing and want to join the community, please contact @atcupps by emailing `(@ (dot at cupps) (dot gmail com))`.