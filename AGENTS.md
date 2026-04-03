# AGENTS.md

This file defines the working rules and current information architecture for AI agents editing the public docs in `docs/`.

This file is for contributors and agents only. It is excluded from the published site.

## Current State

The docs site is a public, user-facing product documentation site for vowel.

The current launch posture is:

- the initial public release is self-hosted first
- hosted platform features are coming soon
- client docs should not imply the hosted platform is generally available today

It is not:

- an internal engineering wiki
- a maintainer README
- a monorepo onboarding document
- a place to explain repository layout

All published pages must read as self-standing documentation for developers using vowel.

## Docs Goals

When editing docs, optimize for these goals:

1. Help external developers understand what vowel is and how to use it.
2. Keep the information architecture product-facing and easy to scan.
3. Separate integration docs, deployment docs, hosted-product docs, recipes, and API reference clearly.
4. Remove maintainer-centric language and internal path leakage.
5. Keep examples practical, realistic, and aligned with public product surfaces.

## Top-Level Structure

The published site currently has six top-level sections:

- `Home`
- `Client`
- `Self-Hosted`
- `vowelbot`
- `Platform`
- `Recipes`
- `API Reference`

### Section Ownership

#### Client

Use this section for:

- SDK installation
- getting started
- quick start
- client concepts
- adapters
- actions
- event notifications
- framework integrations
- connection models

Audience:

- frontend developers
- app developers integrating vowel into web applications

#### Self-Hosted

Use this section for:

- self-hosted overview
- architecture
- Core
- realtime engine
- configuration
- deployment
- troubleshooting

Audience:

- operators
- backend/platform engineers
- teams deploying vowel on their own infrastructure

#### Platform

Use this section for:

- coming-soon hosted platform overview
- coming-soon apps and management
- coming-soon billing and organizations
- hosted realtime API status

Audience:

- developers using or evaluating the hosted product

#### vowelbot

Use this section for:

- GitHub-based onboarding for adding vowel to a repository
- setup flow at `add.vowel.to`
- supported project types
- onboarding PR contents
- post-setup `/vowelbot` usage

Audience:

- developers integrating vowel into an existing GitHub repository

#### Recipes

Use this section for:

- task-oriented examples
- focused implementation patterns
- advanced usage examples once the reader already understands the core concepts

Recipes should solve “how do I do X?” They should not become the canonical home for product concepts.

#### API Reference

Use this section for:

- exact SDK signatures
- generated class, interface, function, and type docs
- hand-written API landing content that points readers to generated output

## Public Docs Rules

### Write For Product Users

Write from the perspective of a developer using vowel.

Do not write from the perspective of:

- a repository maintainer
- an internal platform engineer
- a monorepo contributor

### Do Not Leak Internal Repository Structure

Published docs must not describe the product in terms of internal layout.

Avoid references such as:

- “repo root”
- “workspace”
- “monorepo”
- “submodule”
- repository coordination or branch workflows
- implementation file locations that are only meaningful to contributors

Avoid repository path references in public prose such as:

- `platform/`
- `core/`
- `engine/`
- `client/`
- `docs/`

Exception:

- internal file paths are acceptable inside this `AGENTS.md`
- source-generated API links are acceptable inside generated API reference output

### Use Product Language

Prefer:

- “Client SDK”
- “hosted platform”
- “self-hosted stack”
- “Core”
- “realtime engine”
- “hosted realtime API”

If a hosted feature is not part of the current launch, say that it is “coming soon” clearly and directly.

Avoid internal-only framing or implementation nicknames unless they are explicitly part of the public product language.

### Keep Pages Self-Standing

A public reader should not need access to:

- local repository files
- internal READMEs
- internal plans
- unpublished repositories

If a page tells the reader to consult a local file, it is almost certainly wrong for public docs.

## Compatibility And Routing Rules

The public nav label is `Client`, but existing `/guide/...` routes are intentionally retained.

Keep these compatibility pages in place unless explicitly asked to remove them:

- `/guide/self-hosted-stack`
- `/guide/vowelbot`
- `/guide/hosted-realtime-api`

These compatibility pages should remain short, public-facing pointers to the canonical sections.

## API Reference Rules

The API reference is split into:

- a hand-written landing page at `docs/api/index.md`
- generated reference output under `docs/api/reference/`

Generated API output is regenerated during docs builds.

Important:

- do not hand-edit generated files under `docs/api/reference/`
- if generated content breaks VitePress parsing, fix the generation or sanitization pipeline instead

Current generation flow:

- TypeDoc outputs to `docs/api/reference/`
- `docs/scripts/sanitize-generated-api.mjs` sanitizes generated markdown so VitePress can render it safely

## Excluded Or Internal-Only Docs

Some files may exist in `docs/` for contributor or deployment purposes but are excluded from publish.

Currently excluded examples include:

- `AGENTS.md`
- `README.md`
- `cloudflare-pages.md`
- `guide/v2-api-migration.md`
- legacy generated output under `api/index/**`
- legacy generated output under `api/react/**`

Before adding another excluded file, ask whether it truly belongs in `docs/` or should live elsewhere.

## What Good Public Docs Look Like

Good:

- “Use the hosted platform to configure apps and manage billing.”
- “Use the self-hosted stack when you need your own token service and realtime runtime.”
- “Choose between the hosted `appId` flow and a token-based backend flow.”
- “Use this recipe when you need a server-issued token.”

Bad:

- “This part of the product lives in `platform/` in this workspace.”
- “Run this from the repo root.”
- “See the internal README for implementation details.”
- “This submodule owns the feature.”

## Editing Guidance

When adding or updating content:

1. Put the topic in the correct section.
2. Check whether the page is canonical product documentation or just a recipe.
3. Remove internal-path language.
4. Prefer short, direct prose over internal jargon.
5. Keep examples aligned with public APIs and supported flows.
6. Preserve compatibility routes unless explicitly asked to remove them.

## Contributor Constraint

If a fact is only true about the repository and not true for end users, it does not belong in published docs.
