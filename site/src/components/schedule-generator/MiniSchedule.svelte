<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang="ts">
	import { getClasstimeBounds, schedulify } from '../../lib/course-planner/Schedule';
	import { getColorFromNumber } from '../../lib/course-planner/ClassMeetingUtils';
	import { splitCourseCode } from '../../lib/course-planner/Formatting';
	import type { Schedule, ScheduleSelection } from '../../types';

	export let selections: ScheduleSelection[];

	const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

	const EMPTY_SCHEDULE: Schedule = {
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		other: []
	};

	// A single malformed section (e.g. an unexpected day code) must never
	// take down the whole results gallery, so failures degrade to empty.
	function safeSchedulify(sel: ScheduleSelection[]): Schedule {
		try {
			return schedulify(sel);
		} catch (e) {
			console.error('Failed to render generated schedule:', e);
			return EMPTY_SCHEDULE;
		}
	}

	$: schedule = safeSchedulify(selections);
	$: days = [
		schedule.monday,
		schedule.tuesday,
		schedule.wednesday,
		schedule.thursday,
		schedule.friday
	];
	$: hasOther = schedule.other.length > 0;

	// Time window: fit all timed meetings, with a minimum 8-hour window.
	$: bounds = computeBounds(schedule);
	function computeBounds(s: Schedule): { start: number; end: number } {
		const { earliestStart, latestEnd } = getClasstimeBounds(s);
		if (earliestStart === Number.MAX_SAFE_INTEGER) {
			return { start: 8, end: 16 };
		}
		let start = earliestStart;
		let end = latestEnd;
		const diff = end - start;
		if (diff < 8) {
			start -= Math.floor((8 - diff) / 2);
			end += Math.ceil((8 - diff) / 2);
		}
		return { start, end };
	}

	$: span = bounds.end - bounds.start;

	function decStart(meeting: ScheduleSelection['section']['meetings'][number]) {
		return typeof meeting === 'string' ? 0 : meeting.classtime.start;
	}
	function decEnd(meeting: ScheduleSelection['section']['meetings'][number]) {
		return typeof meeting === 'string' ? 0 : meeting.classtime.end;
	}
</script>

<div class="flex flex-col">
	<div class="flex h-44 flex-row">
		{#each days as day, dayIndex}
			<div class="flex grow basis-0 flex-col">
				<div class="text-center text-[10px] font-semibold opacity-70">
					{DAY_LABELS[dayIndex]}
				</div>
				<div class="relative grow">
					{#each day as cm}
						{#if typeof cm.meeting !== 'string'}
							<div
								class="absolute overflow-hidden rounded-sm
									px-0.5 text-[8px] leading-tight text-black"
								style="top: {((decStart(cm.meeting) - bounds.start) / span) * 100}%;
									height: {((decEnd(cm.meeting) - decStart(cm.meeting)) / span) * 100}%;
									width: {(1 / cm.conflictTotal) * 100}%;
									left: {((cm.conflictIndex - 1) / cm.conflictTotal) * 100}%;
									background-color: {getColorFromNumber(cm.colorNumber)};"
								title={`${cm.courseCode} ${cm.sectionCode}`}
							>
								<span class="font-semibold">
									{splitCourseCode(cm.courseCode)}
								</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#if hasOther}
		<div
			class="mt-1 flex flex-row flex-wrap gap-1 border-t
				border-divBorderLight pt-1 dark:border-divBorderDark"
		>
			{#each schedule.other as cm}
				<span
					class="rounded-sm px-1 text-[9px] text-black"
					style="background-color: {getColorFromNumber(cm.colorNumber)};"
				>
					{splitCourseCode(cm.courseCode)}
					{typeof cm.meeting === 'string' ? '(async)' : `(${cm.meeting.classtime.days})`}
				</span>
			{/each}
		</div>
	{/if}
</div>
