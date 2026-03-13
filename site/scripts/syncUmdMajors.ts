//TODO: implement major getters and syncing with backend, then use in UMD major progress page
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type UmdIoMajor = {
    major_id: number;
    name: string;
    college: string;
    url: string;
};

type Major = {
    id: number;
    name: string;
    college: string;
    url: string;
    syncedAt: string;
};


async function fetchMajors(): Promise<Major[]> {
    const url = `https://api.umd.io/v1/majors/list`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch majors: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as UmdIoMajor[];
    const syncedAt = new Date().toISOString();

    return data.map((major) => ({
        id: major.major_id,
        name: major.name,
        college: major.college,
        url: major.url,
        syncedAt: syncedAt,
    }));
}


async function main() {
    const allMajors = await fetchMajors();

    const deduped = Array.from(
        new Map(allMajors.map((major) => [major.id, major])).values()
    ).sort((a, b) => a.id - b.id);

    const outputDir = path.resolve("data/normalized");
    const outputFile = path.join(outputDir, "umdMajors.json");

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, JSON.stringify(deduped, null, 2), "utf-8");

    console.log(`Saved ${deduped.length} majors to ${outputFile}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});