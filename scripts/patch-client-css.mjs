import { readFileSync, writeFileSync, readdirSync, realpathSync } from 'fs'
import { resolve } from 'path'

// Resolve from docs project root upward to workspace root where node_modules lives.
// In a monorepo, node_modules/@vowel.to/client is typically a symlink to ../../client.
const searchDirs = [
  resolve(process.cwd(), 'node_modules', '@vowel.to', 'client', 'dist', 'client'),
  resolve(process.cwd(), '..', 'node_modules', '@vowel.to', 'client', 'dist', 'client'),
]

let CLIENT_DIR = null
for (const d of searchDirs) {
  try {
    const real = realpathSync(d)
    readdirSync(real)
    CLIENT_DIR = real
    break
  } catch { /* continue */ }
}
if (!CLIENT_DIR) {
  console.error('Could not find @vowel.to/client/dist/client in node_modules')
  process.exit(1)
}
console.log(`Patching @vowel.to/client at: ${CLIENT_DIR}`)

const R2WC_REPLACEMENT = '/* ssr-patch: r2wc is browser-only (uses HTMLElement at module level) */ var r2wc = function(Component, opts) { return Component; };'

const files = readdirSync(CLIENT_DIR).filter(f => f.endsWith('.js') || f.endsWith('.mjs'))
let patched = 0

for (const file of files) {
  const filepath = resolve(CLIENT_DIR, file)
  let content = readFileSync(filepath, 'utf-8')
  const original = content

  content = content.replace(/import\s+['"]\.\/style\.css['"];?\n?/g, '')

  content = content.replace(
    /import\s+r2wc\s+from\s+['"]@r2wc\/react-to-web-component['"];?/g,
    R2WC_REPLACEMENT
  )

  if (content !== original) {
    writeFileSync(filepath, content)
    patched++
    console.log(`  Patched: ${file}`)
  }
}

if (patched > 0) {
  console.log(`\nPatched ${patched} file(s) - CSS import removed, r2wc SSR-guarded.`)
} else {
  console.log('No patches needed.')
}