<script>
    export let data;
    let professors = data.professors;
    let depts = data.departments;

    import { ptLinkFromSlug } from './professors';
    import { formatClasstime } from './formatting';
</script>

<h1>Jupiterp</h1>

<p>The ultimate course schedule planning tool for UMD students.</p>

<h2>Professors:</h2>
<ul>
{#each professors as { name, slug, average_rating }}
    <li>
        <a href={ ptLinkFromSlug(slug) } target="_blank">{ name }</a>: { average_rating }
    </li>
{/each}
</ul>

<h2>Courses:</h2>
{#each depts as { name, courses }}
    <h3>{name}</h3>
    <ul>
        {#each courses as { code, name, credits, gen_eds, description, sections }}
            <li>
                <b>{code}: </b>{name}
                <ul>
                    <li>
                        Credits:
                        {#if 'Amount' in credits}
                            {credits.Amount}
                        {:else if 'Range' in credits}
                            {credits.Range[0]} - {credits.Range[1]}
                        {/if}
                    </li>
                    <li>
                        GenEds: 
                        {#if gen_eds == null}
                            None
                        {:else}
                            <ul>
                                {#each gen_eds as genEd}
                                    <li>{genEd}</li>
                                {/each}
                            </ul>
                        {/if}
                    </li>
                    <li>{description}</li>
                    <li>
                        Sections:
                        {#if sections == null}
                            None
                        {:else}
                            <ul>
                                {#each sections as { sec_code, instructors, class_meetings }}
                                    {sec_code}:
                                    <ul>
                                        <li>Instructors: { instructors }</li>
                                        <ul>
                                            {#each class_meetings as meeting}
                                                <li>
                                                    {#if typeof meeting === 'string'}
                                                        {meeting}
                                                    {:else if 'OnlineSync' in meeting}
                                                        Online Sync:
                                                        {formatClasstime(meeting.OnlineSync)}
                                                    {:else}
                                                        {#if meeting.InPerson.classtime == null}
                                                            Class time: TBA
                                                        {:else}
                                                            {formatClasstime(meeting.InPerson.classtime)}, 
                                                            {#if meeting.InPerson.location == null}
                                                                Location: TBA
                                                            {:else}
                                                                {meeting.InPerson.location[0]}
                                                                {meeting.InPerson.location[1]}
                                                            {/if}
                                                        {/if}
                                                    {/if}
                                                </li>
                                            {/each}
                                        </ul>
                                    </ul>
                                {/each}
                            </ul>
                        {/if}
                    </li>
                </ul>
            </li>
        {/each}
    </ul>
{/each}