use regex::Regex;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Department {
    pub(crate) name: String,
    pub(crate) courses: Vec<Course>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Course {
    pub(crate) code: String,
    pub(crate) name: String,
    pub(crate) credits: CreditCount,
    pub(crate) gen_eds: Option<Vec<String>>,
    pub(crate) description: String,
    pub(crate) sections: Option<Vec<Section>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum CreditCount {
    Amount(u8),
    Range(u8, u8),
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Section {
    pub(crate) sec_code: String,
    pub(crate) instructors: Vec<String>,
    pub(crate) class_meetings: Vec<ClassMeeting>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum ClassMeeting {
    Unspecified,
    OnlineAsync,
    OnlineSync(Option<Classtime>),
    InPerson(InPersonClass),
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct InPersonClass {
    pub(crate) classtime: Option<Classtime>,
    pub(crate) location: Option<ClassLocation>,
}

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

#[derive(Debug, Serialize, Deserialize)]
pub(crate) enum AmPm {
    Am,
    Pm,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Time(u8, u8, AmPm);

impl Time {
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

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct ClassLocation(pub(crate) String, pub(crate) String);
