// This file is part of Jupiterp. For terms of use, please see the file
// called LICENSE at the top level of the Jupiterp source tree (online at
// https://github.com/atcupps/Jupiterp/LICENSE).
// Copyright (C) 2024 Andrew Cupps

//! This file contains tests for the Jupiterp Datagen component in the form of
//! a CLI tool, allowing for debugging and testing of the datagen component
//! by manually inputting courses or departments to test data generation for.
//! This can be run with `cargo run --bin test -- <args>`.

use clap::Parser;
use jupiterp_datagen::{get_course_info, get_courses};
use std::error::Error;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Term to generate data for (ex. 202408)
    #[arg(short, long)]
    term: String,

    /// Department to test data generation for
    #[arg(short, long)]
    dept: Option<String>,

    /// Course to test data generation for
    #[arg(short, long)]
    course: Option<String>,

    /// Show output of test
    #[arg(short, long, action)]
    show_output: bool,
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();
    let term = &args.term;

    // Test data generation for a department
    if let Some(dept) = &args.dept {
        assert_eq!(
            args.course, None,
            "Cannot specify both a department and a course"
        );
        let dept_courses = get_courses(&dept, term)?;
        if args.show_output {
            println!("{:#?}", dept_courses);
        }
    }

    // Test data generation for a course
    if let Some(course) = &args.course {
        assert_eq!(
            args.dept, None,
            "Cannot specify both a department and a course"
        );
        let course_info = get_course_info(&course, term);
        if args.show_output {
            println!("{:#?}", course_info);
        }
    }

    Ok(())
}
