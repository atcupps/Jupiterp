<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import { formatClasstime, formatLocation } from './formatting';
    import { timeToNumber } from './classMeeting';

    export let meeting: ClassMeetingExtended;

    let formattedTime: string;
    let decStartTime: number;
    let decEndTime: number;
    let location: string;

    $: if (meeting.meeting != null && typeof meeting.meeting != 'string') {
        if ('OnlineSync' in meeting.meeting) {
            formattedTime = formatClasstime(meeting.meeting.OnlineSync);
            decStartTime = timeToNumber(meeting.meeting.OnlineSync.start_time);
            decEndTime = timeToNumber(meeting.meeting.OnlineSync.end_time);
            location = 'Online';
        } else {
            const inPerson = meeting.meeting.InPerson;
            if (inPerson.classtime != null) {
                formattedTime = formatClasstime(inPerson.classtime);
                decStartTime = timeToNumber(inPerson.classtime.start_time);
                decEndTime = timeToNumber(inPerson.classtime.end_time);
            } else {
                throw Error('Null classtime for ClassMeeting');
            }

            if (inPerson.location != null) {
                location = formatLocation(inPerson.location);
            } else {
                location = 'Location TBA';
            }
        }
    }

</script>

<div class='absolute w-full bg-orange text-center text-black'
        style=' top: {(decStartTime - 8) / 11 * 100}%;
                height: {(decEndTime - decStartTime) / 11 * 100}%;'>
    {meeting.course}
</div>