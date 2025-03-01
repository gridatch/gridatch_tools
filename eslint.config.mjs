import { fixupPluginRules } from "@eslint/compat";
import eslintjs from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

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
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  }
];