import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
}, {
  ignores: ["node_modules/**", "**/.next/**", "**/.open-next/**", "twilight-block-e1cd/**", "out/**", "build/**", "**/next-env.d.ts", "**/cloudflare-env.d.ts", ".agents/**", "apps/admin/**", "apps/site/postcss.config.mjs", "TEMP/**"]
}];

export default eslintConfig;
