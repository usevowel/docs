---
name: vitepress-minisearch
description: >-
  Diagnoses and fixes VitePress local search (MiniSearch) duplicate ID errors, server
  restart failures, and spurious outlines from nested code fences. Use when dev logs
  mention MiniSearch, duplicate ID, or markdown wraps fenced sql/js inside a three-backtick
  outer block.
---

# VitePress local search (MiniSearch) and nested code fences

VitePress’s default theme can use [MiniSearch](https://github.com/lucaong/minisearch) for **local** search (`themeConfig.search.provider: 'local'`). Index entries use a document id: `path#anchor` (e.g. `/Some-Page.html#section-id`). If the same id is added twice, MiniSearch throws:

`MiniSearch: duplicate ID /path.html#some-anchor`

Dev may also log `[vitepress] server restart failed` when indexing breaks during a rebuild or HMR.

## When to apply this skill

- Console shows `MiniSearch: duplicate ID …`
- VitePress reports `server restart failed` right after a local search / index step
- A page’s **outline** is wrong: hundreds of spurious headings, or repeated sections
- Markdown **citations** or long quoted docs use ` ```markdown ` wrappers that also contain ` ```sql `, ` ```javascript `, etc.

## Root causes (typical)

### 1. Nested triple-backtick fences (most common for “corrupt” pages)

In CommonMark, the **first** line that is exactly ` ``` ` (three backticks) **ends** a fenced code block, even if the author meant “start inner sql/js.”

So a three-backtick `markdown` fence that also contains a three-backtick `sql` (or `javascript`) child fence is structurally wrong: the inner opening fence line **ends** the outer code block. Content after the inner block is parsed as real document markdown: headings become real `<h2>`–`<h4>`, which can explode the outline and yield **duplicate** heading anchors in the HTML. Local search may then add the same `path#anchor` more than once.

**Fix:** Use a **longer** outer fence: four or more backticks (or tildes) for the **outer** block so that inner three-backtick `sql` / `javascript` (etc.) blocks stay inside.

**Example:** open the outer citation with *four* backticks and the `markdown` language tag, keep inner blocks at three backticks, then close the outer with *four* backticks on their own line. If you ever need a four-backtick code sample *inside* the block, use *five* backticks for the outer fence so the rule “outer length > any inner length” still holds.

### 2. Re-indexing the same section id (HMR / hot updates)

VitePress’s local-search plugin may call `index.add` for a file on hot update. Depending on version and state, the same `path#anchor` can be added again without a prior remove, which also throws “duplicate ID.”

**Mitigation in this repo:** See `.vitepress/local-search-dedup.ts` and `themeConfig.search.options.miniSearch._splitIntoSections`, which merge sections that share the same `anchor` before they reach MiniSearch. When editing upstream behavior, preserve or reapply an equivalent **deduplicate-by-anchor** step if the error persists.

## Diagnostic checklist

1. **Identify the page** from the error (`/TURSO-BROWSER-RAG.html#…` → `TURSO-BROWSER-RAG.md` in the VitePress `src` root, subject to rewrites).
2. **Grep the markdown** for ` ```markdown` (or ` ```md `) followed later by ` ``` ` + language tag on its own line—those are candidate broken nests.
3. **Confirm in rendered HTML** (or mentally): fences should nest; if “citation” body appears **outside** the intended fence in the final HTML, increase outer fence length.
4. **Duplicate heading text** on one page: two `##` with the same title can slug to the same id; rename one or add an explicit custom heading id in Markdown (if the toolchain supports it).

## Fix order (recommended)

1. **Correct** nested fences (prefer four-backtick **outer** for any block that includes inner ` ```* `).
2. If duplicate-ID errors **remain** and headings look correct, ensure **search section deduplication** is still wired in `.vitepress/config.ts` and not removed during merges.
3. **Restart** the dev server after large `.md` fence edits so the index is rebuilt from a clean state.

## Do not (public docs)

Do not add maintainer-only paths or this skill to **published** user documentation unless the product team wants a public troubleshooting note; keep this workflow in **agent/contributor** skills under `.agents/`.

## Related files in this site

- `.vitepress/config.ts` — `loadEnv`, `search.options.miniSearch._splitIntoSections`, `envDir`
- `.vitepress/local-search-dedup.ts` — default `splitPageIntoSections` logic + merge duplicate anchors
- Example page that required outer ` ```` ` fences: `TURSO-BROWSER-RAG.md` (Citations with embedded SQL/JS)

## References (upstream)

- [Vite — Env and mode](https://vitejs.dev/guide/env-and-mode) — `.env` / `.env.local` loading (relevant to `.vitepress` config using `loadEnv` + `envDir`).
