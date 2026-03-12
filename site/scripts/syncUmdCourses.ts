import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type UmdIoCourse = {
    course_id: string;
    name: string;
    credits: string;
    dept_id?: string;
    description?: string;
    gen_ed?: string[];
    relationships?: {
        prerequisites?: string;
        also_offered_as?: string[];
    };
};

type Course = {
    id: string;
    title: string;
    credits: number;
    departmentId: string;
    description?: string;
    genEd?: string[];
    prerequisites?: string;
    also_offered_as?: string[],
    lastSyncedAt: string;
};

// Add whatever departments you want here.
const DEPARTMENTS = [
    "CMSC",
    "MATH",
    "STAT",
    "ENEE",
    "BMGT",
    "BIOE",
    "BSCI",
    "CHEM",
    "PHYS",
];

async function fetchDepartmentCourses(deptId: string): Promise<Course[]> {
    const url = `https://api.umd.io/v0/courses?dept_id=${encodeURIComponent(deptId)}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${deptId}: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as UmdIoCourse[];
    const syncedAt = new Date().toISOString();

    return data.map((course) => ({
        id: course.course_id,
        title: course.name,
        credits: Number(course.credits),
        departmentId: course.dept_id ?? deptId,
        description: course.description,
        genEd: course.gen_ed ?? [],
        prerequisites: course.relationships?.prerequisites,
        also_offered_as: course.relationships?.also_offered_as ?? [],
        lastSyncedAt: syncedAt,
    }));
}


async function main() {
    const allCourses: Course[] = [];

    for (const deptId of DEPARTMENTS) {
        console.log(`Fetching ${deptId}...`);
        const courses = await fetchDepartmentCourses(deptId);
        allCourses.push(...courses);
    }

    const deduped = Array.from(
        new Map(allCourses.map((course) => [course.id, course])).values()
    ).sort((a, b) => a.id.localeCompare(b.id));

    const outputDir = path.resolve("data/normalized");
    const outputFile = path.join(outputDir, "umdCourses.json");

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, JSON.stringify(deduped, null, 2), "utf-8");

    console.log(`Saved ${deduped.length} courses to ${outputFile}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});