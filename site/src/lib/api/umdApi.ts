export type Course = {
	id: string;
	title: string;
	credits: number;
};

type UmdIoCourse = {
	course_id: string;
	name: string;
	credits: string;
};

export async function fetchCoursesByDepartment(deptId: string): Promise<Course[]> {
	const url = `https://api.umd.io/v0/courses?dept_id=${encodeURIComponent(deptId)}`;

	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch ${deptId} courses: ${response.status}`);
	}

	const data = (await response.json()) as UmdIoCourse[];

	return data.map((course) => ({
		id: course.course_id,
		title: course.name,
		credits: Number(course.credits)
	}));
}
