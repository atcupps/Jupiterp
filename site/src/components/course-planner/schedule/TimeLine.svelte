<!-- 
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2024 Andrew Cupps
-->
<script lang='ts'>
    export let number: string = '';
    export let position: number = 0;
</script>

<div class='w-full absolute h-[28px]' style='top: {position * 100}%'>
    <div class='text-xs 2xl:text-sm font-light 
                    absolute text-right w-[34px] 2xl:w-[40px]' 
            style='left: -8px; top: 50%; transform: translateY(-50%);'>
        {number}
    </div>
    <div class='h-[1px] bg-divBorderLight 
        dark:bg-divBorderDark absolute left-8 2xl:left-10' 
        style='top: 50%; width: calc(100% - 32px);'/>
</div>