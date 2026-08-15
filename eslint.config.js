import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

// Everything in this repository runs on Node — the UID verifier today, the
// Ponder handlers at M3. Kept deliberately close to the application repo's
// config so a file can move between the two without picking up new complaints.
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", ".ponder/**", "generated/**"],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.node,
    },
  },

  // Must stay last: turns off every rule Prettier already owns.
  prettier,
);
