<!--
This file is part of Jupiterp. For terms of use, please see the file
called LICENSE at the top level of the Jupiterp source tree (online at
https://github.com/atcupps/Jupiterp/LICENSE).
Copyright (C) 2025 Andrew Cupps
-->
<script lang="ts">
  /**
   * SolarSystemLoader.svelte
   * A minimalist, CSS-only solar system animation for loading states.
   */

  // Props for customization (optional)
  export let size: number = 260; // Overall width/height in px
  export let color: string = '#ffffff'; // Main stroke color
</script>

<div
  class="solar-system-wrapper"
  style="
    --wrapper-size: {size}px;
    --stroke-color: {color};
  "
  role="status"
  aria-label="Loading courses"
>
  <div class="solar-system">

      <!-- The Central Moon -->
      <div class="moon">
          <div class="crater c1"></div>
          <div class="crater c2"></div>
          <div class="crater c3"></div>
      </div>

      <!-- Middle Ring -->
      <div class="ring ring-2">
          <div class="planet planet-inner"></div>
      </div>

      <!-- Outer Ring -->
      <div class="ring ring-3">
          <div class="planet planet-outer"></div>
      </div>

  </div>
</div>

<style>
  /* Local Scoped Variables */
  .solar-system-wrapper {
      /* Internal variables derived from props */
      --orbit-width: 4px;
      --moon-border-width: 4px;
      --gap-size: 2px;

      /* Relative sizing based on the generic "size" prop */
      --moon-size: calc(var(--wrapper-size) * 0.30); /* ~80px relative to 260px */
      --ring-2-size: calc(var(--wrapper-size) * 0.50); /* ~130px */
      --ring-3-size: calc(var(--wrapper-size) * 0.69); /* ~180px */

      --p-inner-size: 6px;
      --p-outer-size: 6px;

      display: inline-flex;
      justify-content: center;
      align-items: center;
  }

  /* The Main Container */
  .solar-system {
      position: relative;
      width: var(--wrapper-size);
      height: var(--wrapper-size);
      display: flex;
      justify-content: center;
      align-items: center;
      animation: appear-disappear 4s ease-in-out infinite;
  }

  /* --- THE Moon --- */
  .moon {
      width: var(--moon-size);
      height: var(--moon-size);
      border: var(--moon-border-width) solid var(--stroke-color);
      border-radius: 50%;
      position: absolute;
      z-index: 10;
      background: transparent;
      animation: moon-pulse 4s ease-in-out infinite;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      box-sizing: border-box;
  }

  /* Moon Craters */
  .crater {
      position: absolute;
      background-color: var(--stroke-color);
      border-radius: 50%;
  }

  /* Craters positioned using % to stay responsive if size changes */
  .crater.c1 { width: 25%; height: 25%; top: 17%; left: 20%; }
  .crater.c2 { width: 15%; height: 15%; bottom: 20%; right: 22%; }
  .crater.c3 { width: 11%; height: 11%; top: 37%; right: 17%; }

  /* --- RINGS --- */
  .ring {
      position: absolute;
      border: var(--orbit-width) solid var(--stroke-color);
      border-radius: 50%;
      transform: translate(0, 0);
      box-sizing: border-box;
      background: transparent;
      outline: none;
  }

  .ring-2 {
      width: var(--ring-2-size);
      height: var(--ring-2-size);
      z-index: 2;
      animation: orbit-rotate 8s linear infinite;
      background: transparent;
      outline: none;
  }

  .ring-3 {
      width: var(--ring-3-size);
      height: var(--ring-3-size);
      z-index: 1;
      animation: orbit-rotate 14s linear infinite;
      background: transparent;
      outline: none;
  }

  /* --- PLANETS --- */
  .planet {
      background-color: var(--stroke-color);
      border-radius: 50%;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      border: var(--gap-size) solid var(--bg-color);
      box-sizing: content-box;
  }

  .planet-inner {
      width: var(--p-inner-size);
      height: var(--p-inner-size);
      right: calc( -1 * (var(--p-inner-size) / 2) - var(--gap-size) );
  }

  .planet-outer {
      width: var(--p-outer-size);
      height: var(--p-outer-size);
      right: calc( -1 * (var(--p-outer-size) / 2) - var(--gap-size) );
  }

  /* --- ANIMATIONS --- */
  @keyframes appear-disappear {
      0% { opacity: 0; transform: scale(0.8); }
      15% { opacity: 1; transform: scale(1); }
      85% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.1); }
  }

  @keyframes orbit-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
  }

  @keyframes moon-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1); }
  }
</style>
