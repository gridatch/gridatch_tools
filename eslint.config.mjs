import { fixupPluginRules } from '@eslint/compat';
import eslintjs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['scripts/*', '**/*.module.css.d.ts'],
  },
  ...tseslint.config(
    eslintjs.configs.recommended,
    ...tseslint.configs.recommended,
  ),
  {
    files: ['**/*.jsx', '**/*.tsx'],
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    plugins: {
      'react-hooks': fixupPluginRules(reactHooks),
      'import': importPlugin,
      '@stylistic': stylistic,
    },

    languageOptions: {
      globals: {
        __PATH_PREFIX__: true,
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      'import/resolver': {
        typescript: {},
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
      ...stylistic.configs.recommended.rules,
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/member-delimiter-style': 'error',
      '@stylistic/semi': ['error', 'always'],
      // feature 間の import を禁止
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/features/realm',
              from: './src/features/!(realm)/**',
            },
            {
              target: './src/features/realmViewer',
              from: './src/features/!(realmViewer)/**',
            },
            {
              target: './src/features/wait',
              from: './src/features/!(wait)/**',
            },
            {
              target: './src/features/wait/manman',
              from: './src/features/wait/!(manman|common)/**',
            },
            {
              target: './src/features/wait/sozu',
              from: './src/features/wait/!(sozu|common)/**',
            },
          ],
        },
      ],

      'import/order': [
        'error',
        {
          'groups': [
            'builtin',
            'external',
            'object',
            'type',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'pathGroups': [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'gatsby', group: 'external', position: 'before' },
            { pattern: 'gatsby-plugin-**', group: 'external', position: 'before' },
            { pattern: '@shared/**', group: 'internal', position: 'after' },
            { pattern: '@features/**', group: 'internal', position: 'after' },
          ],
          'pathGroupsExcludedImportTypes': ['react', 'gatsby', 'gatsby-plugin-**'],
          'newlines-between': 'always',
          'alphabetize': { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
