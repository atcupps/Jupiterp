// This file is part of Jupiterp. For terms of use, please see the file
// called LICENSE at the top level of the Jupiterp source tree (online at
// https://github.com/atcupps/Jupiterp/LICENSE).
// Copyright (C) 2024 Andrew Cupps

//! This file contains the main function for the Jupiterp Datagen component.
//! Datagen involves scraping Testudo for course information, including
//! course codes, course names (titles), sections, section instructors,
//! class meeting times and locations, credits, and GenEd associations.
//! Datagen also uses the PlanetTerp API to gather information on instructors.
//! These functions are all accessed from `lib.rs`.
//!
//! Scraping is used for most course information rather than an API; this
//! allows for more control of the format of data processing and generation,
//! as well as to ensure course data is as up-to-date as possible. An
//! existing API, for example, was found to be out of date in some aspects;
//! while review data like that gathered from PlanetTerp does not need to be
//! the most up-to-date information (though it is preferable), planning
//! course schedules requires more assurance that course data be updated
//! regularly, something which does not seem to be guaranteed by existing APIs.

use jupiterp_datagen::{depts_courses_datagen, instructors_datagen};
use std::{env, error::Error};
use colored::*;

fn main() -> Result<(), Box<dyn Error>> {
    let term: String = get_term();

    depts_courses_datagen(&term)?;
    instructors_datagen()?;

    Ok(())
}

fn get_term() -> String {
    let args: Vec<String> = env::args().collect();
    
    // Check if an argument was provided
    if args.len() < 2 {
        eprintln!("{}: Usage: cargo run --bin jupiterp_datagen <term>", "ERROR".red().bold());
        std::process::exit(1);
    }

    let term = args[1].clone();

    // Validate the term
    if term.len() == 6 && term.chars().all(char::is_numeric) {
        let year = &term[0..4];
        let month = &term[4..6];

        // Ensure year is ok
        if let Ok(year_num) = year.parse::<u16>() {
            if !(year_num >= 2000 && year_num <= 2100) {
                eprintln!("{}: Invalid year: {} in term: {}", "ERROR".red().bold(), year_num, term);
                eprintln!("Jupiterp datagen only supports terms from 2000 to 2100.");
                std::process::exit(1);
            }
        } else {
            eprintln!("{}: Invalid term format: {}", "ERROR".red().bold(), term);
            std::process::exit(1);
        }

        // Ensure month is ok
        if let Ok(month_num) = month.parse::<u8>() {
            if !(month_num == 1 || month_num == 5 || month_num == 8 || month_num == 12) {
                eprintln!("{}: Invalid month: {} in term: {}", "ERROR".red().bold(), month_num, term);
                eprintln!("Testudo only supports terms for spring (01), summer (05), fall (08), and winter (12) courses.");
                std::process::exit(1);
            }
        } else {
            eprintln!("{}: Invalid term format: {}", "ERROR".red().bold(), term);
            std::process::exit(1);
        }
    } else {
        eprintln!("{}: Invalid term format: {}", "ERROR".red().bold(), term);
        std::process::exit(1);
    }

    term
}