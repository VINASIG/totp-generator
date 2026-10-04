import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig({
  files: ['**/*.{js,mjs,ts,tsx}'],
  ignores: [
    'node_modules/**',
    'dist/**',
    'output/**',
    '.vinasig/**',
    '.agents/**',
  ],
  extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: process.cwd(),
    },
    globals: { document: 'readonly', window: 'readonly', console: 'readonly' },
  },
  rules: { '@typescript-eslint/consistent-type-imports': 'error' },
});
