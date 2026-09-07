import { NextRequest, NextResponse } from "next/server"
import { getLikeCount, incrementLike, normalizeLikeSlug } from "@/lib/likes-store"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = normalizeLikeSlug(slug)
  const count = await getLikeCount(normalized)
  return NextResponse.json({ count })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = normalizeLikeSlug(slug)
  const count = await incrementLike(normalized)
  return NextResponse.json({ count })
}
