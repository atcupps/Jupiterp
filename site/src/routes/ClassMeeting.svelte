<!-- This file is part of Jupiterp: https://github.com/atcupps/Jupiterp -->

<script lang='ts'>
    import { formatClasstime, formatInstructors, formatLocation } from './formatting';
    import { getColorFromNumber, timeToNumber } from './classMeeting';

    export let meeting: ClassMeetingExtended;

    let formattedInstructors: string = formatInstructors(meeting.instructors);
    let formattedTime: string;
    let secCode: string;
    let decStartTime: number;
    let decEndTime: number;
    let location: string;

    $: if (meeting.meeting != null && typeof meeting.meeting != 'string') {
        if ('OnlineSync' in meeting.meeting) {
            formattedTime = formatClasstime(meeting.meeting.OnlineSync);
            secCode = meeting.secCode;
            decStartTime = timeToNumber(meeting.meeting.OnlineSync.start_time);
            decEndTime = timeToNumber(meeting.meeting.OnlineSync.end_time);
            location = 'ONLINE';
        } else {
            const inPerson = meeting.meeting.InPerson;
            if (inPerson.classtime != null) {
                formattedTime = formatClasstime(inPerson.classtime);
                secCode = meeting.secCode;
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

    let elt: HTMLDivElement;
    let innerHeight: number;
    let h: number;
    $: if (elt || innerHeight) {
        h = elt.offsetHeight;
        console.log(h);
    }
</script>

<svelte:window bind:innerHeight />

<div class='absolute w-full text-center text-black flex flex-col rounded-lg pb-1'
        bind:this={elt} 
        style=' top: {(decStartTime - 8) / 11 * 100}%;
                height: {(decEndTime - decStartTime) / 11 * 100}%;
                background-color: {getColorFromNumber(meeting.colorNumber)}'>
    {#if h > 24}
        <div class='w-full text-base font-semibold font-sans rounded-t-lg courseCode'
                class:rounded-b-lg={h < 28}>
            {meeting.course}
        </div>
    {/if}
    <div class='grow w-full font-thin text-xs font-sans'>
        {#if h - 24 > 64}
            <div>
                {formattedInstructors}
            </div>
        {/if}
        {#if h - 24 > 48}
            <div class='truncate'>
                {formattedTime}
            </div>
        {/if}
        {#if h - 24 > 32}
            <div>
                Section {secCode}
            </div>
        {/if}
        {#if h - 24 > 16}
            <div>
                {location}
            </div>
        {/if}
    </div>
</div>

<style>
    .courseCode {
        background-color: rgba(0, 0, 0, 0.07)
    }
</style>