"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"

function normalizeClientSlug(slug: string) {
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

export default function LikeButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const normalizedSlug = normalizeClientSlug(slug)
  const storageKey = `mscu-liked:${normalizedSlug}`

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === "1")
  }, [storageKey])

  async function handleLike() {
    if (liked || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/likes/${encodeURIComponent(normalizedSlug)}`, { method: "POST" })
      if (!res.ok) {
        throw new Error(`Like request failed: ${res.status}`)
      }
      const data = await res.json()
      setCount(data.count)
      setLiked(true)
      localStorage.setItem(storageKey, "1")
    } catch (error) {
      console.error("Like request failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
        liked
          ? "bg-red-50 text-red-600 cursor-default"
          : "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600"
      }`}
    >
      <Heart className={`w-4 h-4 ${liked ? "fill-red-600" : ""}`} />
      {liked ? "Liked" : "Like this post"} · {count}
    </button>
  )
}
