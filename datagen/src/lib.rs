// This file is part of Jupiterp. For terms of use, please see the file
// called LICENSE at the top level of the Jupiterp source tree (online at
// https://github.com/atcupps/Jupiterp/LICENSE).
// Copyright (C) 2024 Andrew Cupps

//! This file contains functions for scraping data from Testudo and retrieving
//! data from the PlanetTerp API. The functions in this file are used by the
//! main function in `main.rs` to generate data for the Jupiterp project,
//! as well as by the tests in `tests.rs` to ensure the data generation
//! functions are working as expected.

#![allow(clippy::doc_overindented_list_items)]

use regex::Regex;
use reqwest::{
    blocking::{Client, Response},
    header::USER_AGENT,
};
use scraper::{Html, Selector};
use std::thread;
use std::time::Duration;
use std::{error::Error, fs::File, io::Write};

mod types;
use types::*;

#[macro_use]
mod macros;

/// Gets all departments/course prefixes and iterates over them to scrape
/// course information and write to appropriate files.
/// Takes in `term: &String` as a parameter to specify which term to get
/// courses for.
pub fn depts_courses_datagen(term: &String, pretty: bool) -> Result<(), Box<dyn Error>> {
    let depts_vec = get_depts()?;
    let mut full_depts_data = Vec::new();
    let mut dept_directory_file = File::create("data/departments_list.txt")?;
    for dept in depts_vec {
        dept_directory_file.write_all(dept.as_bytes())?;
        dept_directory_file.write_all("\n".as_bytes())?;

        println!("Now getting courses for {}", dept);

        // TODO(1): Create a more generalized approach to terms, allowing for
        // terms (eg 202401) to be loaded dynamically based on the current
        // year and month.
        let courses = get_courses(&dept, term)?;
        let department_courses = Department {
            name: dept.clone(),
            courses,
        };
        full_depts_data.push(department_courses);
    }

    // Use serde_json to write data to appropriate dept. files
    let mut dept_courses_file = File::create("data/departments.json")?;
    let dept_course_json_string = (if pretty {
        serde_json::to_string_pretty(&full_depts_data)
    } else {
        serde_json::to_string(&full_depts_data)
    })
    .unwrap_or_else(|_| panic!("Failed to serialize {:#?} to JSON", full_depts_data));
    dept_courses_file.write_all(dept_course_json_string.as_bytes())?;

    // Write all course codes to relevant file
    println!("Writing course codes to file");
    let mut course_codes_file = File::create("data/courses_list.txt")?;
    for dept in full_depts_data {
        for course in dept.courses {
            course_codes_file.write_all(course.code.as_bytes())?;
            course_codes_file.write_all("\n".as_bytes())?;
        }
    }

    Ok(())
}

/// Scrape the main Testudo schedule of classes page and identify each
/// course prefix (CMSC, MATH, LING, etc.). This will return an Error in case
/// of a failed HTTP request.
pub fn get_depts() -> Result<Vec<String>, Box<dyn Error>> {
    let soc_response = get_response(String::from("https://app.testudo.umd.edu/soc"))?;

    if soc_response.status().is_success() {
        let soc_document = scraper::Html::parse_document(&soc_response.text()?);
        let selector = Selector::parse("#course-prefixes-page .two").unwrap();
        let depts = soc_document.select(&selector).map(|x| x.inner_html());
        let mut result = Vec::new();
        for dept in depts {
            result.push(dept);
        }
        Ok(result)
    } else {
        panic_response_fail!(soc_response)
    }
}

/// Scrapes the Testudo schedule of classes to get a `Vec` containing all
/// courses corresponding to the course prefix `dept` in the given `term`.
/// Will return an `Error` in case of failed HTTP requests.
pub fn get_courses(dept: &String, term: &String) -> Result<Vec<Course>, Box<dyn Error>> {
    // Get courses page
    let course_response =
        get_response(format!("https://app.testudo.umd.edu/soc/{}/{}", term, dept))?;

    if course_response.status().is_success() {
        let course_document = scraper::Html::parse_document(&course_response.text()?);

        // Get all course IDs for a department
        let selector = Selector::parse(".course-id").unwrap();
        let course_codes = select_inners!(course_document, selector);

        // Get sections page
        let mut sections_url = format!(
            "https://app.testudo.umd.edu/soc/{}/sections?courseIds=",
            term
        );
        for code in course_codes {
            sections_url.push_str(&code);
            sections_url.push(',');
        }
        sections_url.pop();

        let sections_response = get_response(sections_url)?;

        if sections_response.status().is_success() {
            let sections_document = scraper::Html::parse_document(&sections_response.text()?);

            // Remaking course IDs iterator since `course_codes` was already used
            let course_codes = select_inners!(course_document, selector);

            // Get all course and section info for each course
            let mut result: Vec<Course> = Vec::new();
            for code in course_codes {
                result.push(course_info(code, &course_document, &sections_document)?);
            }
            Ok(result)
        } else {
            panic_response_fail!(sections_response)
        }
    } else {
        panic_response_fail!(course_response)
    }
}

/// Get the info for a specified course, given the course page as an HTML
/// document as well as the sections page as an HTML document.
pub fn course_info(
    course_code: String,
    course_doc: &Html,
    sections_doc: &Html,
) -> Result<Course, Box<dyn Error>> {
    // This short block gets the name/title of the course, which is
    // different than the course code. As an example, "CMSC351" is a code,
    // while "Algorithms" is a course name/title.
    let name_selector = create_selector!(format!("#{} .course-title", course_code));
    let name = select_inners!(course_doc, name_selector)
        .nth(0)
        .unwrap_or_else(|| panic!("Course name matching failed for {}", course_code));

    // Getting the min number of credits for a course. This is used in courses
    // where there is a range of possible credits, as well as the default for
    // courses with a set number of credits.
    let min_credits_selector = create_selector!(format!("#{} .course-min-credits", course_code));
    let min_credits: u8 = select_inners!(course_doc, min_credits_selector)
        .nth(0)
        .unwrap_or_else(|| panic!("Min credits matching failed for {course_code}"))
        .parse()
        .unwrap();

    // Getting the max number of credits for a course. This is only present if
    // the number of credits for the course is a range.
    let max_credits_selector = create_selector!(format!("#{} .course-max-credits", course_code));
    let max_credits: Option<u8> = select_inners!(course_doc, max_credits_selector)
        .nth(0)
        .map(|val| val.parse().unwrap());

    // If there are a maximum number of credits, the number of credits for
    // this course is a range. This formats credits into a `CreditCount` struct.
    let credits = match max_credits {
        None => CreditCount::Amount(min_credits),
        Some(val) => CreditCount::Range(min_credits, val),
    };

    // Get any GenEds that this course fulfills.
    // TODO(3): Consider data generation for GenEds
    let gen_eds_selector = create_selector!(format!("#{} .course-subcategory a", course_code));
    let gen_eds_raw = Vec::from_iter(select_inners!(course_doc, gen_eds_selector));
    let gen_eds = if gen_eds_raw.is_empty() {
        None
    } else {
        Some(gen_eds_raw)
    };

    // Get course conditions.
    let conditions_selector = create_selector!(format!(
        "#{} .approved-course-texts-container :nth-child(1) .approved-course-text > div > div > div",
        course_code
    ));
    let conditions_raw = Vec::from_iter(
        select_inners!(course_doc, conditions_selector)
    );
    let stripped_conditions: Vec<String> = conditions_raw
        .iter()
        .map(|html| strip_html_tags(html))
        .collect();

    let conditions = if stripped_conditions.is_empty() {
        None
    } else {
        Some(stripped_conditions)
    };

    // Get the description of the course.
    let try_description_selector = create_selector!(format!(
        "#{} .approved-course-texts-container :nth-child(2) .approved-course-text",
        course_code
    ));
    let try_description = select_inners!(course_doc, try_description_selector).nth(0);
    let description_raw = match try_description {
        Some(desc) => desc,
        None => {
            let second_description_selector =
                create_selector!(format!("#{} .approved-course-text", course_code));
            let second_desc = select_inners!(course_doc, second_description_selector).nth(0);
            match second_desc {
                Some(desc) => desc,
                None => {
                    let final_description_selector =
                        create_selector!(format!("#{} .course-text", course_code));
                    select_inners!(course_doc, final_description_selector)
                        .nth(0)
                        .unwrap_or(String::new())
                }
            }
        }
    };
    let description = strip_html_tags(&description_raw);

    let sections = sections_info(&course_code, sections_doc)?;

    // Return a `Course` struct with all info
    Ok(Course {
        code: course_code,
        name,
        credits,
        gen_eds,
        conditions,
        description,
        sections,
    })
}

/// Get info for all `Section`s in a course, given the HTML document for the
/// sections page.
pub fn sections_info(
    course_code: &String,
    sections_doc: &Html,
) -> Result<Option<Vec<Section>>, Box<dyn Error>> {
    // Identify sections for the given course
    let sections_selector = create_selector!(format!("#{} .section-id", course_code));
    let re = Regex::new(r"[A-Z]*[0-9]+").unwrap();
    let section_numbers = Vec::from_iter(sections_doc.select(&sections_selector).map(|x| {
        String::from(
            re.find(x.inner_html().as_str())
                .unwrap_or_else(|| panic!("Section numbers matching failed for {course_code}."))
                .as_str(),
        )
    }));
    if section_numbers.is_empty() {
        // Some courses have no sections
        return Ok(None);
    }

    let mut result = Vec::new();

    // Iterate through `section_numbers` and append corresponding `Section`
    // data to `result`.
    let re = Regex::new(r"<a.+>(.+)</a>").unwrap();
    for (i, section_code) in section_numbers.iter().enumerate() {
        let nth_child = i + 1;

        let instructor_selector = create_selector!(format!(
            "#{} .section:nth-child({}) .section-instructor",
            course_code, nth_child
        ));
        let instructors = Vec::from_iter(sections_doc.select(&instructor_selector).map(|x| {
            let inner = x.inner_html();
            // Some instructors have their names associated with an anchor
            if inner.contains("<a") {
                String::from(re.captures(&inner).unwrap().get(1).unwrap().as_str())
            } else {
                inner
            }
        }));

        let class_meetings = get_class_meetings(sections_doc, course_code, section_code, nth_child);

        let section = Section {
            sec_code: section_code.clone(),
            instructors,
            class_meetings,
        };

        result.push(section);
    }

    Ok(Some(result))
}

/// Searches through a `document` to get a `Vec` of `ClassMeeting`s for a
/// given `course` and `section`. One section often has multiple meeting times
/// and locations, hence needing a `Vec`. Accepts an `nth_child` parameter
/// for scraping purposes to identify which row of data to read from Testudo
/// section information.
pub fn get_class_meetings(
    document: &Html,
    course: &String,
    section: &String,
    nth_child: usize,
) -> Vec<ClassMeeting> {
    let mut result = Vec::new();
    let row_selector = create_selector!(format!(
        "#{} .section:nth-child({}) .class-days-container .row",
        course, nth_child
    ));
    let rows = Vec::from_iter(select_inners!(document, row_selector));
    for j in 0..rows.len() {
        let dth_child = j + 1;

        let meeting_days_selector = create_selector!(format!(
            "#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .section-days",
            course, nth_child, dth_child
        ));
        let try_meeting_days = select_inners!(document, meeting_days_selector).nth(0);
        if let Some(meeting_days) = try_meeting_days {
            // If a class meeting occurs on some set days of the week it is
            // likely a synchronous class, whether face-to-face, blended,
            // or online.
            let classtime = if meeting_days != "TBA" {
                let starting_time_selector = create_selector!(
                    format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-start-time",
                                course, nth_child, dth_child)
                );
                let starting_time = Time::from_string(
                    &select_inners!(document, starting_time_selector)
                        .nth(0)
                        .unwrap_or_else(|| {
                            panic!(
                                "Start-time matching failed for {} section {}",
                                course, section
                            )
                        }),
                );

                let ending_time_selector = create_selector!(
                    format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-end-time",
                                course, nth_child, dth_child)
                );
                let ending_time = Time::from_string(
                    &select_inners!(document, ending_time_selector)
                        .nth(0)
                        .unwrap_or_else(|| {
                            panic!(
                                "End-time matching failed for {} section {}",
                                course, section
                            )
                        }),
                );

                Some(Classtime::new(meeting_days, starting_time, ending_time))
            } else {
                // Some classes are synchronous but have TBA class times
                None
            };

            // "class-building" is a CSS class on Testudo which contains both
            // classrooms and buildings of a class meeting. Depending on
            // circumstances, a class meeting may have either or both a
            // classroom and building marked on Testudo. This needs to be
            // determined using the `get_meeting` function below.
            let class_building_selector = create_selector!(
                format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-building",
                            course, nth_child, dth_child)
            );
            let class_building = select_inners!(document, class_building_selector)
                .nth(0)
                .unwrap_or_else(|| {
                    panic!(
                        "Class-building matching failed for {} sec. {}",
                        course, section
                    )
                });

            let meeting = get_meeting(&class_building, course, section, classtime);
            result.push(meeting)
        } else {
            // If a class meeting does not have set days or times, it may
            // be a class which meets online and asynchronously.
            let online_selector = create_selector!(format!(
                "#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-room",
                course, nth_child, dth_child
            ));
            let try_online_classroom = select_inners!(document, online_selector).nth(0);
            if let Some(online_classroom) = try_online_classroom {
                // Online classes are marked on Testudo as having
                // "ONLINE" as the classroom.
                debug_assert_eq!(
                    online_classroom.as_str(),
                    "ONLINE",
                    "Unrecognized classroom: {} for class {} section {}.",
                    online_classroom,
                    course,
                    section
                );

                result.push(ClassMeeting::OnlineAsync);
            } else {
                // If a class does not meet online asynchronously and does
                // not have set meeting days or times, it is marked as
                // having unspecified class meeting.
                let message_selector = create_selector!(
                    format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-message, #{} .section:nth-child({}) .class-days-container .row:nth-child({}) .no-scheduled-classes-message",
                            course, nth_child, dth_child,
                            course, nth_child, dth_child)
                );
                let _ = select_inners!(document, message_selector)
                    .nth(0)
                    .unwrap_or_else(|| {
                        panic!(
                            "Class message matching failed for class {} section {}.",
                            course, section
                        )
                    });

                result.push(ClassMeeting::Unspecified);
            }
        }
    }

    result
}

/// Finds the `ClassMeeting` of a given `course` and `section` at the provided
/// `classtime` using the previously-scraped `class_building`. This function is
/// necessary because Testudo marks certain class meeting situations using
/// either or both the "building-code" and "class-room":
/// - An in-person class with a building code and a classroom is a normal
///     set synchronous face-to-face class in a room of a building; for
///     example, IRB 0306.
/// - An in-person class with a TBA location has "TBA" for the building-code
///     but no classroom.
/// - An online synchronous (as opposed to async) class has "ONLINE" for the
///     classroom and no building-code.
pub fn get_meeting(
    class_building: &String,
    course: &String,
    section: &String,
    classtime: Option<Classtime>,
) -> ClassMeeting {
    let has_building_code = class_building.contains("building-code");
    let has_class_room = class_building.contains("class-room");
    debug_assert!(
        has_building_code || has_class_room,
        "Course {} sec. {} has no building code or class room data.",
        course,
        section
    );

    if has_building_code {
        let location = if has_class_room {
            let building_re = Regex::new(r#".+"building-code">(.+)<.+"#).unwrap();
            let room_re = Regex::new(r#".+"class-room">(.+)</s.+"#).unwrap();
            let building = String::from(
                building_re
                    .captures(class_building)
                    .unwrap_or_else(|| {
                        panic!(
                            "Building didn't match for class-building: {}",
                            class_building
                        )
                    })
                    .get(1)
                    .unwrap()
                    .as_str(),
            );
            let room_capture = room_re.captures(class_building);
            let room = String::from(if let Some(room_match) = room_capture {
                room_match.get(1).unwrap().as_str()
            } else {
                "????"
            });
            Some(ClassLocation(building, room))
        } else {
            debug_assert!(
                class_building.contains("TBA"),
                "Class building {} unexpected.",
                class_building
            );
            None
        };
        ClassMeeting::InPerson(InPersonClass {
            classtime,
            location,
        })
    } else {
        debug_assert!(
            class_building.contains("ONLINE"),
            "Class building {} unexpected.",
            class_building
        );
        ClassMeeting::OnlineSync(classtime)
    }
}

/// Strip HTML tags from string
fn strip_html_tags(html_snippet: &str) -> String {
    let fragment = Html::parse_fragment(html_snippet);
    fragment.root_element().text().collect::<String>()
}

/// Use the PlanetTerp API to get a list of all instructors (professors or TAs)
/// and write relevant information to a JSON file in the `data` directory.
pub fn instructors_datagen(pretty: bool) -> Result<(), Box<dyn Error>> {
    let num_profs = 100;
    let mut offset = 0;
    let mut professors = Vec::new();
    let mut page_not_full = false;

    // Requests instructors from PlanetTerp until a response does not contain a
    // maximum number of instructors.
    while !page_not_full {
        println!("Getting instructors from offset: {}", offset);

        let request = format!(
            "https://planetterp.com/api/v1/professors?type=professor&limit={}&offset={}",
            num_profs, offset
        );

        thread::sleep(Duration::from_millis(500));
        let response = get_response(request)?;

        if response.status().is_success() {
            // Parse json into `PlanetTerpProfessor` structs, minimize each,
            // then add the minimized `Professor` struct to `professors`.
            let profs_json = response.text()?;
            let professors_raw: Vec<PlanetTerpProfessor> = serde_json::from_str(&profs_json)
                .expect("Failed to parse PlanetTerp professor JSON data.");
            if professors_raw.len() < num_profs {
                page_not_full = true;
            }
            for raw in professors_raw {
                professors.push(raw.minimize());
            }
            offset += num_profs;
        } else {
            panic_response_fail!(response);
        }
    }

    // Use serde_json to write data to instructors.json
    let mut instructors_file = File::create("data/instructors.json")?;
    let instructors_json_string = (if pretty {
        serde_json::to_string_pretty(&professors)
    } else {
        serde_json::to_string(&professors)
    })
    .unwrap_or_else(|_| panic!("Failed to serialize {:#?} to JSON", professors));
    instructors_file.write_all(instructors_json_string.as_bytes())?;

    Ok(())
}

/// Get the response of an HTTP `request`. This function exists to reduce
/// boilerplate. Will return an `Error` due to failed requests.
///
/// TODO(4): Improve handling of timeouts
pub fn get_response(request: String) -> Result<Response, reqwest::Error> {
    let request = Client::new()
        .get(request)
        .header(USER_AGENT, "Jupiterp/0.1.0");
    let second_request = request.try_clone().unwrap();
    let third_request = request.try_clone().unwrap();

    let response = request.send();
    if response.is_err() {
        let second_response = second_request.send();
        if second_response.is_err() {
            return third_request.send();
        } else {
            return second_response;
        }
    }
    response
}
