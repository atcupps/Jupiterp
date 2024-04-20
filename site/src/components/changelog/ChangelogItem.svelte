<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
 -->
<script lang="ts">
    export let title: string;
    export let version: string;
    export let date: string;
</script>

<div class='py-2 mx-2 border-l-2 border-divBorderLight 
                                dark:border-divBorderDark'>
    <div class='px-2 flex flex-col'>
        <div class='static flex flex-row items-end space-x-1.5'>
            <div class='absolute left-9 bg-bgLight 
                            dark:bg-bgDark w-5 h-5 translate-y-[-4px]'>
                <div class='absolute top-[50%] translate-y-[-50%] 
                            translate-x-[10%] bg-orange w-2 
                                            h-2 rounded-[50%]' />
            </div>
            <span class='font-bold text-xl dark:text-white'>
                {title}
            </span>
            <span class='font-light text-secCodesLight dark:text-secCodesDark'>
                {version}
            </span>
        </div>
        <span class='italic align-top text-sm pl-1.5'>
            {date}
        </span>
    
        <div class='pl-1.5'>
            <slot  />
        </div>
    </div>
</div>