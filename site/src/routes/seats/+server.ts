import { SUPABASE_KEY, SUPABASE_URL } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

/** @type {import('./$types').RequestHandler} */
/**
 * Load seat data from Supabase and return it in `Record` form
 * @returns `Promise<Record<string, number[]>>` where the `Record` key is a
 * concatenation of: `courseID-sectionID` and the value is 
 * of the form [openSeats, totalSeats, waitlist].
 */
export async function GET() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.from('seats').select();
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const seatsDataMap: Record<string, number[]> = {};
    data.forEach((elt) => {
        const key = elt.course_id + '-' + elt.section_id;
        const seats = [elt.current_seats, elt.max_seats, elt.waitlist];
        seatsDataMap[key] = seats;
    });

    return new Response(JSON.stringify(seatsDataMap), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}