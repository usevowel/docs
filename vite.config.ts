/**
 * Vite configuration for Cloudflare Worker
 * 
 * This config is used by wrangler deploy to bundle the worker.
 * 
 * Based on Cloudflare Vite plugin best practices:
 * - The plugin automatically detects and bundles worker.ts from wrangler.toml
 * - Only enabled when building the worker (detected by WRANGLER environment or specific build)
 * - VitePress uses its own config in .vitepress/config.ts and shouldn't pick this up
 */
import { defineConfig } from 'vite'

export default defineConfig(async ({ command, mode }) => {
  // Only enable Cloudflare plugin when wrangler is running
  // Check for WRANGLER environment variable or when building worker specifically
  const isWranglerBuild = process.env.WRANGLER || (command === 'build' && process.argv.includes('worker.ts'))
  
  const plugins = []
  if (isWranglerBuild) {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    plugins.push(cloudflare())
  }
  
  return {
    plugins,
  }
})
