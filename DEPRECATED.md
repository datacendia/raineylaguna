# raineylaguna — DEPRECATED

**Status:** Superseded by [`datacendia/raineylaguna-next`](https://github.com/datacendia/raineylaguna-next) as of 2026-05-10.

## What this repo is

The original hand-built static HTML version of **raineylaguna.com** —
plain `.html` files, custom Node check scripts (`scripts/check-*.mjs`),
and a Vercel deployment config (`vercel.json`).

## Why it's frozen

`raineylaguna-next` is the active codebase. It is a Next.js 16 app
running on Railway and replaces every page in this repo with a
React/TypeScript equivalent. New features (Sereno brief generator,
audit tool, Turnstile-protected forms, EN/ES locale toggle, animated
sky + lagoon shader) only exist there.

## What to do with this repo

**For the maintainer:**

1. Verify DNS for `raineylaguna.com` (and the `www` subdomain) points
   at the `raineylaguna-next` deployment, not at the Vercel project
   backing this repo.
2. Once confirmed in production, archive this repository on GitHub
   (Settings → General → Archive). That makes it read-only and
   removes it from default search results without losing history.
3. The Vercel project for this repo can then be paused or deleted.

**For anyone else who finds this repo:**

- Don't open PRs here. They will not be merged.
- Issues filed here will not be triaged. Use
  [`raineylaguna-next/issues`](https://github.com/datacendia/raineylaguna-next/issues)
  instead.

## Cross-references

- Active site repo: [`datacendia/raineylaguna-next`](https://github.com/datacendia/raineylaguna-next)
- Sister brand site (still active, separate project):
  [`datacendia/raineylagunastudios`](https://github.com/datacendia/raineylagunastudios)
- Stack-wide conventions: `rainey-stack/CONVENTIONS.md`

Last commit before deprecation: `7e6df5d` (2026-05).
