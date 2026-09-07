import "server-only"
import { readCollection, writeCollection } from "./local-json-store"
import { getRedis, USE_LOCAL_DB } from "./upstash-db"

const COLLECTION = "events"
const INDEX_KEY = "events:index"
const RECORD_PREFIX = "event:"

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const GRACE_PERIOD_DAYS = 7

export type EventItem = {
  id: string
  title: string
  location: string
  color: string
  displayDate: string
  eventDate: string | null
  createdAt: string
}

function isExpired(event: EventItem): boolean {
  if (!event.eventDate) return false
  const eventTime = new Date(`${event.eventDate}T00:00:00`).getTime()
  if (Number.isNaN(eventTime)) return false
  return Date.now() > eventTime + GRACE_PERIOD_DAYS * ONE_DAY_MS
}

export async function getEvents(): Promise<EventItem[]> {
  let all: EventItem[]

  if (USE_LOCAL_DB) {
    all = readCollection<EventItem>(COLLECTION)
  } else {
    const redis = getRedis()
    const ids = await redis.zrange<string[]>(INDEX_KEY, 0, -1)
    if (!ids || ids.length === 0) return []
    const raw = await Promise.all(ids.map((id) => redis.get<EventItem>(`${RECORD_PREFIX}${id}`)))
    all = raw.filter((e): e is EventItem => e !== null)
  }

  const active: EventItem[] = []
  let prunedAny = false

  for (const event of all) {
    if (isExpired(event)) {
      prunedAny = true
      if (!USE_LOCAL_DB) {
        const redis = getRedis()
        await redis.del(`${RECORD_PREFIX}${event.id}`)
        await redis.zrem(INDEX_KEY, event.id)
      }
    } else {
      active.push(event)
    }
  }

  if (USE_LOCAL_DB && prunedAny) writeCollection(COLLECTION, active)
  return active
}

export async function upsertEvent(event: EventItem): Promise<EventItem> {
  if (USE_LOCAL_DB) {
    const all = readCollection<EventItem>(COLLECTION)
    const idx = all.findIndex((e) => e.id === event.id)
    if (idx >= 0) all[idx] = event
    else all.unshift(event)
    writeCollection(COLLECTION, all)
    return event
  }
  const redis = getRedis()
  await redis.set(`${RECORD_PREFIX}${event.id}`, event)
  await redis.zadd(INDEX_KEY, { score: new Date(event.createdAt).getTime(), member: event.id })
  return event
}

export async function deleteEvent(id: string) {
  if (USE_LOCAL_DB) {
    writeCollection(COLLECTION, readCollection<EventItem>(COLLECTION).filter((e) => e.id !== id))
    return
  }
  const redis = getRedis()
  await redis.del(`${RECORD_PREFIX}${id}`)
  await redis.zrem(INDEX_KEY, id)
}
