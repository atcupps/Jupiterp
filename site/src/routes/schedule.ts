enum Day {
    Monday = 'monday',
    Tuesday = 'tuesday',
    Wednesday = 'wednesday',
    Thursday = 'thursday',
    Friday = 'friday',
    Other = 'other'
}

export function schedulify(selections: ScheduleSelection[]): Schedule {
    let schedule: Schedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        other: []
    }
    selections.forEach((selection) => {
        selection.section.class_meetings.forEach((meeting) => {
            const newMeeting: ClassMeetingExtended = {
                course: selection.courseCode,
                instructors: selection.section.instructors,
                meeting
            }
            if (typeof meeting === 'string') {
                schedule.other = [...schedule.other, newMeeting];
            }
            else if ('OnlineSync' in meeting) {
                addMeeting(schedule, newMeeting, meeting.OnlineSync);
            } else {
                if (meeting.InPerson.classtime == null) {
                    schedule.other = [...schedule.other, newMeeting];
                } else {
                    addMeeting(schedule, newMeeting, meeting.InPerson.classtime);
                }
            }
        })
    })
    return schedule;
}

function addMeeting(schedule: Schedule, meeting: ClassMeetingExtended, 
                                                        classtime: Classtime) {
    const days: Day[] = parseDays(classtime.days);
    days.forEach((day) => {
        switch (day) {
            case Day.Monday:
                schedule.monday = [...schedule.monday, meeting];
                break;
            case Day.Tuesday:
                schedule.tuesday = [...schedule.tuesday, meeting];
                break;
            case Day.Wednesday:
                schedule.wednesday = [...schedule.wednesday, meeting];
                break;
            case Day.Thursday:
                schedule.thursday = [...schedule.thursday, meeting];
                break;
            case Day.Friday:
                schedule.friday = [...schedule.friday, meeting];
                break;
            case Day.Other:
                schedule.other = [...schedule.other, meeting];
                break;
        }
    })
}

function parseDays(days: string): Day[] {
    switch (days) {
        case 'M':
            return [Day.Monday];
        case 'Tu':
            return [Day.Tuesday];
        case 'W':
            return [Day.Wednesday];
        case 'Th':
            return [Day.Thursday];
        case 'F':
            return [Day.Friday];
        case 'MWF':
            return [Day.Monday, Day.Wednesday, Day.Friday];
        case 'MW':
            return [Day.Monday, Day.Wednesday];
        case 'WF':
            return [Day.Wednesday, Day.Friday];
        case 'TuTh':
            return [Day.Tuesday, Day.Thursday];
        case 'MTuWThF':
            return [Day.Monday, Day.Tuesday, Day.Wednesday, 
                                        Day.Thursday, Day.Friday];
        case 'MF':
            return [Day.Monday, Day.Friday];
        case 'Sa':
            return [Day.Other];
        case 'Su':
            return [Day.Other];
        case 'SaSu':
            return [Day.Other];
        case 'MTu':
            return [Day.Monday, Day.Tuesday];
        case 'MTuThF':
            return [Day.Monday, Day.Tuesday, Day.Thursday, Day.Friday];
        case 'MTuWTh':
            return [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday];
        default:
            throw Error('Unknown Day code: ' + days);
    }
}