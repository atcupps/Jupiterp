//! Types for the Jupiterp Datagen component. Types used should derive or
//! otherwise implement the serde `Serialize` and `Deserialize` traits to be
//! used in JSON-form data generation.

use regex::Regex;
use serde::Deserialize;
use serde::Serialize;

/// A Department, meaning one of the four letter course prefixes used by the
/// Testudo schedule of classes and all associated `Course`s.
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Department {
    pub(crate) name: String,
    pub(crate) courses: Vec<Course>,
}

/// A `Course` and associated data:
/// - `code`: The four letter, three number code of a course; ex. "CMSC351"
/// - `name`: The title of a course; ex. "Algorithms"
/// - `credits`: The number of credits a course is worth; this could be a
///     single number like 3 credits, or a range like 3-9 (ex. FGSM398)
/// - `gen_eds`: All GenEds a course may fulfill or `None`
/// - `description`: The course description listed on Testudo; provided an
///     actual description, this will deliberately not include information
///     like prerequisites and requirements.
/// - `sections`: All `Section`s offered in a course, or `None`; some courses
///     have no sections (ex. AASP399)
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Course {
    pub(crate) code: String,
    pub(crate) name: String,
    pub(crate) credits: CreditCount,
    pub(crate) gen_eds: Option<Vec<String>>,
    pub(crate) description: String,
    pub(crate) sections: Option<Vec<Section>>,
}

/// How many credits a course is worth; can be a single number or a range
#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum CreditCount {
    Amount(u8),
    Range(u8, u8),
}

/// A specific section of a `Course`
/// - `sec_code`: The section code (ex. 0101, 0203, 0502, etc.)
/// - `instructors`: The instructors for a section (ex. Larry Herman)
/// - `class_meetings`: All occurrences of class meetings for a section;
///     this includes lectures, discussions, etc.
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Section {
    pub(crate) sec_code: String,
    pub(crate) instructors: Vec<String>,
    pub(crate) class_meetings: Vec<ClassMeeting>,
}

/// An instance of a class meeting for a given course and section. An example
/// could be a lecture or a discussion. One course could have one or multiple
/// `ClassMeeting`s. For instance, a class may meet on Mondays online at a
/// TBA time, which would be represented by
///     `ClassMeeting::OnlineSync(None)`,
/// and in person at some `classtime` and `location`, which would be
/// represented by a separate:
///     `ClassMeeting::InPerson(InPersonClass {
///         classtime,
///         location,
///     })`
#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum ClassMeeting {
    Unspecified,
    OnlineAsync,
    OnlineSync(Option<Classtime>),
    InPerson(InPersonClass),
}

/// Represents part or all of a class meeting in person at a given
/// `classtime` and `location`.
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct InPersonClass {
    pub(crate) classtime: Option<Classtime>,
    pub(crate) location: Option<ClassLocation>,
}

/// The day(s) of the week a class meets, containing, as a tuple, the start
/// and end times of a class meeting on those days.
#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum Classtime {
    M(Time, Time),
    Tu(Time, Time),
    W(Time, Time),
    Th(Time, Time),
    F(Time, Time),
    MWF(Time, Time),
    MW(Time, Time),
    WF(Time, Time),
    TuTh(Time, Time),
    MTuWThF(Time, Time),
    MF(Time, Time),
    Sa(Time, Time),
    Su(Time, Time),
    SaSu(Time, Time),
    MTu(Time, Time),
    MTuThF(Time, Time),
    MTuWTh(Time, Time),
}

impl Classtime {
    /// Create a new `Classtime` from `days` (a `String` of the days a class
    /// meets, such as "MWF"), and the `start` and `end` times.
    pub(crate) fn new(days: String, start: Time, end: Time) -> Self {
        match days.as_str() {
            "M" => Self::M(start, end),
            "Tu" => Self::Tu(start, end),
            "W" => Self::W(start, end),
            "Th" => Self::Th(start, end),
            "F" => Self::F(start, end),
            "MWF" => Self::MWF(start, end),
            "MW" => Self::MW(start, end),
            "WF" => Self::WF(start, end),
            "TuTh" => Self::TuTh(start, end),
            "MTuWThF" => Self::MTuWThF(start, end),
            "MF" => Self::MF(start, end),
            "Sa" => Self::Sa(start, end),
            "Su" => Self::Su(start, end),
            "SaSu" => Self::SaSu(start, end),
            "MTu" => Self::MTu(start, end),
            "MTuThF" => Self::MTuThF(start, end),
            "MTuWTh" => Self::MTuWTh(start, end),
            &_ => panic!("Unknown class meeting day pattern: {}", days.as_str()),
        }
    }
}

/// Denotes a time as being `Am` or `Pm`
#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum AmPm {
    Am,
    Pm,
}

/// An hour, minute, and marker for Am or Pm in 12 hour time.
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Time(u8, u8, AmPm);

impl Time {
    /// Given a `string` of time with hours, minutes, and am or pm,
    /// (ex. "12:30pm", "8:00am", etc.), parse and create a new `Time`.
    pub(crate) fn from_string(string: &str) -> Self {
        let re = Regex::new(r"([0-9]+):([0-9]+)(am|pm)").unwrap();
        let matches = re.captures(string).unwrap();
        let hour: u8 = matches.get(1).unwrap().as_str().parse().unwrap();
        let minutes: u8 = matches.get(2).unwrap().as_str().parse().unwrap();
        let ampm = match matches.get(3).unwrap().as_str() {
            "am" => AmPm::Am,
            "pm" => AmPm::Pm,
            _ => panic!("Unknown match to (am|pm). This should never run!"),
        };
        Time(hour, minutes, ampm)
    }
}

/// The location of an in-person class meeting, represented by the building
/// code and room number. For example, ESJ 1215 would be
/// `ClassLocation(String::from("ESJ"), String::from("1215"))`.
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct ClassLocation(pub(crate) String, pub(crate) String);

/// The response of a request to PlanetTerp to get an instructor, parsed into
/// a Rust struct. Such a request will return a JSON-format array of
/// instructors in the following format:
/// ```
/// [
///     {
///         "name": "Jon Snow",
///         "slug": "snow",
///         "type": "professor",
///         "courses": [ * some courses * ],
///         "average_rating": 4.125
///     }
/// ]
/// ```
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct PlanetTerpProfessor {
    name: String,
    slug: String,
    #[serde(rename = "type")]
    role: String,
    courses: Vec<String>,
    average_rating: Option<f32>,
}

impl PlanetTerpProfessor {
    /// Reduce the data of a PlanetTerpProfessor to create a minimal version.
    pub(crate) fn minimize(self) -> Professor {
        Professor {
            name: self.name,
            slug: self.slug,
            average_rating: self.average_rating,
        }
    }
}

/// Jupiterp doesn't need all the instructor data returned by PlanetTerp; this
/// struct contains only the minimal data needed and used by Jupiterp.
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Professor {
    name: String,
    slug: String,
    average_rating: Option<f32>,
}
