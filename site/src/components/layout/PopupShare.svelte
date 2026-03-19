<script lang="ts">
    import { createEventDispatcher } from 'svelte';
	import { CurrentScheduleStore } from '../../stores/CoursePlannerStores';
	import type { ScheduleSelection } from '../../types';
	import { QuestionCircleOutline } from "flowbite-svelte-icons";
  import { text } from 'stream/consumers';

    const dispatch = createEventDispatcher();
	let selections: ScheduleSelection[] = [];

	CurrentScheduleStore.subscribe((stored) => {
        selections = stored.selections;
		console.log("Selections:", selections);
		
    })

    function closePopup() {
		console.log("Wait")
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
			'Th': 'TH',
			'Tu': 'TU',
			'M': 'MO',
			'W': 'WE',
			'F': 'FR'
		};

		const regex = new RegExp(Object.keys(DayMaps).join('|'), 'g');

		const matches = days.match(regex);
		
		return matches ? matches.map(m => DayMaps[m]).join(',') : '';
	}

    function exportCalender() {
		for (const currentClass of selections) {
			const courseCode = currentClass.course.courseCode
			const sectionNumber = currentClass.section.sectionCode
			const courseName = currentClass.course.name
			const instructorNames = currentClass.section.instructors.join(', ') || 'TBA';
			const meetingDetails = []; 

			for (const meeting of currentClass.section.meetings) {
				let locationStr = "Online/Async";
				let days = "";
				let startTime = "";
				let endTime = "";

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

			
		}
    }
</script>

<div class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    
    <div class="bg-bgLight dark:bg-bgDark p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4 border border-gray-500">
        
        <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Export Schedule</h2>
            
            <button 
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                title="This will download a universal .ics file containing your schedule."
            >
                <QuestionCircleOutline class='h-5 w-5'/>
            </button>
        </div>
        
        <p class="text-sm text-center mb-2">
            Download your schedule as a .ics file and import it into your favorite app.
        </p>

        
        <button 
            class="bg-hoverLight dark:bg-hoverDark py-3 px-4 rounded-md transition border border-gray-500 font-medium text-lg w-full mt-2"
            on:click={exportCalender}
        >
            Export
        </button>
        
        <button 
            class="mt-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 py-2 px-4 rounded-md transition underline decoration-transparent hover:decoration-current"
            on:click={closePopup}
        >
            Cancel
        </button>
    </div>
</div>