import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session"

function isConfiguredSecret(value: string | undefined): value is string {
  return !!value && value !== "[SENSITIVE]"
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const expectedUsername = process.env.ADMIN_USERNAME
    const expectedHash = process.env.ADMIN_PASSWORD_HASH

    if (!isConfiguredSecret(expectedUsername) || !isConfiguredSecret(expectedHash)) {
      console.error("ADMIN_USERNAME or ADMIN_PASSWORD_HASH is not set")
      return NextResponse.json(
        {
          error:
            "Admin login is not configured locally. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH in .env.local (use scripts/setup-admin.mjs).",
        },
        { status: 503 }
      )
    }

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const usernameMatches = username === expectedUsername
    const passwordMatches = await bcrypt.compare(password, expectedHash)

    if (!usernameMatches || !passwordMatches) {
      // Deliberately vague — don't reveal which field was wrong.
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    const token = await createAdminSessionToken()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
