/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

import { getSupabaseClient } from '$lib/supabase';
import type { GenEdRequirementCode } from '$lib/gened/requirements';

export interface UserCourse {
	id: string;
	user_id: string;
	course_id: string;
	course_title: string;
	term_code: string;
	gen_ed_tags: GenEdRequirementCode[] | string[];
	grade: string | null;
	is_completed: boolean;
	is_outside_major?: boolean | null;
}

/**
 * Fetch completed user courses used for Gen Ed progress calculations.
 */
export async function fetchUserCoursesForGenEd(userId: string): Promise<UserCourse[]> {
	const supabase = getSupabaseClient() as unknown as {
		from: (table: string) => {
			select: (query: string) => {
				eq: (
					column: string,
					value: string | boolean
				) => {
					eq: (
						column: string,
						value: string | boolean
					) => Promise<{
						data: UserCourse[] | null;
						error: { message: string } | null;
					}>;
				};
			};
		};
	};

	const { data, error } = await supabase
		.from('user_courses')
		.select(
			'id,user_id,course_id,course_title,term_code,gen_ed_tags,grade,is_completed,is_outside_major'
		)
		.eq('user_id', userId)
		.eq('is_completed', true);

	if (error) {
		throw new Error(error.message);
	}

	return (data ?? []) as UserCourse[];
}
