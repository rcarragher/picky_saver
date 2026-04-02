import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";

export default [
  ...expoConfig,
  prettierConfig,
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "e2e/fixtures/",
      "ralph/",
    ],
  },
];
