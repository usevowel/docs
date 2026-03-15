import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'api/reference');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function sanitizeMarkdown(content) {
  const lines = content.split('\n');
  let inCodeFence = false;

  return lines
    .map((line) => {
      if (line.startsWith('```')) {
        inCodeFence = !inCodeFence;
        return line;
      }

      if (inCodeFence) {
        return line;
      }

      let sanitized = line.replace(/<a id="[^"]+"><\/a>\s*/g, '');
      sanitized = sanitized.replace(/<(\/?)([A-Za-z][A-Za-z0-9-]*)([^>]*)>/g, (_match, slash = '', tag, rest = '') => {
        return `&lt;${slash}${tag}${rest}&gt;`;
      });
      sanitized = sanitized.replace(/\{\{/g, '&#123;&#123;').replace(/\}\}/g, '&#125;&#125;');

      return sanitized;
    })
    .join('\n');
}

async function main() {
  try {
    const rootStats = await stat(root);
    if (!rootStats.isDirectory()) {
      return;
    }
  } catch {
    return;
  }

  const files = await walk(root);

  await Promise.all(files.map(async (file) => {
    const original = await readFile(file, 'utf8');
    const sanitized = sanitizeMarkdown(original);
    if (sanitized !== original) {
      await writeFile(file, sanitized);
    }
  }));
}

await main();
