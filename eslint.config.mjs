import { fixupPluginRules } from "@eslint/compat";
import eslintjs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.config(
    {
      ...eslintjs.configs.recommended,
      ignores: ["scripts/*"],
    },
    ...tseslint.configs.recommended.map((config) => ({
      ...config,
      ignores: ["scripts/*"],
    }))
  ),
  {
    files: ["**/*.jsx", "**/*.tsx"],
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    plugins: {
      "react-hooks": fixupPluginRules(reactHooks),
      import: importPlugin,
    },

    languageOptions: {
      globals: {
        __PATH_PREFIX__: true,
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      "import/resolver": {
        typescript: {},
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
      // feature 間の import を禁止
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: './src/features/realm',
              from: './src/features/!(realm)/**',
            },
            {
              target: "./src/features/realmViewer",
              from: "./src/features/!(realmViewer)/**",
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
      
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "object",
            "type",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            { pattern: "react", group: "external", position: "before" },
            { pattern: "gatsby", group: "external", position: "before" },
            { pattern: "gatsby-plugin-**", group: "external", position: "before" },
            { pattern: "@shared/**", group: "internal", position: "after" },
            { pattern: "@features/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["react", "gatsby", "gatsby-plugin-**"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  }
];