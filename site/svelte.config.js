import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: isVercel ? adapterVercel() : adapterNode(),

    prerender: {
      handleHttpError: 'warn',
    },
  },
};
export default config;
