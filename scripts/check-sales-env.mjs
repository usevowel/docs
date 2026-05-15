/**
 * Ensures `.env.sales` exists and defines a non-empty `VITE_VOWEL_APP_ID` before
 * `deploy:sales` runs Vite (build-time embedding of hosted credentials).
 *
 * @returns {never | void}
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.sales')

if (!existsSync(envPath)) {
  console.error(
    'deploy:sales: missing .env.sales — copy docs/.env.sales.example and set VITE_VOWEL_APP_ID.',
  )
  process.exit(1)
}

const text = readFileSync(envPath, 'utf8')
if (!/^VITE_VOWEL_APP_ID=\S+/m.test(text)) {
  console.error(
    'deploy:sales: .env.sales must set VITE_VOWEL_APP_ID to a non-empty value (no quotes needed).',
  )
  process.exit(1)
}
