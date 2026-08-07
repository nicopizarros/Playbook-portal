import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // `.claude/**` holds vendored agent tooling (the Claude SEO plugin's
    // hooks and runtime, added 2026-08-06) plus the publish skills' prose —
    // third-party code held to its own upstream conventions, exactly the
    // reason `vendor/**` is here. It isn't shipped to the browser and
    // `next build` never lints it, so `eslint .` was the only thing that
    // saw it: one CommonJS `require()` in the SEO plugin's Python launcher
    // turned CI red on every push from 2026-08-06 onward while Vercel kept
    // deploying green, which is precisely the split that let the real
    // 2026-08-07 build break hide in an already-failing check.
    ignores: ['legacy/**', '.next/**', 'node_modules/**', 'next-env.d.ts', 'drizzle/**', 'vendor/**', '.claude/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
