// This file is part of Jupiterp. For terms of use, please see the file
// called LICENSE at the top level of the Jupiterp source tree (online at
// https://github.com/atcupps/Jupiterp/LICENSE).
// Copyright (C) 2024 Andrew Cupps

//! This file contains tests for the Jupiterp Datagen component in the form of
//! a CLI tool, allowing for debugging and testing of the datagen component
//! by manually inputting courses or departments to test data generation for.
//! This can be run with `cargo run --bin test -- <args>`.

use clap::Parser;
use jupiterp_datagen::{course_info, get_courses, get_response};
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
        let dept_courses = get_courses(dept, term)?;
        if args.show_output {
            println!("{dept_courses:#?}");
        }
    }

    // Test data generation for a course
    if let Some(course) = &args.course {
        assert_eq!(
            args.dept, None,
            "Cannot specify both a department and a course"
        );

        let course_request =
            format!(
                "https://app.testudo.umd.edu/soc/search?courseId={course}&sectionId=&termId={term}&_openSectionsOnly=on&creditCompare=&credits=&courseLevelFilter=ALL&instructor=&_facetoface=on&_blended=on&_online=on&courseStartCompare=&courseStartHour=&courseStartMin=&courseStartAM=&courseEndHour=&courseEndMin=&courseEndAM=&teachingCenter=ALL&_classDay1=on&_classDay2=on&_classDay3=on&_classDay4=on&_classDay5=on"
            );
        let course_response = get_response(course_request)?;

        let sections_request =
            format!("https://app.testudo.umd.edu/soc/{term}/sections?courseIds={course}");
        let sections_response = get_response(sections_request)?;

        if course_response.status().is_success() {
            let course_doc = scraper::Html::parse_document(&course_response.text()?);
            if sections_response.status().is_success() {
                let sections_doc = scraper::Html::parse_document(&sections_response.text()?);

                let course_info = course_info(course.to_owned(), &course_doc, &sections_doc);
                if args.show_output {
                    println!("{course_info:#?}");
                }
            } else {
                panic!("Sections page request failed.");
            }
        } else {
            panic!("Course page request failed.")
        }
    }

    Ok(())
}
