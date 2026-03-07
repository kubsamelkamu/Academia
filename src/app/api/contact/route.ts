import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const upstreamBase = process.env.NEXT_PUBLIC_API_BASE_URL

    if (!upstreamBase) {
      return NextResponse.json(
        { message: 'Contact service is not configured. Set NEXT_PUBLIC_API_BASE_URL.' },
        { status: 500 }
      )
    }

    const upstreamUrl = `${upstreamBase.replace(/\/$/, '')}/contact`

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') ?? ''
    const parsed = tryParseJson(text)

    if (contentType.includes('application/json') && parsed !== null) {
      return NextResponse.json(parsed, {
        status: upstream.status,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    if (!upstream.ok) {
      const fallbackMessage =
        upstream.status === 503
          ? 'Service is temporarily unavailable. Please try again later.'
          : 'Failed to submit contact form'

      return NextResponse.json({ message: fallbackMessage }, { status: upstream.status })
    }

    return NextResponse.json({ message: 'Contact form submitted successfully' }, { status: upstream.status })
  } catch {
    return NextResponse.json({ message: 'Failed to submit contact form' }, { status: 500 })
  }
}
