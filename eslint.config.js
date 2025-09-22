import js from "@eslint/js";
import eslintPluginVue from "eslint-plugin-vue";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"]
      }
    },
    plugins: {
      vue: eslintPluginVue
    },
    rules: {
      ...eslintPluginVue.configs["flat/recommended"].rules,
      "vue/multi-word-component-names": "off",
      "vue/block-tag-newline": ["warn", { singleline: "consistent", multiline: "always" }],
      "vue/max-attributes-per-line": ["warn", { singleline: 3 }]
    }
  },
  prettier
];
