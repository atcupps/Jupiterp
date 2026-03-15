import { getCoursesByDepartment } from '../src/lib/data/umdCourses';
import { CS_GENERAL_TRACK_REQUIREMENTS } from '../src/lib/data/umdRequirements';
import { attachRequirementMetadata } from '../src/lib/data/umdCourseMetadata';

const cmscCourses = getCoursesByDepartment('CMSC');
const enriched = attachRequirementMetadata(cmscCourses, CS_GENERAL_TRACK_REQUIREMENTS);

console.log(JSON.stringify(enriched, null, 2));
