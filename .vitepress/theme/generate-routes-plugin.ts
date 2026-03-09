/**
 * Vite Plugin: Generate Routes Manifest
 * 
 * Automatically scans all markdown files and generates a route manifest
 * for the Vowel voice agent to use for navigation.
 */

import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface RouteInfo {
  path: string
  description: string
  title?: string
}

/**
 * Extract title and description from markdown file
 */
function extractMetadata(filePath: string): { title: string; description: string } {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Extract frontmatter title
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  let title = ''
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/)
    if (titleMatch) {
      title = titleMatch[1]
    }
  }
  
  // Fallback to first h1 heading
  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) {
      title = h1Match[1]
    }
  }
  
  // Extract first paragraph as description
  let description = title
  const paragraphMatch = content.match(/^[^#\n].*$/m)
  if (paragraphMatch) {
    description = paragraphMatch[0].trim().slice(0, 100)
  }
  
  return { title, description }
}

/**
 * Convert file path to URL path
 */
function filePathToUrl(filePath: string, docsDir: string): string {
  let relativePath = path.relative(docsDir, filePath)
  
  // Remove .md extension
  relativePath = relativePath.replace(/\.md$/, '')
  
  // Convert index to root
  if (relativePath === 'index') {
    return '/'
  }
  
  // Remove /index from paths
  relativePath = relativePath.replace(/\/index$/, '')
  
  // Add leading slash and .html extension
  return `/${relativePath}.html`
}

export function generateRoutesPlugin(): Plugin {
  return {
    name: 'vowel-generate-routes',
    
    async buildStart() {
      // Get docs root directory (go up from theme folder)
      const docsDir = path.resolve(__dirname, '..', '..')
      
      console.log('📂 Scanning for markdown files in:', docsDir)
      
      // Find all markdown files
      const markdownFiles = await glob('**/*.md', {
        cwd: docsDir,
        ignore: ['**/node_modules/**', '**/.vitepress/**', '**/README.md'],
        absolute: true
      })
      
      console.log(`📄 Found ${markdownFiles.length} markdown files`)
      
      const routes: RouteInfo[] = []
      
      for (const file of markdownFiles) {
        const { title, description } = extractMetadata(file)
        const urlPath = filePathToUrl(file, docsDir)
        
        routes.push({
          path: urlPath,
          description: title ? `${title} - ${description}` : description,
          title
        })
      }
      
      // Sort routes by path for consistency
      routes.sort((a, b) => a.path.localeCompare(b.path))
      
      // Generate the routes file
      const routesFileContent = `/**
 * Auto-generated route manifest for Vowel voice navigation
 * Generated at build time by scanning all markdown files
 * DO NOT EDIT MANUALLY - this file is regenerated on each build
 */

export interface VowelRoute {
  path: string
  description: string
  title?: string
}

export const ROUTES: VowelRoute[] = ${JSON.stringify(routes, null, 2)}

export function getRoutes(): VowelRoute[] {
  return ROUTES
}

export function getRouteByPath(path: string): VowelRoute | undefined {
  return ROUTES.find(r => r.path === path || r.path === path + '.html' || r.path + '.html' === path)
}
`
      
      const outputPath = path.resolve(__dirname, 'routes-manifest.ts')
      fs.writeFileSync(outputPath, routesFileContent, 'utf-8')
      
      console.log(`✅ Generated ${routes.length} routes for voice navigation`)
    }
  }
}

