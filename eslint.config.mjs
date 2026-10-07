import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      'output/**',
      '.agents/**',
      '.vinasig/**',
    ],
  },
  {
    files: ['**/*.{ts,mjs}', 'src/scripts/shared-preferences.js'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: Object.fromEntries(
        [
          'process',
          'console',
          'Buffer',
          'URL',
          'Blob',
          'document',
          'window',
          'location',
          'Image',
          'HTMLElement',
          'HTMLButtonElement',
          'HTMLOutputElement',
          'HTMLDetailsElement',
          'HTMLProgressElement',
          'navigator',
          'setInterval',
          'clearInterval',
          'setTimeout',
          'clearTimeout',
          'HTMLFormElement',
          'HTMLHeadingElement',
          'HTMLSelectElement',
          'HTMLTextAreaElement',
          'HTMLUListElement',
          'HTMLInputElement',
          'HTMLSpanElement',
          'HTMLParagraphElement',
          'HTMLDivElement',
          'HTMLImageElement',
          'HTMLCanvasElement',
          'SVGSVGElement',
          'getComputedStyle',
        ].map((name) => [name, 'readonly']),
      ),
    },
    rules: { '@typescript-eslint/consistent-type-imports': 'error' },
  },
  ...astro.configs.recommended,
);
