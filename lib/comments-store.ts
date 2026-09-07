import "server-only"
import { randomUUID } from "crypto"
import { readCollection, writeCollection } from "./local-json-store"
import { getRedis, USE_LOCAL_DB } from "./upstash-db"

const COLLECTION = "comments"
const RECORD_PREFIX = "comment:"
const PER_POST_INDEX_PREFIX = "comments:index:" // sorted set per slug
const ALL_INDEX_KEY = "comments:all" // sorted set across every slug, for the admin list

export type Comment = {
  id: string
  slug: string
  name: string
  text: string
  editToken: string // only ever sent to the client once, at creation — never included in list responses
  createdAt: string
  updatedAt: string | null
}

// What gets sent to the public comment list / admin list — editToken stripped.
export type PublicComment = Omit<Comment, "editToken">

function stripToken(comment: Comment): PublicComment {
  const { editToken, ...rest } = comment
  return rest
}

function sortByDate(comments: PublicComment[]): PublicComment[] {
  return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

// Comments for a single post, oldest first — for public display.
export async function getComments(slug: string): Promise<PublicComment[]> {
  let comments: Comment[]

  if (USE_LOCAL_DB) {
    comments = readCollection<Comment>(COLLECTION).filter((c) => c.slug === slug)
  } else {
    const redis = getRedis()
    const ids = await redis.zrange<string[]>(`${PER_POST_INDEX_PREFIX}${slug}`, 0, -1)
    if (!ids || ids.length === 0) return []
    const raw = await Promise.all(ids.map((id) => redis.get<Comment>(`${RECORD_PREFIX}${id}`)))
    comments = raw.filter((c): c is Comment => c !== null)
  }

  return sortByDate(comments.map(stripToken))
}

// Every comment across every post, newest first — for the admin/moderation list.
export async function getAllComments(): Promise<PublicComment[]> {
  let comments: Comment[]

  if (USE_LOCAL_DB) {
    comments = readCollection<Comment>(COLLECTION)
  } else {
    const redis = getRedis()
    const ids = await redis.zrange<string[]>(ALL_INDEX_KEY, 0, -1, { rev: true })
    if (!ids || ids.length === 0) return []
    const raw = await Promise.all(ids.map((id) => redis.get<Comment>(`${RECORD_PREFIX}${id}`)))
    comments = raw.filter((c): c is Comment => c !== null)
  }

  return comments.map(stripToken).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Returns the full record including editToken — only used right after
// creation, so the API route can hand the token back to its author once.
export async function addComment(input: { slug: string; name: string; text: string }): Promise<Comment> {
  const comment: Comment = {
    id: randomUUID(),
    slug: input.slug,
    name: input.name,
    text: input.text,
    editToken: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: null,
  }

  if (USE_LOCAL_DB) {
    const all = readCollection<Comment>(COLLECTION)
    all.unshift(comment)
    writeCollection(COLLECTION, all)
    return comment
  }

  const redis = getRedis()
  await redis.set(`${RECORD_PREFIX}${comment.id}`, comment)
  await redis.zadd(`${PER_POST_INDEX_PREFIX}${comment.slug}`, { score: Date.now(), member: comment.id })
  await redis.zadd(ALL_INDEX_KEY, { score: Date.now(), member: comment.id })
  return comment
}

type UpdateResult =
  | { ok: true; comment: PublicComment }
  | { ok: false; reason: "not_found" | "forbidden" }

// editToken omitted or mismatched => forbidden (used for the self-service edit flow only).
export async function updateComment(id: string, text: string, editToken: string): Promise<UpdateResult> {
  if (USE_LOCAL_DB) {
    const all = readCollection<Comment>(COLLECTION)
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) return { ok: false, reason: "not_found" }
    if (all[idx].editToken !== editToken) return { ok: false, reason: "forbidden" }
    all[idx] = { ...all[idx], text, updatedAt: new Date().toISOString() }
    writeCollection(COLLECTION, all)
    return { ok: true, comment: stripToken(all[idx]) }
  }

  const redis = getRedis()
  const comment = await redis.get<Comment>(`${RECORD_PREFIX}${id}`)
  if (!comment) return { ok: false, reason: "not_found" }
  if (comment.editToken !== editToken) return { ok: false, reason: "forbidden" }
  const updated: Comment = { ...comment, text, updatedAt: new Date().toISOString() }
  await redis.set(`${RECORD_PREFIX}${id}`, updated)
  return { ok: true, comment: stripToken(updated) }
}

// editToken omitted => admin/moderator delete (always allowed).
// editToken provided => self-service delete (must match).
export async function deleteComment(id: string, editToken?: string): Promise<boolean> {
  if (USE_LOCAL_DB) {
    const all = readCollection<Comment>(COLLECTION)
    const existing = all.find((c) => c.id === id)
    if (!existing) return false
    if (editToken && existing.editToken !== editToken) return false
    writeCollection(COLLECTION, all.filter((c) => c.id !== id))
    return true
  }

  const redis = getRedis()
  const existing = await redis.get<Comment>(`${RECORD_PREFIX}${id}`)
  if (!existing) return false
  if (editToken && existing.editToken !== editToken) return false
  await redis.del(`${RECORD_PREFIX}${id}`)
  await redis.zrem(`${PER_POST_INDEX_PREFIX}${existing.slug}`, id)
  await redis.zrem(ALL_INDEX_KEY, id)
  return true
}
