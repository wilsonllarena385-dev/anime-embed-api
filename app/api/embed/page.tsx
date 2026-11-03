'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'

type Source = { url?: string; file?: string; quality?: string | number; audio?: string; dub?: string; type?: string }
type Payload = { sources?: Source[]; image?: string; title?: string; error?: string }

export default function EmbedPage() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const params = useMemo(() => typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search), [])
  const id = params.get('anilistId') || params.get('malId')
  const episode = params.get('episode') || '1'

  useEffect(() => {
    if (!id || (params.get('anilistId') && params.get('malId'))) {
      setError('Provide exactly one of anilistId or malId.')
      return
    }
    const query = new URLSearchParams()
    query.set(params.get('anilistId') ? 'anilistId' : 'malId', id)
    query.set('episode', episode)
    fetch(`/api/source?${query}`)
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Unable to load media')
        setPayload(body)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load media'))
  }, [id, episode, params])

  const sources = payload?.sources || []
  const source = sources[active]
  const videoUrl = source?.url || source?.file

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl
      return
    }
    if (!Hls.isSupported()) return
    const hls = new Hls({ enableWorker: true })
    hls.loadSource(videoUrl)
    hls.attachMedia(video)
    return () => hls.destroy()
  }, [videoUrl])

  if (error) return <main className="embed-error"><strong>Stream unavailable</strong><span>{error}</span></main>
  if (!videoUrl) return <main className="embed-loading"><div className="embed-spinner" /><span>Loading stream…</span></main>

  return (
    <main className="embed-shell">
      <div className="embed-player">
        <video key={videoUrl} ref={videoRef} controls autoPlay playsInline poster={payload?.image} />
        <div className="embed-meta"><span>{payload?.title || `Episode ${episode}`}</span><span>{source?.quality ? `${source.quality}p` : 'HLS'} · {source?.dub || source?.audio || 'SUB'}</span></div>
      </div>
      {sources.length > 1 && <div className="embed-sources" aria-label="Stream sources">{sources.map((item, index) => <button key={`${item.url || item.file}-${index}`} className={index === active ? 'active' : ''} onClick={() => setActive(index)}>{item.quality ? `${item.quality}p` : 'Source'} · {item.dub || item.audio || item.type || 'HLS'}</button>)}</div>}
    </main>
  )
}
