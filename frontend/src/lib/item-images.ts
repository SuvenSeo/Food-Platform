type ImageCandidate = {
  image_url?: string | null
  display_name?: string | null
  canonical_name?: string | null
  item_name?: string | null
  category?: string | null
  brand?: string | null
}

function slugify(value?: string | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function tokens(value: string) {
  return new Set(value.split('-').filter((part) => part.length > 2))
}

function hasTokenMatch(left: string, right: string) {
  const leftTokens = tokens(left)
  const rightTokens = tokens(right)
  if (!leftTokens.size || !rightTokens.size) return false
  return Array.from(leftTokens).every((token) => rightTokens.has(token))
}

export function bestItemImage(
  itemName?: string | null,
  candidates: ImageCandidate[] = [],
  primary?: string | null,
) {
  if (primary) return primary

  const itemSlug = slugify(itemName)
  if (!itemSlug) return null

  for (const candidate of candidates) {
    if (!candidate.image_url) continue
    const names = [candidate.display_name, candidate.canonical_name, candidate.item_name].map(slugify).filter(Boolean)
    if (names.some((name) => name === itemSlug || name.includes(itemSlug) || itemSlug.includes(name))) {
      return candidate.image_url
    }
  }

  for (const candidate of candidates) {
    if (!candidate.image_url) continue
    const names = [candidate.display_name, candidate.canonical_name, candidate.item_name].map(slugify).filter(Boolean)
    if (names.some((name) => hasTokenMatch(itemSlug, name))) {
      return candidate.image_url
    }
  }

  return null
}
