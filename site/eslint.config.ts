import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  {
    ignores: ['build/**', '.svelte-kit/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{svelte,svelte.ts,svelte.js}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
        svelteConfig,
      },
    },
    rules: {
      'no-undef': 'off',
      // Enforces the standard recommended order of Svelte attributes
      'svelte/sort-attributes': [
        'error',
        {
          order: [
            'this',
            'bind:this',
            'id',
            'name',
            'slot',
            '--style-props',
            ['style', 'style:'],
            'class',
            'class:',
            'ATTRIBUTE', // Catch-all for regular HTML attributes
            ['bind:', 'on:'],
            'use:',
            ['transition:', 'in:', 'out:'],
            'animate:',
            'let:',
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
