<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CurrentScheduleStore } from '../../stores/CoursePlannerStores';
	import type { ScheduleSelection } from '../../types';
	import { QuestionCircleOutline } from 'flowbite-svelte-icons';

	const dispatch = createEventDispatcher();
	let selections: ScheduleSelection[] = [];
	let selectionsCustom: any[] = [];

	CurrentScheduleStore.subscribe((stored) => {
		selections = stored.selections.filter(
			(s) => 'course' in s && 'section' in s
		) as ScheduleSelection[];
		selectionsCustom = stored.selections.filter((s) => !('course' in s)) as any[];
		console.log('Selections:', selections);
		console.log('Selections Custom:', selectionsCustom);
	});

	function closePopup() {
		console.log('Wait');
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
			F: 'FR'
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

		const dayMap: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5 };

		const firstClassDay = daysStr.split(',')[0];
		const targetDay = dayMap[firstClassDay];

		for (let i = 0; i < 7; i++) {
			if (date.getDay() === targetDay) break;
			date.setDate(date.getDate() + 1);
		}

		return formatDate(date);
	}

	function exportCalender() {
		let icsData = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Jupiterp//EN\n';
		// hardcoded for now (dates are 0 indexed so jan is 0 and its yy, mm, dd)
		const semesterStart = formatDate(new Date(2026, 8, 1));
		const semesterEnd = formatDate(new Date(2026, 11, 18));

		for (const currentClass of selectionsCustom) {
			const name = currentClass.name;
			const id = currentClass.id;
			const days = formatDay(currentClass.days.join());
			const startTime = formatDecimalTime(currentClass.startTime);
			const endTime = formatDecimalTime(currentClass.endTime);

			const description = currentClass.notes;
			const location = currentClass.location;

			const actualFirstDay = getFirstOccurrence(semesterStart, days);

			icsData += 'BEGIN:VEVENT\n';
			icsData += `SUMMARY:${name} - ${location}\n`;

			icsData += `DTSTART:${actualFirstDay}T${startTime}\n`;
			icsData += `DTEND:${actualFirstDay}T${endTime}\n`;
			icsData += `RRULE:FREQ=WEEKLY;BYDAY=${days};UNTIL=${semesterEnd}T235959Z\n`;
			icsData += `LOCATION:${location}\n`;
			icsData += `DESCRIPTION:${description}}\n`;
			icsData += `UID:${id}@jupiterp\n`;
			icsData += 'END:VEVENT\n';
		}

		for (const currentClass of selections) {
			const courseCode = currentClass.course.courseCode;
			const sectionNumber = currentClass.section.sectionCode;
			const courseName = currentClass.course.name;
			const instructorNames = currentClass.section.instructors.join(', ') || 'TBA';
			const meetingDetails = [];

			for (const meeting of currentClass.section.meetings) {
				let locationStr = 'Online/Async';
				let days = '';
				let startTime = '';
				let endTime = '';

				if (typeof meeting === 'object' && meeting !== null) {
					locationStr = `${meeting.location.building} ${meeting.location.room}`;
					days = formatDay(meeting.classtime.days);
					startTime = formatDecimalTime(meeting.classtime.start);
					endTime = formatDecimalTime(meeting.classtime.end);
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
				const actualFirstDay = getFirstOccurrence(semesterStart, packet.days);

				icsData += 'BEGIN:VEVENT\n';
				icsData += `SUMMARY:${courseCode} (${sectionNumber}) - ${packet.location}\n`;

				icsData += `DTSTART:${actualFirstDay}T${packet.start}\n`;
				icsData += `DTEND:${actualFirstDay}T${packet.end}\n`;

				icsData += `RRULE:FREQ=WEEKLY;BYDAY=${packet.days};UNTIL=${semesterEnd}T235959Z\n`;

				icsData += `LOCATION:${packet.location}\n`;
				icsData += `DESCRIPTION:Course: ${courseName}\\nInstructors: ${instructorNames}\n`;
				icsData += `UID:${courseCode}-${sectionNumber}-${packet.start}@jupiterp\n`;
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
		class="border-gray-500 flex w-96 flex-col gap-4 rounded-lg border bg-bgLight p-6 shadow-lg dark:bg-bgDark"
	>
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold">Export Schedule</h2>

			<button
				class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
				title="This will download a universal .ics file containing your schedule."
			>
				<QuestionCircleOutline class="h-5 w-5" />
			</button>
		</div>

		<p class="mb-2 text-center text-sm">
			Download your schedule as a .ics file and import it into your favorite app.
		</p>

		<button
			class="border-gray-500 mt-2 w-full rounded-md border bg-hoverLight px-4 py-3 text-lg font-medium transition dark:bg-hoverDark"
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
