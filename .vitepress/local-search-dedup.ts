/**
 * VitePress local search uses MiniSearch. Document IDs are `path#anchor`.
 * Duplicate `anchor` values in the HTML (or re-indexing the same page without
 * discarding a prior add) make MiniSearch throw. This wraps VitePress's default
 * split logic and merges sections that share the same `anchor` so indexing stays stable.
 * @see https://github.com/lucaong/minisearch/blob/master/src/MiniSearch.ts
 */

const headingRegex = /<h(\d*).*?>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentRegex = /(.*?)<a.*? href="#(.*?)".*?>.*?<\/a>/i

function clearHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

function getSearchableText(content: string): string {
  return clearHtmlTags(content)
}

/**
 * @internal Mirrors VitePress default `splitPageIntoSections` (same regex/loop).
 */
function* splitPageIntoSections(
  html: string
): Generator<{ anchor: string; titles: string[]; text: string }> {
  const result = html.split(headingRegex)
  result.shift()
  let parentTitles: string[] = []
  for (let i = 0; i < result.length; i += 3) {
    const level = parseInt(result[i] ?? '0', 10) - 1
    const heading = result[i + 1] ?? ''
    const content = result[i + 2] ?? ''
    const headingResult = headingContentRegex.exec(heading)
    const title = clearHtmlTags(headingResult?.[1] ?? '').trim()
    const anchor = headingResult?.[2] ?? ''
    if (!title || !content) continue
    let titles = parentTitles.slice(0, level)
    titles[level] = title
    titles = titles.filter(Boolean) as string[]
    yield { anchor, titles, text: getSearchableText(content) }
    if (level === 0) {
      parentTitles = [title]
    } else {
      parentTitles[level] = title
    }
  }
}

/**
 * Yields the same structure as the default implementation, but merges
 * duplicate `anchor` values by concatenated searchable `text` (keeps the first
 * `titles` chain for that anchor).
 */
export function* splitPageIntoSectionsDeduplicated(
  html: string
): Generator<{ anchor: string; titles: string[]; text: string }> {
  const merged = new Map<
    string,
    { anchor: string; titles: string[]; parts: string[] }
  >()

  for (const section of splitPageIntoSections(html)) {
    const mergeKey = section.anchor || '\0__no_anchor__\0'
    const existing = merged.get(mergeKey)
    if (existing) {
      existing.parts.push(section.text)
    } else {
      merged.set(mergeKey, {
        anchor: section.anchor,
        titles: section.titles,
        parts: [section.text]
      })
    }
  }

  for (const { anchor, titles, parts } of merged.values()) {
    yield { anchor, titles, text: parts.join('\n\n') }
  }
}
