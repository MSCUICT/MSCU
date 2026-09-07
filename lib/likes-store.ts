import "server-only"
import { readCollection, writeCollection } from "./local-json-store"
import { getRedis, USE_LOCAL_DB } from "./upstash-db"

const COLLECTION = "likes"
const PREFIX = "likes:"

type LikeRecord = { slug: string; count: number }

export function normalizeLikeSlug(slug: string): string {
  if (!slug) return slug

  let normalized = slug
  for (let i = 0; i < 4; i++) {
    const next = normalized
    try {
      normalized = decodeURIComponent(normalized)
    } catch {
      break
    }
    if (normalized === next) break
  }

  return normalized
}

export async function getLikeCount(slug: string): Promise<number> {
  const normalized = normalizeLikeSlug(slug)

  if (USE_LOCAL_DB) {
    return readCollection<LikeRecord>(COLLECTION).find((r) => r.slug === normalized)?.count ?? 0
  }
  const redis = getRedis()
  const count = await redis.get<number>(`${PREFIX}${normalized}`)
  return count ?? 0
}

export async function incrementLike(slug: string): Promise<number> {
  const normalized = normalizeLikeSlug(slug)

  if (USE_LOCAL_DB) {
    const all = readCollection<LikeRecord>(COLLECTION)
    const idx = all.findIndex((r) => r.slug === normalized)
    if (idx >= 0) all[idx].count += 1
    else all.push({ slug: normalized, count: 1 })
    writeCollection(COLLECTION, all)
    return all.find((r) => r.slug === normalized)!.count
  }
  const redis = getRedis()
  return redis.incr(`${PREFIX}${normalized}`)
}
