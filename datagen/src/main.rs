use regex::Regex;
use reqwest::{
    blocking::{Client, Response},
    header::USER_AGENT,
};
use scraper::{Html, Selector};
use std::{
    error::Error,
    fs::{self, File},
    io::Write,
};

mod types;
use types::*;

#[macro_use]
mod macros;

fn main() -> Result<(), Box<dyn Error>> {
    let depts_vec = get_depts()?;
    let mut dept_directory_file = File::create("data/departments.txt")?;
    for dept in depts_vec {
        dept_directory_file.write_all(dept.as_bytes())?;
        dept_directory_file.write_all("\n".as_bytes())?;

        println!("Now getting courses for {}", dept);

        let courses = get_courses(&dept, &String::from("202401"))?;
        let department_courses = Department {
            name: dept.clone(),
            courses,
        };

        let dir_path = format!("data/{}", dept);
        if fs::metadata(&dir_path).is_err() {
            fs::create_dir_all(&dir_path)?;
        }
        let mut dept_courses_file = File::create(format!("{}/courses.json", dir_path).as_str())?;
        let dept_course_json_string = serde_json::to_string_pretty(&department_courses)
            .unwrap_or_else(|_| panic!("Failed to serialize {:#?} to JSON", department_courses));
        dept_courses_file.write_all(dept_course_json_string.as_bytes())?;
    }

    Ok(())
}

fn get_depts() -> Result<Vec<String>, Box<dyn Error>> {
    let soc_response = get_response(String::from("https://app.testudo.umd.edu/soc"))?;

    if soc_response.status().is_success() {
        let soc_document = scraper::Html::parse_document(&soc_response.text()?);
        let selector = Selector::parse("#course-prefixes-page .two").unwrap();
        let depts = soc_document.select(&selector).map(|x| x.inner_html());
        let mut result = Vec::new();
        for dept in depts {
            result.push(format!("{}", dept));
        }
        Ok(result)
    } else {
        panic_response_fail!(soc_response)
    }
}

fn get_courses(course: &String, term: &String) -> Result<Vec<Course>, Box<dyn Error>> {
    let response = get_response(format!(
        "https://app.testudo.umd.edu/soc/{}/{}",
        term, course
    ))?;

    if response.status().is_success() {
        let document = scraper::Html::parse_document(&response.text()?);
        let selector = Selector::parse(".course-id").unwrap();
        let course_names = select_inners!(document, selector);
        let mut result = Vec::new();
        for name in course_names {
            result.push(get_course_info(&name, term)?);
        }
        Ok(result)
    } else {
        panic_response_fail!(response)
    }
}

fn get_course_info(course: &String, term: &String) -> Result<Course, Box<dyn Error>> {
    let request =
        format!(
            "https://app.testudo.umd.edu/soc/search?courseId={course}&sectionId=&termId={term}&_openSectionsOnly=on&creditCompare=&credits=&courseLevelFilter=ALL&instructor=&_facetoface=on&_blended=on&_online=on&courseStartCompare=&courseStartHour=&courseStartMin=&courseStartAM=&courseEndHour=&courseEndMin=&courseEndAM=&teachingCenter=ALL&_classDay1=on&_classDay2=on&_classDay3=on&_classDay4=on&_classDay5=on"
        );
    let response = get_response(request)?;

    if response.status().is_success() {
        let document = scraper::Html::parse_document(&response.text()?);

        let name_selector = create_selector!(format!("#{} .course-title", course));
        let name = select_inners!(document, name_selector)
            .nth(0)
            .unwrap_or_else(|| panic!("Course name matching failed for {}", course));

        let min_credits_selector = create_selector!(format!("#{} .course-min-credits", course));
        let min_credits: u8 = select_inners!(document, min_credits_selector)
            .nth(0)
            .unwrap_or_else(|| panic!("Min credits matching failed for {course}"))
            .parse()
            .unwrap();

        let max_credits_selector = create_selector!(format!("#{} .course-max-credits", course));
        let max_credits: Option<u8> = 
            select_inners!(document, max_credits_selector).nth(0).map(|val| val.parse().unwrap());

        let credits = match max_credits {
            None => CreditCount::Amount(min_credits),
            Some(val) => CreditCount::Range(min_credits, val),
        };

        let gen_eds_selector = create_selector!(format!("#{} .course-subcategory a", course));
        let gen_eds_raw = Vec::from_iter(select_inners!(document, gen_eds_selector));
        let gen_eds = if gen_eds_raw.is_empty() {
            None
        } else {
            Some(gen_eds_raw)
        };

        let try_description_selector = create_selector!(format!(
            "#{} .approved-course-texts-container :nth-child(2) .approved-course-text",
            course
        ));
        let try_description = select_inners!(document, try_description_selector).nth(0);
        let description = match try_description {
            Some(desc) => desc,
            None => {
                let second_description_selector =
                    create_selector!(format!("#{} .approved-course-text", course));
                let second_desc = select_inners!(document, second_description_selector).nth(0);
                match second_desc {
                    Some(desc) => desc,
                    None => {
                        let final_description_selector =
                            create_selector!(format!("#{} .course-text", course));
                        select_inners!(document, final_description_selector)
                            .nth(0)
                            .unwrap_or(String::new())
                    }
                }
            }
        };

        let sections_selector = create_selector!(format!("#{} .section-id", course));
        let re = Regex::new(r"[0-9]+").unwrap();
        let section_numbers = Vec::from_iter(document.select(&sections_selector).map(|x| {
            String::from(
                re.find(x.inner_html().as_str())
                    .unwrap_or_else(|| panic!("Section numbers matching failed for {course}."))
                    .as_str(),
            )
        }));
        if !section_numbers.is_empty() {
            let sections = get_sections(document, course, section_numbers);

            Ok(Course {
                code: course.clone(),
                name,
                credits,
                gen_eds,
                description,
                sections: Some(sections),
            })
        } else {
            Ok(Course {
                code: course.clone(),
                name,
                credits,
                gen_eds,
                description,
                sections: None,
            })
        }
    } else {
        panic_response_fail!(response)
    }
}

fn get_sections(document: Html, course: &String, section_numbers: Vec<String>) -> Vec<Section> {
    let mut result = Vec::new();
    for (i, section_code) in section_numbers.iter().enumerate() {
        let nth_child = i + 1;

        let instructor_selector = create_selector!(format!(
            "#{} .section:nth-child({}) .section-instructor",
            course, nth_child
        ));
        let instructors = Vec::from_iter(document.select(&instructor_selector).map(|x| {
            let inner = x.inner_html();
            if inner.contains("<a") {
                let re = Regex::new(r"<a.+>(.+)</a>").unwrap();
                String::from(re.captures(&inner).unwrap().get(1).unwrap().as_str())
            } else {
                inner
            }
        }));

        let class_meetings = get_class_meetings(&document, course, section_code, nth_child);

        let section = Section {
            sec_code: section_code.clone(),
            instructors,
            class_meetings,
        };

        result.push(section);
    }

    result
}

fn get_class_meetings(document: &Html, course: &String, section: &String, nth_child: usize) -> Vec<ClassMeeting> {
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
            let classtime = if meeting_days != "TBA" {
                let starting_time_selector = create_selector!(
                    format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-start-time",
                                course, nth_child, dth_child)
                );
                let starting_time = Time::from_string(
                    &select_inners!(document, starting_time_selector)
                        .nth(0)
                        .unwrap_or_else(
                            || panic!(
                                "Start-time matching failed for {} section {}",
                                course, section
                            ),
                        ),
                );
    
                let ending_time_selector = create_selector!(
                    format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-end-time",
                                course, nth_child, dth_child)
                );
                let ending_time = Time::from_string(
                    &select_inners!(document, ending_time_selector)
                        .nth(0)
                        .unwrap_or_else(
                            || panic!(
                                "End-time matching failed for {} section {}",
                                course, section
                            ),
                        ),
                );
    
                Some(Classtime::new(meeting_days, starting_time, ending_time))
            } else {
                None
            };

            let class_building_selector = create_selector!(
                format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-building",
                            course, nth_child, dth_child)
            );
            let class_building = 
                select_inners!(document, class_building_selector).nth(0)
                .unwrap_or_else(|| panic!("Class-building matching failed for {} sec. {}", course, section));

            let meeting = get_meeting(&class_building, course, section, classtime);
            result.push(meeting)
        } else {
            let online_selector = create_selector!(
                format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-room",
                        course, nth_child, dth_child)
            );
            let try_online_classroom = select_inners!(document, online_selector).nth(0);
            if let Some(online_classroom) = try_online_classroom {
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
                let message_selector = create_selector!(
                    format!("#{} .section:nth-child({}) .class-days-container .row:nth-child({}) .class-message",
                            course, nth_child, dth_child)
                );
                let _ = select_inners!(document, message_selector).nth(0)
                    .unwrap_or_else(|| 
                        panic!("Class message matching failed for class {} section {}.", course, section));
                
                result.push(ClassMeeting::Unspecified);
            }
        }
    }

    result
}

fn get_meeting(class_building: &String, course: &String, section: &String, classtime: Option<Classtime>) -> ClassMeeting {
    let has_building_code = class_building.contains("building-code");
    let has_class_room = class_building.contains("class-room");
    debug_assert!(has_building_code || has_class_room,
        "Course {} sec. {} has no building code or class room data.", course, section);

    if has_building_code {
        let location = if has_class_room {
            let building_re = Regex::new(r#".+"building-code">(.+)<.+"#).unwrap();
            let room_re = Regex::new(r#".+"class-room">(.+)</s.+"#).unwrap();
            let building = String::from(building_re.captures(&class_building)
                .unwrap_or_else(||
                    panic!("Building didn't match for class-building: {}", class_building))
                .get(1).unwrap().as_str());
            let room = String::from(room_re.captures(&class_building)
                .unwrap_or_else(||
                    panic!("Room didn't match for class-building: {}", class_building))
                .get(1).unwrap().as_str());
            Some(ClassLocation(building, room))  
        } else {
            debug_assert!(class_building.contains("TBA"), "Class building {} unexpected.", class_building);
            None
        };
        ClassMeeting::InPerson(InPersonClass {
            classtime,
            location
        })
    } else {
        debug_assert!(class_building.contains("ONLINE"), "Class building {} unexpected.", class_building);
        ClassMeeting::OnlineSync(classtime)
    }
}

fn get_response(request: String) -> Result<Response, reqwest::Error> {
    let request = Client::new()
                .get(request)
                .header(USER_AGENT, "Jupiterp Test");
    let second_request = request.try_clone().unwrap();

    let response = request.send();
    if response.is_err() {
        return second_request.send();
    }
    response
}
