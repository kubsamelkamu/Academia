import { NextResponse, type NextRequest } from "next/server"

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function POST(request: NextRequest) {
  const upstreamBase = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!upstreamBase) {
    return NextResponse.json(
      { success: false, message: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const upstreamUrl = `${upstreamBase}/invitations/accept`

  const upstreamRes = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  })

  const text = await upstreamRes.text()
  const json = text ? tryParseJson(text) : null

  return NextResponse.json(json, { status: upstreamRes.status })
}
