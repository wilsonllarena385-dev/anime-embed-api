import { NextRequest, NextResponse } from "next/server"

const REFERER = "https://yenime.net"
const ALLOWED_HOSTS = new Set(["proxy2.neonflix.st", "proxy.neonflix.st", "player.yenime.net"])

function proxiedUrl(value: string, base: string) {
  const absolute = new URL(value, base)
  if (!ALLOWED_HOSTS.has(absolute.hostname)) return value
  return `/api/hls?url=${encodeURIComponent(absolute.toString())}`
}

function rewriteManifest(manifest: string, sourceUrl: string) {
  return manifest
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#EXT-X-KEY") === false && trimmed.startsWith("#")) return line
      if (trimmed.startsWith("#EXT-X-KEY") || trimmed.includes('URI="')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${proxiedUrl(uri, sourceUrl)}"`)
      }
      if (trimmed.startsWith("#")) return line
      return proxiedUrl(trimmed, sourceUrl)
    })
    .join("\n")
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")
  if (!rawUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let upstreamUrl: URL
  try {
    upstreamUrl = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(upstreamUrl.hostname)) {
    return NextResponse.json({ error: "Host is not allowed" }, { status: 403 })
  }

  console.log("[v0] hls proxy request", { url: upstreamUrl.toString() })
  const response = await fetch(upstreamUrl, {
    headers: { Referer: REFERER, Origin: REFERER, "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  })

  if (!response.ok) {
    console.error("[v0] hls proxy upstream failure", { status: response.status, url: upstreamUrl.toString() })
    return new NextResponse("Upstream HLS request failed", { status: response.status })
  }

  const contentType = response.headers.get("content-type") ?? ""
  const isManifest = contentType.includes("mpegurl") || upstreamUrl.pathname.endsWith(".m3u8")
  if (!isManifest) {
    return new NextResponse(response.body, {
      headers: { "Content-Type": contentType || "video/mp2t", "Cache-Control": "no-store" },
    })
  }

  const manifest = rewriteManifest(await response.text(), upstreamUrl.toString())
  console.log("[v0] hls manifest proxied", { url: upstreamUrl.toString(), bytes: manifest.length })
  return new NextResponse(manifest, {
    headers: { "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  })
}
