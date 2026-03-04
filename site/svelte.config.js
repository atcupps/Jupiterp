import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isVercel = process.env.VERCEL === '1';
const isGitHubPages = process.env.GH_PAGES === '1' || process.env.GITHUB_PAGES === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: isGitHubPages
      ? adapterStatic({
          fallback: '404.html'
        })
      : isVercel
        ? adapterVercel()
        : adapterNode(),
    paths: isGitHubPages
      ? {
          base: '/Jupiterp'
        }
      : undefined
  },
  preprocess: vitePreprocess()
};
export default config;
