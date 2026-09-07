import "server-only"
import { Redis } from "@upstash/redis"

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

function hasValidRedisConfig(url?: string, token?: string) {
  if (!url || !token) return false
  if (url.includes("$") || token.includes("$")) return false
  return url.startsWith("https://") || url.startsWith("rediss://")
}

export const USE_LOCAL_DB = !hasValidRedisConfig(redisUrl, redisToken)

const redisClient = USE_LOCAL_DB ? null : new Redis({ url: redisUrl, token: redisToken })

export function getRedis() {
  if (!redisClient) {
    throw new Error("Upstash Redis is not configured")
  }
  return redisClient
}