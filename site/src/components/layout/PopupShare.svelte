<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CurrentScheduleStore } from '../../stores/CoursePlannerStores';
	import type { ScheduleSelection } from '../../types';
	import Tooltip from '../course-planner/schedule/Tooltip.svelte';
	import { QuestionCircleOutline } from 'flowbite-svelte-icons';

	const dispatch = createEventDispatcher();
	let selections: ScheduleSelection[] = [];
	let selectionsCustom: any[] = [];

	CurrentScheduleStore.subscribe((stored) => {
		selections = stored.selections.filter(
			(s) => 'course' in s && 'section' in s
		) as ScheduleSelection[];
		selectionsCustom = stored.selections.filter((s) => !('course' in s)) as any[];
	});

	function closePopup() {
		dispatch('close-export');
	}

	function formatDecimalTime(decimalTime: number): string {
		const hours = Math.floor(decimalTime);

		const minutes = Math.round((decimalTime - hours) * 60);

		const hString = hours.toString().padStart(2, '0');
		const mString = minutes.toString().padStart(2, '0');

		return `${hString}${mString}00`;
	}

	function formatDay(days: string): string {
		const DayMaps: Record<string, string> = {
			Th: 'TH',
			Tu: 'TU',
			M: 'MO',
			W: 'WE',
			F: 'FR',
			Sa: 'SA',
			Su: 'SU'
		};

		const regex = new RegExp(Object.keys(DayMaps).join('|'), 'g');

		const matches = days.match(regex);

		return matches ? matches.map((m) => DayMaps[m]).join(',') : '';
	}

	function formatDate(date: Date): string {
		const y = date.getFullYear();
		const m = (date.getMonth() + 1).toString().padStart(2, '0');
		const d = date.getDate().toString().padStart(2, '0');
		return `${y}${m}${d}`;
	}

	function getFirstOccurrence(startStr: string, daysStr: string): string {
		const year = parseInt(startStr.substring(0, 4));
		const month = parseInt(startStr.substring(4, 6)) - 1;
		const day = parseInt(startStr.substring(6, 8));
		let date = new Date(year, month, day);

		const dayMap: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };

		const firstClassDay = daysStr.split(',')[0];
		const targetDay = dayMap[firstClassDay];
		if (targetDay === undefined) return formatDate(date);

		for (let i = 0; i < 7; i++) {
			if (date.getDay() === targetDay) break;
			date.setDate(date.getDate() + 1);
		}

		return formatDate(date);
	}

	function exportCalender() {
		let icsData = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Jupiterp//EN\n';
		// hardcoded for now (dates are 0 indexed so jan is 0 and its yy, mm, dd)
		const semesterStart = formatDate(new Date(2026, 7, 31));
		const semesterEnd = formatDate(new Date(2026, 11, 11));

		for (const currentClass of selectionsCustom) {
			const name = currentClass.name;
			const id = currentClass.id;
			const days = Array.isArray(currentClass.days) ? formatDay(currentClass.days.join()) : '';
			const startTime =
				typeof currentClass.startTime === 'number' ? formatDecimalTime(currentClass.startTime) : '';
			const endTime =
				typeof currentClass.endTime === 'number' ? formatDecimalTime(currentClass.endTime) : '';

			const description = currentClass.notes || '';
			const location = currentClass.location || 'TBA';

			if (!days || !startTime || !endTime) {
				continue;
			}

			const actualFirstDay = getFirstOccurrence(semesterStart, days);

			icsData += 'BEGIN:VEVENT\n';
			icsData += `SUMMARY:${name} - ${location}\n`;

			icsData += `DTSTART:${actualFirstDay}T${startTime}\n`;
			icsData += `DTEND:${actualFirstDay}T${endTime}\n`;
			icsData += `RRULE:FREQ=WEEKLY;BYDAY=${days};UNTIL=${semesterEnd}T235959Z\n`;
			icsData += `LOCATION:${location}\n`;
			icsData += `DESCRIPTION:${description}\n`;
			icsData += `UID:${id}@jupiterp\n`;
			icsData += 'END:VEVENT\n';
		}

		for (const currentClass of selections) {
			const courseCode = currentClass.course.courseCode;
			const sectionNumber = currentClass.section.sectionCode;
			const courseName = currentClass.course.name;
			const instructorNames =
				Array.isArray(currentClass.section.instructors) && currentClass.section.instructors.length
					? currentClass.section.instructors.join(', ')
					: 'TBA';
			const meetingDetails = [];

			for (const meeting of currentClass.section.meetings) {
				if (typeof meeting !== 'object' || meeting === null || Array.isArray(meeting)) continue;

				let locationStr = 'Online/Async';
				let days = '';
				let startTime = '';
				let endTime = '';

				if (typeof meeting === 'object' && meeting !== null) {
					const loc = meeting.location || {};
					const building = loc.building || '';
					const room = loc.room || '';
					locationStr = building || room ? `${building} ${room}`.trim() : 'Online/Async';

					const buildingLower = (building || '').toLowerCase();
					if (buildingLower.includes('online')) {
						if (buildingLower.includes('sync')) {
							locationStr = 'Online (Synchronous)';
						} else if (buildingLower.includes('async')) {
							locationStr = 'Online (Asynchronous)';
						} else {
							locationStr = 'Online';
						}
					}

					const classtime = meeting.classtime || {};
					days = classtime.days ? formatDay(classtime.days) : '';
					startTime = typeof classtime.start === 'number' ? formatDecimalTime(classtime.start) : '';
					endTime = typeof classtime.end === 'number' ? formatDecimalTime(classtime.end) : '';
				}

				const meetingPacket = {
					location: locationStr,
					days: days,
					start: startTime,
					end: endTime
				};

				meetingDetails.push(meetingPacket);
			}

			for (const packet of meetingDetails) {
				if (!packet.days || !packet.start || !packet.end) {
					const locLower = (packet.location || '').toLowerCase();
					if (locLower.includes('online') || locLower.includes('async')) {
						const actualFirstDay = semesterStart;

						icsData += 'BEGIN:VEVENT\n';
						icsData += `SUMMARY:${courseCode} (${sectionNumber}) - ${packet.location}\n`;

						icsData += `DTSTART:${actualFirstDay}T000000\n`;
						icsData += `DTEND:${actualFirstDay}T235959\n`;
						icsData += `LOCATION:${packet.location}\n`;
						const onlineNote = locLower.includes('sync')
							? 'Online (Synchronous)'
							: locLower.includes('async')
								? 'Online (Asynchronous)'
								: 'Online';
						icsData += `DESCRIPTION:Course: ${courseName}\\nInstructors: ${instructorNames} (${onlineNote})\\n`;
						icsData += `UID:${courseCode}-${sectionNumber}-online@jupiterp\n`;
						icsData += 'END:VEVENT\n';
					}
					continue;
				}

				const actualFirstDay = getFirstOccurrence(semesterStart, packet.days);

				icsData += 'BEGIN:VEVENT\n';
				icsData += `SUMMARY:${courseCode} (${sectionNumber}) - ${packet.location}\n`;

				icsData += `DTSTART:${actualFirstDay}T${packet.start}\n`;
				icsData += `DTEND:${actualFirstDay}T${packet.end}\n`;

				icsData += `RRULE:FREQ=WEEKLY;BYDAY=${packet.days};UNTIL=${semesterEnd}T235959Z\n`;

				icsData += `LOCATION:${packet.location}\n`;
				const packetLocLower = (packet.location || '').toLowerCase();
				const onlineTag = packetLocLower.includes('online')
					? packetLocLower.includes('sync')
						? ' (Online - Synchronous)'
						: packetLocLower.includes('async')
							? ' (Online - Asynchronous)'
							: ' (Online)'
					: '';
				icsData += `DESCRIPTION:Course: ${courseName}${onlineTag}\\nInstructors: ${instructorNames}\\n`;
				icsData += `UID:${courseCode}-${sectionNumber}-${packet.start || ''}@jupiterp\n`;
				icsData += 'END:VEVENT\n';
			}
		}
		icsData += 'END:VCALENDAR';

		const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'Jupiterp_Schedule.ics';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div
		class="flex w-96 flex-col gap-4 rounded-lg border-2 border-divBorderLight bg-bgLight p-6 shadow-lg dark:border-divBorderDark dark:bg-bgDark"
	>
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold">Export Schedule</h2>

			<Tooltip
				text="?"
				tooltipText="This will download a universal .ics file containing your schedule."
			/>
		</div>

		<p class="mb-2 text-center text-sm">
			Download your schedule as a .ics file and import it into your favorite app.
		</p>

		<button
			class=" mt-2 w-full rounded-md bg-hoverLight px-4 py-3 text-lg font-medium transition dark:bg-hoverDark"
			on:click={exportCalender}
		>
			Export
		</button>

		<button
			class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mt-1 rounded-md px-4 py-2 underline decoration-transparent transition hover:decoration-current"
			on:click={closePopup}
		>
			Cancel
		</button>
	</div>
</div>
