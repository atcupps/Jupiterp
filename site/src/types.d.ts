// This file is part of Jupiterp: https://github.com/atcupps/Jupiterp

type Professor = {
    name: string,
    slug: string,
    average_rating: number | null
};

type Department = {
    name: string,
    courses: Course[]
};

type Course = {
    code: string,
    name: string,
    credits: CreditAmount,
    gen_eds: string[] | null,
    description: string,
    sections: Section[] | null
};

type CreditCount = 
    { Amount: number } | { Range: number[] };

type Section = {
    sec_code: string,
    instructors: string[],
    class_meetings: ClassMeeting[]
};

type ClassMeeting =
    | string
    | { OnlineSync: Classtime }
    | { InPerson: InPersonClass };

type InPersonClass = {
    classtime: Classtime | null,
    location: string[] | null
};

type Classtime = {
    days: string,
    start_time: TimeComponent[],
    end_time: TimeComponent[]
};

type TimeComponent =
    number | string;

type JupiterpData = {
    professors: Professor[],
    departments: Department[]
};