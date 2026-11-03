import { NextRequest, NextResponse } from 'next/server'

const SOURCE_ORIGIN = 'https://player.yenime.net/anime-src'
const REFERER = 'https://yenime.net'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const anilistId = searchParams.get('anilistId')
  const malId = searchParams.get('malId')
  const episode = searchParams.get('episode') || '1'

  if ((!anilistId && !malId) || (anilistId && malId)) {
    return NextResponse.json({ error: 'Provide exactly one of anilistId or malId.' }, { status: 400 })
  }
  if (!/^\d+$/.test(episode) || (anilistId && !/^\d+$/.test(anilistId)) || (malId && !/^\d+$/.test(malId))) {
    return NextResponse.json({ error: 'IDs and episode must be numeric.' }, { status: 400 })
  }

  const provider = anilistId ? 'ani' : 'mal'
  const id = anilistId || malId
  const upstream = `${SOURCE_ORIGIN}/${provider}/${id}/${episode}`

  try {
    const response = await fetch(upstream, {
      headers: { Referer: REFERER, Origin: REFERER, Accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!response.ok) return NextResponse.json({ error: 'Upstream source unavailable.' }, { status: 502 })
    const payload = await response.json()
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'Access-Control-Allow-Origin': '*' } })
  } catch {
    return NextResponse.json({ error: 'Unable to resolve media sources.' }, { status: 502 })
  }
}
