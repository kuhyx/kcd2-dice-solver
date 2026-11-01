# Migrate kcd2-dice-solver to Astro (no React)

## what
The live solver at dice.kuhy.duckdns.org has an inventory editor, a badge
picker, a Web Worker search and a result panel, plus a generated
`how-it-works/` page and the AgentReady files. It becomes Astro 7 static
output. The solver page's script and custom elements are vanilla TS. The
`src/site` generator becomes Astro pages and endpoints. `src/core/` and the
worker are already framework-free and stay.

## steps
1. Do `~/src/utils/web_ui/TODO-astro-port.md` first. Then add `@kuhyx/web-ui`
   at the new tag, for `tokens.css` only.
2. Pages, built from `src/site/pages.ts` (the route source of truth):
   - `src/pages/index.astro` is the solver, with prerendered intro text (no-JS
     content, from `homePage.ts`).
   - `src/pages/how-it-works.astro` comes from `howItWorksPage.ts`.
   - `src/pages/404.astro`.
3. AgentReady. Port `src/site/*` (`build.ts`, `discovery.ts`,
   `renderMarkdown.ts` and `siteConfig.ts` with `ORIGIN`) into endpoints:
   `src/pages/robots.txt.ts`, `sitemap.xml.ts`, `llms.txt.ts`,
   `.well-known/ai-catalog.json.ts` and `[...path].md.ts`. Then delete
   `vitePlugin.ts` and `renderHtml.ts`.
4. Rewrite the 7 React files:
   - `App.tsx` becomes `index.astro` plus `<dice-solver>`. It owns the state,
     the `lib/inventoryHash.ts` URL hash sync and `localStorage`.
   - `DiceList`, `DieRow` and `QuantityStepper` become a `<dice-list>` element
     (stepper buttons, keyboard).
   - `BadgePicker` becomes `<badge-picker>`, with `lib/fuzzy.ts` search.
   - `InventoryIo` uses `<dialog>` for import and export, through `lib/inventoryIo.ts`.
   - `ResultPanel` becomes `.astro` with a TS renderer.
   - Hooks `useInventoryState.ts` and `useSolver.ts` become a plain store and a
     worker client. The worker client uses
     `new Worker(new URL('./worker/solver.worker.ts', import.meta.url), { type: 'module' })`
     in the script, which Astro's Vite bundles.
5. Build and deploy:
   - `deploy_build.sh` changes `pnpm exec tsc -b && pnpm exec vite build --outDir dist.staging`
     to `pnpm exec astro check && pnpm exec astro build --outDir dist.staging`.
     Keep the staging-to-swap logic.
   - In `repo-contract.toml`, `[agent_ready].build` becomes
     `pnpm exec astro build --outDir dist.check`.
6. Dependencies, exact pins via pnpm:
   - Add `astro@7.4.4`, `@astrojs/check@0.9.12`, `eslint-plugin-astro@3.2.1`
     and `@testing-library/dom`.
   - Remove `react`, `react-dom`, `@vitejs/plugin-react` and
     `@testing-library/react`.
   - Drop direct `vite`.
7. Tests. Use vitest 5.0.5 with `getViteConfig()`:
   - `src/core/*` tests and `vitest.workers.mjs` stay.
   - The `App*.test.tsx` suites (Links, Prerender, Recovery, Shell, Storage)
     become element tests in jsdom with the fake worker port. Their intent is
     kept: recovery after worker crash, storage, links.
   - Coverage is scoped to `src/**/*.ts`.

## done
Run from the repo root:
`pnpm install --frozen-lockfile && pnpm lint && pnpm coverage && pnpm exec astro build --outDir dist.check && ~/src/utils/agent_ready/check.sh dist dist.check`
Then:
`! grep -q '"react"' package.json && ! grep -qE '"(react-dom|@vitejs/plugin-react)"' package.json && ! find src -name '*.tsx' | grep -q .`
Both exit 0.

## verify
Run `~/src/testsAndMisc/linux_configuration/features/setup_kcd2_dice_solver.sh`,
which serves `dist/` on 127.0.0.1:8089 behind the edge. Then run
`~/src/utils/agent_ready/check.sh url https://dice.kuhy.duckdns.org`.
In a headless chromium at 4K and at mobile size:
- Add dice, pick a badge and solve. The worker returns a result.
- A reload restores the inventory from the hash.
- `/how-it-works/` and the 404 render.

## read first
- `~/src/utils/web_ui/TODO-astro-port.md` (do it first)
- `deploy_build.sh` (why staging), `repo-contract.toml`, `src/site/pages.ts`, `src/site/vitePlugin.ts`
- `src/App.tsx`, `src/hooks/useSolver.ts`, `src/worker/solver.worker.ts`

REMOVE ME AFTER FINISH
