import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
}, {
  ignores: ["node_modules/**", ".next/**", ".open-next/**", "twilight-block-e1cd/**", "out/**", "build/**", "next-env.d.ts"]
}];

export default eslintConfig;
