# Cloudflare Pages Deployment Guide

This documentation site is configured to deploy to Cloudflare Pages at `docs.vowel.to`.

## Configuration Files

- `wrangler.toml` - Cloudflare Pages configuration
- `.node-version` - Specifies Node.js version for build environment

## Deployment Methods

### Method 1: Cloudflare Git Integration (Recommended)

Cloudflare Pages integrates directly with GitHub for automatic deployments.

**Setup:**

1. Connect your repository to Cloudflare Pages:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
   - Click "Create a project" → "Connect to Git"
   - Authenticate with GitHub
   - Select your repository and branch (`main` or `docs`)

2. Configure build settings:
   - **Build command**: `bun run docs:build`
   - **Build output directory**: `.vitepress/dist`
   - **Root directory**: `docs`
   - **Node version**: 20 (matches `.node-version`)

3. Deploy:
   - Save the configuration
   - Cloudflare will trigger a build automatically
   - Subsequent pushes to your branch will auto-deploy

4. Add custom domain:
   - After deployment, go to your Pages project settings
   - Navigate to "Custom domains"
   - Add `docs.vowel.to`
   - Update DNS records as instructed

**Advantages:**
- ✅ No additional configuration needed
- ✅ Automatic deployments on every push
- ✅ Preview deployments for pull requests
- ✅ Native Cloudflare integration

### Method 2: Manual Deployment via Wrangler CLI

1. Install Wrangler (if not already installed):
   ```bash
   bun add -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Build the documentation:
   ```bash
   bun run docs:build
   ```

4. Deploy to Cloudflare Pages:
   ```bash
   wrangler pages deploy .vitepress/dist --project-name=vowel-docs
   ```

## Environment Variables

No environment variables are required for this static documentation site.

## Build Process

The build process runs:
1. `bun run docs:generate-api` - Generates API documentation from TypeDoc
2. `vitepress build` - Builds the VitePress static site

Output is generated in `.vitepress/dist/` directory.

## Custom Domain Setup

After initial deployment:

1. In Cloudflare Pages dashboard, navigate to your project
2. Go to "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter `docs.vowel.to`
5. Cloudflare will provide DNS records to add:
   - Typically a CNAME record pointing to your Pages URL
6. Add the DNS records in your Cloudflare DNS settings for `vowel.to`
7. Wait for DNS propagation (usually a few minutes)

## Troubleshooting

### Build Failures

- Ensure all dependencies are properly listed in `package.json`
- Check that TypeDoc can successfully generate API docs
- Verify Node.js version matches `.node-version`

### 404 Errors

- VitePress generates clean URLs by default
- Cloudflare Pages automatically handles this with proper routing
- If issues persist, check the `ignoreDeadLinks` setting in `.vitepress/config.ts`

### Custom Domain Not Working

- Verify DNS records are correctly configured
- Check that SSL/TLS encryption mode is set to "Full" or "Full (strict)"
- Allow up to 24 hours for DNS propagation (usually much faster)

## Local Preview

To preview the built site locally:

```bash
bun run docs:build
bun run docs:preview
```

This will serve the built site at `http://localhost:4173` (or similar).

