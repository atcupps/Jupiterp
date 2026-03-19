<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    function closePopup() {
        dispatch('close-export');
    }

    function exportToGoogle() {
        // TODO
    }

    function exportToApple() {
        // TODO
    }

    function exportToOutlook() {
        // TODO
    }

    function downloadICS() {
        // TODO
    }
</script>

<div class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    
    <div class="bg-bgLight dark:bg-bgDark p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4 border border-gray-500">
        <h2 class="text-xl font-bold">Export Schedule to Calendar</h2>
        
        <p class="text-sm">
            Export your schedule to a calendar of your choice!
        </p>
        
        <div class="flex flex-col gap-3 py-2">
            <button 
                class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition shadow-sm font-medium"
                on:click={exportToGoogle}
            >
                Google Calendar
            </button>

            <button 
                class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition shadow-sm font-medium"
                on:click={exportToApple}
            >
                Apple Calendar
            </button>

            <button 
                class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition shadow-sm font-medium"
                on:click={exportToOutlook}
            >
                Outlook
            </button>

            <button 
                class="bg-hoverLight dark:bg-hoverDark py-2 px-4 rounded-md transition border border-gray-500 font-medium"
                on:click={downloadICS}
            >
                Download .ics File
            </button>
        </div>
        
        <button 
            class="mt-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 py-2 px-4 rounded-md transition underline decoration-transparent hover:decoration-current"
            on:click={closePopup}
        >
            Cancel
        </button>
    </div>
</div>