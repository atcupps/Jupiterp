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

use clap::Parser;
use jupiterp_datagen::{depts_courses_datagen, instructors_datagen};
use std::error::Error;

mod errors;
use errors::TermError;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Term to generate data for (ex. 202408)
    #[arg(short, long)]
    term: String,

    /// Format JSON output as pretty
    #[arg(short, long)]
    pretty: bool,
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();
    let term = &args.term;
    validate_term(term)?;
    let pretty = args.pretty;

    depts_courses_datagen(term, pretty)?;
    instructors_datagen(pretty)?;

    Ok(())
}

fn validate_term(term: &str) -> Result<(), TermError> {
    // Validate the term
    if term.len() == 6 && term.chars().all(char::is_numeric) {
        let year = &term[0..4];
        let month = &term[4..6];

        // Ensure year is ok
        if let Ok(year_num) = year.parse::<u16>() {
            if !((2000..=2100).contains(&year_num)) {
                return Err(TermError::YearOutOfBounds(year_num));
            }
        } else {
            return Err(TermError::InvalidTermFormat(term.to_owned()));
        }

        // Ensure month is ok
        if let Ok(month_num) = month.parse::<u8>() {
            if !(month_num == 1 || month_num == 5 || month_num == 8 || month_num == 12) {
                return Err(TermError::InvalidMonth(month_num));
            }
        } else {
            return Err(TermError::InvalidTermFormat(term.to_owned()));
        }
    } else {
        return Err(TermError::InvalidTermFormat(term.to_owned()));
    }

    Ok(())
}
