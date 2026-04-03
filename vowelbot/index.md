# vowelbot

Use `vowelbot` to add vowel to a GitHub repository with a guided onboarding flow at [add.vowel.to](https://add.vowel.to).

## What It Does

vowelbot connects to GitHub, lets you choose a repository, and opens a pull request with the files needed to start using vowel.

It supports web projects built with:

- React
- Vanilla JavaScript
- Web Components

It does not currently support iOS, Android, Flutter, or other non-web app targets.

## Get Started

1. Go to [add.vowel.to](https://add.vowel.to).
2. Click **Add vowel to your project**.
3. Sign in with GitHub and authorize access.
4. Pick the repository you want to integrate.
5. Review the generated pull request and merge it when ready.

## What Happens During Onboarding

During setup, vowelbot:

- creates an onboarding branch in your repository
- adds the workflow needed for future `/vowelbot` commands
- opens a pull request with the initial integration changes

## What Gets Added

The first onboarding pull request typically includes:

- a GitHub Actions workflow for vowelbot-triggered updates
- a setup guide for your team
- integration changes tailored to your project type

## Using vowelbot After Setup

Once the workflow is in your repository, you can use it again by:

- commenting `/vowelbot integrate` in an issue or pull request
- commenting a request with `/vowelbot` in an issue or pull request
- running the workflow manually from the GitHub Actions tab

## Models and Secrets

vowelbot uses free OpenCode models by default, so no API key is required.

If you want to use premium providers, add one of these GitHub secrets:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `OPENCODE_API_KEY`

If you add a secret, vowelbot will use that provider instead of the free default.

## Troubleshooting

- If the workflow fails, rerun it from the GitHub Actions tab.
- If you see a model-related error, try again or add an API key as a fallback.
- If your project is not a web app, vowelbot cannot integrate it yet.
