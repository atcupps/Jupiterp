<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2026 Andrew Cupps
-->
<script lang='ts'>
    export let number: string = '';
    export let position: number = 0;
    export let isLast: boolean = false;
</script>

<div class='w-full absolute h-[24px]'
    style='top: {isLast ? `calc(${position * 100}% - 24px)` : `${position * 100}%`}'>
    <div class='text-xs 2xl:text-sm font-light 
                    absolute text-right w-[46px] 2xl:w-[54px]' 
            style='left: -12px; top: 50%; transform: translateY(-50%);'>
        {number}
    </div>
    <div class='h-[1px] bg-divBorderLight 
        dark:bg-divBorderDark absolute left-12 2xl:left-14' 
        style='top: 50%; width: calc(100% - 48px); opacity: 0.35;'/>
</div>