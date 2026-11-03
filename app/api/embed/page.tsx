'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'

type Source = { url?: string; file?: string; quality?: string | number; audio?: string; dub?: string; type?: string }
type Payload = { sources?: Source[]; image?: string; title?: string; error?: string }

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function EmbedPage() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
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
    console.log('[v0] embed source lookup', { id, episode, provider: params.get('anilistId') ? 'anilist' : 'mal' })
    fetch(`/api/source?${query}`)
      .then(async (response) => {
        const body = await response.json()
        console.log('[v0] embed source response', { status: response.status, ok: response.ok, sourceCount: body.sources?.length || 0 })
        if (!response.ok) throw new Error(body.error || 'Unable to load media')
        setPayload(body)
      })
      .catch((reason) => {
        console.error('[v0] embed source lookup failed', reason)
        setError(reason instanceof Error ? reason.message : 'Unable to load media')
      })
  }, [id, episode, params])

  const sources = payload?.sources || []
  const source = sources[active]
  const sourceUrl = source?.url || source?.file
  const videoUrl = sourceUrl ? `/api/hls?url=${encodeURIComponent(sourceUrl)}` : ''

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    console.log('[v0] video source selected', { url: videoUrl, nativeHls: Boolean(video.canPlayType('application/vnd.apple.mpegurl')), hlsSupported: Hls.isSupported() })
    const onVideoError = () => console.error('[v0] video error', video.error)
    video.addEventListener('error', onVideoError)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl
      video.addEventListener('loadedmetadata', () => console.log('[v0] native HLS metadata loaded'))
      return () => {
        video.removeEventListener('error', onVideoError)
        video.removeAttribute('src')
      }
    }
    if (!Hls.isSupported()) {
      console.error('[v0] HLS is not supported in this browser')
      return () => video.removeEventListener('error', onVideoError)
    }
    const hls = new Hls({ enableWorker: true })
    hls.on(Hls.Events.MANIFEST_LOADING, (_event, data) => console.log('[v0] HLS manifest loading', data.url))
    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => console.log('[v0] HLS manifest parsed', { levels: data.levels.length }))
    hls.on(Hls.Events.ERROR, (_event, data) => console.error('[v0] HLS error', { type: data.type, details: data.details, fatal: data.fatal, url: data.url }))
    video.addEventListener('loadedmetadata', () => console.log('[v0] HLS metadata loaded'))
    video.addEventListener('canplay', () => console.log('[v0] video can play'))
    hls.loadSource(videoUrl)
    hls.attachMedia(video)
    return () => {
      video.removeEventListener('error', onVideoError)
      hls.destroy()
    }
  }, [videoUrl])

  if (error) return <main className="embed-error"><strong>Stream unavailable</strong><span>{error}</span></main>
  if (!videoUrl) return <main className="embed-loading"><div className="embed-spinner" /><span>Loading stream…</span></main>

  return (
    <main className="embed-shell">
      <div className="embed-player">
        <div className="embed-video-wrap">
          <video key={videoUrl} ref={videoRef} autoPlay playsInline poster={payload?.image} onClick={() => { const video = videoRef.current; if (!video) return; video.paused ? video.play() : video.pause() }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} />
          <div className="embed-title-overlay"><strong>{payload?.title || 'Now playing'}</strong><span>Episode {episode}</span></div>
          <div className="embed-controls" aria-label="Player controls">
            <span className="embed-time">{formatTime(currentTime)}</span>
            <input className="embed-progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => { const next = Number(event.target.value); setCurrentTime(next); if (videoRef.current) videoRef.current.currentTime = next }} aria-label="Seek video" />
            <span className="embed-time">{formatTime(duration)}</span>
            <div className="embed-language-controls" aria-label="Audio language">
              {sources.map((item, index) => <button key={`${item.url || item.file}-${index}`} className={index === active ? 'active' : ''} type="button" onClick={() => setActive(index)}>{item.dub || item.audio || item.type || 'SUB'}</button>)}
            </div>
            <button className="embed-control-button" type="button" onClick={() => { const video = videoRef.current; if (video) video.muted = !video.muted }} aria-label="Toggle captions">CC</button>
            <button className="embed-control-button" type="button" onClick={() => { const video = videoRef.current; if (!video) return; video.paused ? video.play() : video.pause() }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '||' : '▶'}</button>
            <button className="embed-control-button" type="button" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Fullscreen">↗</button>
          </div>
        </div>
      </div>
    </main>
  )
}
