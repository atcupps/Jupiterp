export function retrieveCourses(selections: ScheduleSelection[], 
                                    depts: Department[]): ScheduleSelection[] {
    let result: ScheduleSelection[] = [];
    selections.forEach((selection) => {
        const deptName = selection.courseCode.slice(0, 4);
        const dept = depts.find(department => department.name === deptName);
        if (dept) {
            const course = dept.courses.find(
                aCourse => aCourse.code === selection.courseCode
            );
            if (course && course.sections !== null) {
                const section = course.sections.find(
                    aSection => 
                        aSection.sec_code === selection.section.sec_code
                );
                if (section) {
                    selection.differences = [];
                    if (JSON.stringify(section.instructors) !==
                            JSON.stringify(selection.section.instructors)) {
                        selection.differences.push('Instructors');
                    }
                    if (JSON.stringify(section.class_meetings) !==
                            JSON.stringify(selection.section.class_meetings)) {
                        selection.differences.push('Class meetings');
                    }
                    selection.section = section;
                    result.push(selection);
                }
            }
        }
    });
    return result;
}