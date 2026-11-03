'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, CircleHelp, Code2, Copy, ExternalLink, Film, GitBranch, Globe2, Layers3, Menu, Play, Search, Server, ShieldCheck, Sparkles, Terminal, X } from 'lucide-react'

const sampleSources = [
  { quality: '1080p', audio: 'Japanese', type: 'SUB', active: true },
  { quality: '1080p', audio: 'English', type: 'DUB', active: false },
  { quality: '720p', audio: 'Japanese', type: 'SUB', active: false },
]

const sampleTracks = ['English', 'Arabic', 'French', 'German', 'Italian', 'Portuguese (Brazil)', 'Spanish']

function proxyHlsUrl(url?: string) {
  return url ? `/api/hls?url=${encodeURIComponent(url)}` : ''
}

export default function Page() {
  const [idType, setIdType] = useState<'anilistId' | 'malId'>('anilistId')
  const [id, setId] = useState('154587')
  const [episode, setEpisode] = useState('1')
  const [copied, setCopied] = useState(false)
  const [activeSource, setActiveSource] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const endpoint = useMemo(() => `/api/source?${idType}=${id || '154587'}&episode=${episode || '1'}`, [idType, id, episode])
  const fullEndpoint = `https://your-domain.com${endpoint}`

  async function runRequest() {
    setLoading(true)
    setError('')
    try {
      const result = await fetch(endpoint).then(async r => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error || 'Request failed')
        return body
      })
      setResponse(result)
      document.getElementById('response')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sources')
    } finally {
      setLoading(false)
    }
  }

  function copyEndpoint() {
    navigator.clipboard?.writeText(fullEndpoint)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Streamkit home"><span className="brand-mark"><Film size={16} strokeWidth={2.5} /></span><span>streamkit</span></a>
        <nav className={mobileOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <a className="nav-active" href="#playground">Playground</a><a href="#docs">Docs</a><a href="#status">Status <span className="status-dot" /></a>
        </nav>
        <div className="top-actions"><a className="icon-link" href="https://github.com" aria-label="GitHub"><GitBranch size={17} /></a><a className="docs-btn" href="#docs">Read the docs <ExternalLink size={14} /></a><button className="menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span className="pulse" /> OPEN MEDIA EMBED API</div>
        <h1>Ship the player.<br /><em>Skip the plumbing.</em></h1>
        <p className="hero-copy">One endpoint for anime playback. Resolve AniList or MyAnimeList IDs into<br className="desktop" /> HLS sources, subtitles, and metadata — ready to embed anywhere.</p>
        <div className="hero-pills"><span><ShieldCheck size={14} /> CORS ready</span><span><Server size={14} /> HLS native</span><span><Code2 size={14} /> JSON first</span></div>
      </section>

      <section className="playground-wrap" id="playground">
        <div className="section-label"><span>01</span> TRY IT LIVE</div>
        <div className="playground-grid">
          <div className="panel request-panel">
            <div className="panel-heading"><div><h2>Build your request</h2><p>Pick an ID source and episode to test.</p></div><Terminal size={19} className="muted-icon" /></div>
            <div className="form-stack">
              <label>IDENTIFIER TYPE</label>
              <div className="segmented"><button className={idType === 'anilistId' ? 'selected' : ''} onClick={() => setIdType('anilistId')}><Globe2 size={15} /> AniList ID</button><button className={idType === 'malId' ? 'selected' : ''} onClick={() => setIdType('malId')}><Layers3 size={15} /> MAL ID</button></div>
              <div className="input-grid"><div><label htmlFor="id">{idType === 'anilistId' ? 'ANILIST ID' : 'MAL ID'}</label><input id="id" value={id} onChange={e => setId(e.target.value)} inputMode="numeric" /></div><div><label htmlFor="episode">EPISODE</label><input id="episode" value={episode} onChange={e => setEpisode(e.target.value)} inputMode="numeric" /></div></div>
              <div className="url-preview"><span className="method">GET</span><code>{endpoint}</code><button onClick={copyEndpoint} aria-label="Copy endpoint">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
              <button className="run-button" onClick={runRequest} disabled={loading}><Play size={15} fill="currentColor" /> {loading ? 'Loading sources…' : 'Run request'}</button>{error && <p className="error-note" role="alert">{error}</p>}
            </div>
            <div className="request-note"><CircleHelp size={14} /><span>Requests are proxied with the <code>https://yenime.net</code> referer automatically.</span></div>
          </div>

          <div className="panel response-panel" id="response">
            <div className="panel-heading response-heading"><div><h2>Response preview</h2><p>What your client receives from the endpoint.</p></div><span className="live-badge"><span /> 200 OK</span></div>
            <div className="code-window"><div className="code-top"><span><i /><i /><i /></span><span className="json-label">application/json</span></div><pre><span className="syntax-brace">{'{'}</span>{'\n'}  <span className="syntax-key">&quot;sources&quot;</span>: [<span className="syntax-brace">{'{'}</span>{'\n'}    <span className="syntax-key">&quot;url&quot;</span>: <span className="syntax-string">&quot;https://.../master.m3u8&quot;</span>,{'\n'}    <span className="syntax-key">&quot;type&quot;</span>: <span className="syntax-string">&quot;hls&quot;</span>,{'\n'}    <span className="syntax-key">&quot;quality&quot;</span>: <span className="syntax-number">1080</span>,{'\n'}    <span className="syntax-key">&quot;audio&quot;</span>: <span className="syntax-string">&quot;japanese&quot;</span>,{'\n'}    <span className="syntax-key">&quot;tracks&quot;</span>: [<span className="syntax-string">&quot;English&quot;</span>, <span className="syntax-string">&quot;Arabic&quot;</span>]{'\n'}  <span className="syntax-brace">{' }'}</span>],{'\n'}  <span className="syntax-key">&quot;intro&quot;</span>: <span className="syntax-brace">{'{'}</span> <span className="syntax-key">&quot;start&quot;</span>: <span className="syntax-number">0</span>, <span className="syntax-key">&quot;end&quot;</span>: <span className="syntax-number">89</span> <span className="syntax-brace">{' }'}</span>,{'\n'}  <span className="syntax-key">&quot;outro&quot;</span>: <span className="syntax-brace">{'{'}</span> <span className="syntax-key">&quot;start&quot;</span>: <span className="syntax-number">1460</span>, <span className="syntax-key">&quot;end&quot;</span>: <span className="syntax-number">1549</span> <span className="syntax-brace">{' }'}</span>{'\n'}<span className="syntax-brace">{'  }'}</span></pre></div>
            <div className="response-embed-preview">{proxyHlsUrl(response?.sources?.[activeSource]?.url || response?.sources?.[activeSource]?.file) ? <video controls playsInline src={response.sources[activeSource].url || response.sources[activeSource].file} /> : <div className="response-embed-empty"><Play size={18} /><span>Run a request to load the embed player</span></div>}</div>
            <div className="response-footer"><span><Sparkles size={14} /> <b>tookMs</b> 142</span><span>Updated just now</span></div>
          </div>
        </div>
      </section>

      <section className="player-section" id="player">
        <div className="section-label"><span>02</span> EMBED PLAYER</div>
        <div className="player-layout">
          <div className="video-card"><div className="video-screen">{response?.sources?.[activeSource]?.url ? <video className="live-video" controls playsInline poster={response.image}><source src={response.sources[activeSource].url} type="application/x-mpegURL" />Your browser does not support HLS playback.</video> : <><div className="video-noise" /><div className="video-center"><div className="play-circle"><Play size={23} fill="currentColor" /></div><span>Preview player</span><small>Run a request to load media</small></div></>}<div className="video-topline"><span className="now-playing"><span className="red-dot" /> READY TO PLAY</span><span>1080p · SUB</span></div><div className="video-controls"><span>0:00</span><div className="progress"><i /></div><span>24:18</span><span className="control-spacer" /><span>CC</span><span>⚙</span><span>⛶</span></div></div><div className="player-caption"><div><b>Episode {episode || '1'}</b><span> · ID {id || '154587'}</span></div><span className="caption-chip"><ShieldCheck size={12} /> Referer handled</span></div></div>
          <aside className="source-panel"><div className="source-header"><div><h3>Sources</h3><p>Choose a stream</p></div><span className="source-count">{response?.sources?.length || sampleSources.length}</span></div><div className="source-list">{(response?.sources || sampleSources).map((source: any, index: number) => <button key={source.audio + source.quality} className={activeSource === index ? 'source-row active' : 'source-row'} onClick={() => setActiveSource(index)}><span className="radio">{activeSource === index && <i />}</span><span className="source-info"><b>{source.quality}p</b><span>{source.dub || source.audio}</span></span><span className="source-type">{(source.audio || source.type).toUpperCase()}</span></button>)}</div><div className="subtitle-head"><h3>Subtitles</h3><ChevronDown size={15} /></div><div className="track-list">{(response?.sources?.[activeSource]?.tracks || sampleTracks.map(label => ({ label }))).map((track: any, index: number) => <span key={track.label || track} className={index === 0 ? 'track active' : 'track'}>{track.label || track}{index === 0 && <Check size={12} />}</span>)}</div></aside>
        </div>
      </section>

      <section className="docs-section" id="docs"><div className="section-label"><span>03</span> QUICK START</div><div className="docs-card"><div><h2>Built for the<br /><em>modern stack.</em></h2><p>Drop a player into any project with a single URL. No SDK, no auth, no setup.</p><a href="#playground" className="outline-btn">View API reference <ExternalLink size={14} /></a></div><div className="install-block"><div className="install-tabs"><span className="tab-active">HTML</span><span>React</span><span>iframe</span></div><pre><span className="syntax-tag">&lt;iframe</span>{'\n'}  <span className="syntax-key">src</span>=<span className="syntax-string">&quot;{fullEndpoint}&quot;</span>{'\n'}  <span className="syntax-key">allow</span>=<span className="syntax-string">&quot;fullscreen&quot;</span>{'\n'}  <span className="syntax-tag">/&gt;</span></pre></div></div></section>

      <footer id="status"><div className="brand"><span className="brand-mark"><Film size={14} /></span><span>streamkit</span></div><span className="footer-copy">A tiny API for a world of stories.</span><span className="footer-status"><span className="status-dot" /> All systems operational</span></footer>
    </main>
  )
}
