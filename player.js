/**
 * ═══════════════════════════════════════════════════════════════
 *  MEDIA PLAYER — YouTube Music + Spotify Style
 *  Single-file vanilla JS player. No dependencies.
 *  v1.0
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  "use strict";

  /* ── State ─────────────────────────────────────────────── */
  const S = {
    playing: false,
    expanded: false,
    mode: "audio",          // "audio" | "video"
    mediaUrl: "",
    mediaVideo: "",
    coverUrl: "",
    coverInfo: "",
    title: "",
    detailUrl: "",
    author: "",
    queue: [],
    queueIndex: -1,
    text: "",
    subtitlesUrl: "",
    bgColor: "#111",
    allowDownload: false,
    subtitlesOn: false,
    subtitlesCues: [],
    speed: 1,
    sleepTimer: null,
    sleepMinutes: 0,
    panelOpen: null,        // "queue" | "speed" | "share" | "timer" | null
    duration: 0,
    currentTime: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    seekDragging: false,
  };

  /* ── Helpers ───────────────────────────────────────────── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];
  const ce = (tag, cls, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html) el.innerHTML = html;
    return el;
  };
  const fmt = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hexToRgb = (h) => {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
  };
  const darken = (hex, f) => {
    const [r,g,b] = hexToRgb(hex);
    return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
  };
  const luminance = (hex) => {
    const [r,g,b] = hexToRgb(hex);
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  };
  const textColor = (hex) => luminance(hex) > 0.55 ? "#111" : "#fff";

  /* ── Icons (inline SVG) ────────────────────────────────── */
  const ICO = {
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    next: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
    prev: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
    vol: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.14v7.72A4.5 4.5 0 0016.5 12zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.5 8.5 0 0014 3.23z"/></svg>`,
    volMute: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0014 8.14v2.12l2.45 2.45c.03-.24.05-.48.05-.71zm2.5 0a6.45 6.45 0 01-.57 2.65l1.46 1.46A8.43 8.43 0 0021 12a8.5 8.5 0 00-7-8.77v2.06A6.51 6.51 0 0119 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.46 8.46 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4l-1.88 1.88L12 7.76V4z"/></svg>`,
    expand: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>`,
    collapse: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>`,
    queue: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A3 3 0 1020 17V8h3V6h-6z"/></svg>`,
    speed: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19a2 2 0 001.72 1h13.85a2 2 0 001.74-1 10 10 0 00-.27-10.44z"/><path d="M10.59 15.41a2 2 0 002.83 0l5.66-8.49-8.49 5.66a2 2 0 000 2.83z"/></svg>`,
    timer: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42A10.93 10.93 0 0012 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-2.12-.66-4.08-1.78-5.7l-.19.09zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08a2.91 2.91 0 00-1.96.77L8.91 12.7A3.25 3.25 0 009 12c0-.24-.03-.47-.09-.7l7.05-4.11A2.93 2.93 0 0018 7.92a3 3 0 10-3-3c0 .24.04.47.09.7L8.04 9.74A3 3 0 006 9a3 3 0 000 6c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66 0 1.61 1.31 2.92 2.92 2.92A2.92 2.92 0 0021 19a2.92 2.92 0 00-3-2.92z"/></svg>`,
    subtitle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM4 18V6h16v12H4zm2-2h2v-2H6v2zm0-4h2v-2H6v2zm4 4h8v-2h-8v2zm0-4h8v-2h-8v2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    videoIcon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>`,
    audioIcon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg>`,
    repeat: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
    shuffle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
  };
  const icon = (name, size) => `<span class="mp-ico" style="width:${size||20}px;height:${size||20}px">${ICO[name]||""}</span>`;

  /* ── Build DOM ─────────────────────────────────────────── */
  const CSS = `
  /* Reset scoped */
  #mp-root,.mp-root *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  #mp-root{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;position:fixed;bottom:0;left:0;right:0;z-index:999999;pointer-events:none}
  #mp-root *{pointer-events:auto}
  .mp-ico{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  .mp-ico svg{width:100%;height:100%}

  /* ── Mini bar ────────── */
  .mp-mini{display:none;height:64px;background:#181818;color:#fff;align-items:center;padding:0 12px;gap:10px;position:relative;border-top:1px solid rgba(255,255,255,.08);transition:background .4s}
  .mp-mini.visible{display:flex}
  .mp-mini-cover{width:44px;height:44px;border-radius:6px;object-fit:cover;cursor:pointer;flex-shrink:0}
  .mp-mini-info{flex:1;min-width:0;cursor:pointer}
  .mp-mini-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-mini-author{font-size:11px;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-mini-btn{background:none;border:none;color:inherit;cursor:pointer;padding:6px;border-radius:50%;transition:background .15s}
  .mp-mini-btn:hover{background:rgba(255,255,255,.12)}
  .mp-mini-btn:active{transform:scale(.92)}
  .mp-mini-progress{position:absolute;top:-2px;left:0;right:0;height:3px;background:rgba(255,255,255,.1);cursor:pointer}
  .mp-mini-progress-fill{height:100%;background:#fff;border-radius:0 2px 2px 0;transition:width .25s linear}
  .mp-mini-progress-buf{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.15);pointer-events:none}

  /* ── Expanded view ───── */
  .mp-expanded{position:fixed;bottom:64px;left:0;right:0;top:0;background:#111;color:#fff;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .38s cubic-bezier(.16,1,.3,1),background .5s;overflow:hidden;z-index:999998}
  .mp-expanded.open{transform:translateY(0)}

  /* Top bar */
  .mp-exp-top{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;flex-shrink:0;position:relative;z-index:3}
  .mp-exp-top-btn{background:none;border:none;color:inherit;cursor:pointer;padding:8px;border-radius:50%;transition:background .15s}
  .mp-exp-top-btn:hover{background:rgba(255,255,255,.12)}
  .mp-exp-top-btn:active{transform:scale(.92)}

  /* Content area */
  .mp-exp-content{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:0 24px}
  .mp-exp-cover{max-width:340px;max-height:340px;width:80vw;height:80vw;border-radius:12px;object-fit:cover;box-shadow:0 8px 40px rgba(0,0,0,.5);transition:opacity .3s}
  .mp-exp-video{width:100%;height:100%;object-fit:contain;border-radius:0;background:#000}
  .mp-exp-subs{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);text-align:center;font-size:clamp(18px,4vw,32px);font-weight:700;line-height:1.4;max-width:80%;text-shadow:0 2px 12px rgba(0,0,0,.7);pointer-events:none;transition:opacity .3s}
  .mp-exp-subs.audio-mode{position:relative;bottom:auto;left:auto;transform:none;max-width:90%;padding:32px 24px;font-size:clamp(22px,5vw,40px)}
  .mp-exp-video-subs{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.65);padding:6px 16px;border-radius:6px;font-size:clamp(14px,2.5vw,22px);text-align:center;max-width:80%;pointer-events:none}

  /* Controls */
  .mp-exp-controls{flex-shrink:0;padding:16px 24px 20px;position:relative;z-index:3}
  .mp-exp-info{text-align:center;margin-bottom:12px}
  .mp-exp-title{font-size:18px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-exp-author{font-size:13px;opacity:.65;margin-top:2px}
  .mp-exp-seek{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .mp-exp-seek-time{font-size:11px;opacity:.6;min-width:36px;font-variant-numeric:tabular-nums}
  .mp-exp-seek-bar{flex:1;height:4px;background:rgba(255,255,255,.15);border-radius:2px;position:relative;cursor:pointer}
  .mp-exp-seek-buf{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.15);border-radius:2px;pointer-events:none}
  .mp-exp-seek-fill{position:absolute;top:0;left:0;height:100%;background:#fff;border-radius:2px;pointer-events:none}
  .mp-exp-seek-thumb{position:absolute;top:50%;width:14px;height:14px;background:#fff;border-radius:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity .15s;pointer-events:none}
  .mp-exp-seek-bar:hover .mp-exp-seek-thumb{opacity:1}
  .mp-exp-btns{display:flex;align-items:center;justify-content:center;gap:16px}
  .mp-ctrl-btn{background:none;border:none;color:inherit;cursor:pointer;padding:8px;border-radius:50%;transition:background .15s,transform .1s}
  .mp-ctrl-btn:hover{background:rgba(255,255,255,.1)}
  .mp-ctrl-btn:active{transform:scale(.92)}
  .mp-ctrl-btn.active{color:#1db954}
  .mp-play-btn{width:52px;height:52px;background:#fff!important;color:#000!important;border-radius:50%;display:flex;align-items:center;justify-content:center}
  .mp-play-btn:hover{transform:scale(1.06)}

  /* Secondary controls */
  .mp-exp-secondary{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
  .mp-sec-btn{background:none;border:none;color:inherit;cursor:pointer;padding:6px;border-radius:50%;opacity:.65;transition:opacity .15s}
  .mp-sec-btn:hover{opacity:1}
  .mp-sec-btn.active{opacity:1;color:#1db954}

  /* Volume */
  .mp-vol-wrap{display:flex;align-items:center;gap:6px}
  .mp-vol-bar{width:80px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;position:relative;cursor:pointer}
  .mp-vol-fill{height:100%;background:#fff;border-radius:2px;pointer-events:none}

  /* ── Panels (overlays) ── */
  .mp-panel{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.92);z-index:5;display:none;flex-direction:column;overflow:auto;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);animation:mp-fadeIn .25s ease}
  .mp-panel.open{display:flex}
  @keyframes mp-fadeIn{from{opacity:0}to{opacity:1}}
  .mp-panel-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
  .mp-panel-header h3{font-size:16px;font-weight:700}
  .mp-panel-close{background:none;border:none;color:#fff;cursor:pointer;padding:6px}
  .mp-panel-body{flex:1;overflow:auto;padding:12px 20px}

  /* Queue items */
  .mp-queue-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;transition:background .15s;border-radius:6px;padding:10px 8px}
  .mp-queue-item:hover{background:rgba(255,255,255,.06)}
  .mp-queue-item.active{background:rgba(255,255,255,.1)}
  .mp-queue-img{width:44px;height:44px;border-radius:4px;object-fit:cover;flex-shrink:0}
  .mp-queue-info{flex:1;min-width:0}
  .mp-queue-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-queue-author{font-size:12px;opacity:.5}

  /* Speed */
  .mp-speed-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px 0}
  .mp-speed-opt{background:rgba(255,255,255,.08);border:2px solid transparent;border-radius:10px;padding:12px 8px;text-align:center;font-size:15px;font-weight:600;cursor:pointer;transition:border .15s,background .15s}
  .mp-speed-opt:hover{background:rgba(255,255,255,.12)}
  .mp-speed-opt.active{border-color:#1db954;background:rgba(29,185,84,.15)}

  /* Timer */
  .mp-timer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 0}
  .mp-timer-opt{background:rgba(255,255,255,.08);border:2px solid transparent;border-radius:10px;padding:14px 8px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;transition:border .15s}
  .mp-timer-opt:hover{background:rgba(255,255,255,.12)}
  .mp-timer-opt.active{border-color:#1db954;background:rgba(29,185,84,.15)}
  .mp-timer-status{text-align:center;padding:12px;font-size:13px;opacity:.6}

  /* Share */
  .mp-share-grid{display:flex;flex-wrap:wrap;gap:12px;padding:12px 0;justify-content:center}
  .mp-share-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:none;color:#fff;cursor:pointer;min-width:80px;font-size:12px;transition:background .15s}
  .mp-share-btn:hover{background:rgba(255,255,255,.12)}
  .mp-share-btn svg{width:28px;height:28px}

  /* BG gradient */
  .mp-bg-gradient{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;transition:opacity .6s}

  /* Mode switch */
  .mp-mode-switch{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.1);border-radius:20px;padding:3px}
  .mp-mode-opt{background:none;border:none;color:#fff;padding:6px 14px;border-radius:18px;font-size:12px;font-weight:600;cursor:pointer;opacity:.6;transition:all .2s;display:flex;align-items:center;gap:4px}
  .mp-mode-opt.active{background:rgba(255,255,255,.2);opacity:1}

  /* Responsive */
  @media(max-width:480px){
    .mp-exp-cover{max-width:260px;max-height:260px}
    .mp-exp-controls{padding:12px 16px 16px}
    .mp-exp-btns{gap:10px}
    .mp-vol-wrap{display:none}
    .mp-speed-grid{grid-template-columns:repeat(3,1fr)}
  }
  @media(min-width:769px){
    .mp-exp-content{flex-direction:row;padding:24px 48px;gap:40px}
    .mp-exp-cover{max-width:400px;max-height:400px;width:40vw;height:40vw}
    .mp-exp-controls{max-width:600px;margin:0 auto;width:100%}
  }
  `;

  function buildUI() {
    // Style
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // Root
    const root = ce("div");
    root.id = "mp-root";
    root.innerHTML = `
    <!-- EXPANDED -->
    <div class="mp-expanded" id="mp-exp">
      <div class="mp-bg-gradient" id="mp-bg"></div>
      <div class="mp-exp-top" style="position:relative;z-index:4">
        <button class="mp-exp-top-btn" id="mp-collapse">${icon("collapse",24)}</button>
        <div class="mp-mode-switch" id="mp-mode-switch" style="display:none">
          <button class="mp-mode-opt active" data-mode="audio">${icon("audioIcon",16)} Audio</button>
          <button class="mp-mode-opt" data-mode="video">${icon("videoIcon",16)} Video</button>
        </div>
        <div style="display:flex;gap:4px">
          <button class="mp-exp-top-btn" id="mp-btn-queue" title="Cola">${icon("queue",22)}</button>
          <button class="mp-exp-top-btn" id="mp-btn-speed" title="Velocidad">${icon("speed",22)}</button>
          <button class="mp-exp-top-btn" id="mp-btn-timer" title="Temporizador">${icon("timer",22)}</button>
          <button class="mp-exp-top-btn" id="mp-btn-share" title="Compartir">${icon("share",22)}</button>
          <button class="mp-exp-top-btn" id="mp-btn-dl" title="Descargar" style="display:none">${icon("download",22)}</button>
        </div>
      </div>
      <div class="mp-exp-content" id="mp-exp-content" style="position:relative;z-index:2">
        <img class="mp-exp-cover" id="mp-exp-cover" src="" alt="cover" />
        <video class="mp-exp-video" id="mp-exp-video" style="display:none" playsinline></video>
        <div class="mp-exp-subs" id="mp-exp-subs" style="display:none"></div>
        <div class="mp-exp-video-subs" id="mp-exp-vsubs" style="display:none"></div>
      </div>
      <div class="mp-exp-controls" style="position:relative;z-index:3">
        <div class="mp-exp-info"><div class="mp-exp-title" id="mp-exp-title"></div><div class="mp-exp-author" id="mp-exp-author"></div></div>
        <div class="mp-exp-seek">
          <span class="mp-exp-seek-time" id="mp-cur-time">0:00</span>
          <div class="mp-exp-seek-bar" id="mp-seek">
            <div class="mp-exp-seek-buf" id="mp-seek-buf"></div>
            <div class="mp-exp-seek-fill" id="mp-seek-fill"></div>
            <div class="mp-exp-seek-thumb" id="mp-seek-thumb"></div>
          </div>
          <span class="mp-exp-seek-time" id="mp-dur-time">0:00</span>
        </div>
        <div class="mp-exp-btns">
          <button class="mp-ctrl-btn" id="mp-shuf" title="Aleatorio">${icon("shuffle",22)}</button>
          <button class="mp-ctrl-btn" id="mp-prev" title="Anterior">${icon("prev",28)}</button>
          <button class="mp-ctrl-btn mp-play-btn" id="mp-play">${icon("play",28)}</button>
          <button class="mp-ctrl-btn" id="mp-next" title="Siguiente">${icon("next",28)}</button>
          <button class="mp-ctrl-btn" id="mp-rep" title="Repetir">${icon("repeat",22)}</button>
        </div>
        <div class="mp-exp-secondary">
          <div style="display:flex;gap:4px">
            <button class="mp-sec-btn" id="mp-sub-btn" title="Subtítulos">${icon("subtitle",20)}</button>
          </div>
          <div class="mp-vol-wrap">
            <button class="mp-sec-btn" id="mp-vol-btn">${icon("vol",20)}</button>
            <div class="mp-vol-bar" id="mp-vol-bar"><div class="mp-vol-fill" id="mp-vol-fill" style="width:100%"></div></div>
          </div>
        </div>
      </div>
      <!-- Panels -->
      <div class="mp-panel" id="mp-panel-queue"><div class="mp-panel-header"><h3>A continuación</h3><button class="mp-panel-close" data-panel="queue">${icon("close",22)}</button></div><div class="mp-panel-body" id="mp-queue-list"></div></div>
      <div class="mp-panel" id="mp-panel-speed"><div class="mp-panel-header"><h3>Velocidad</h3><button class="mp-panel-close" data-panel="speed">${icon("close",22)}</button></div><div class="mp-panel-body" id="mp-speed-body"></div></div>
      <div class="mp-panel" id="mp-panel-timer"><div class="mp-panel-header"><h3>Temporizador</h3><button class="mp-panel-close" data-panel="timer">${icon("close",22)}</button></div><div class="mp-panel-body" id="mp-timer-body"></div></div>
      <div class="mp-panel" id="mp-panel-share"><div class="mp-panel-header"><h3>Compartir</h3><button class="mp-panel-close" data-panel="share">${icon("close",22)}</button></div><div class="mp-panel-body" id="mp-share-body"></div></div>
    </div>

    <!-- MINI BAR -->
    <div class="mp-mini" id="mp-mini">
      <div class="mp-mini-progress" id="mp-mini-prog"><div class="mp-mini-progress-buf" id="mp-mini-buf"></div><div class="mp-mini-progress-fill" id="mp-mini-fill"></div></div>
      <img class="mp-mini-cover" id="mp-mini-cover" src="" alt="" />
      <div class="mp-mini-info" id="mp-mini-info">
        <div class="mp-mini-title" id="mp-mini-title"></div>
        <div class="mp-mini-author" id="mp-mini-author"></div>
      </div>
      <button class="mp-mini-btn" id="mp-mini-prev">${icon("prev",20)}</button>
      <button class="mp-mini-btn" id="mp-mini-play">${icon("play",22)}</button>
      <button class="mp-mini-btn" id="mp-mini-next">${icon("next",20)}</button>
      <button class="mp-mini-btn" id="mp-mini-expand">${icon("expand",22)}</button>
    </div>
    `;
    document.body.appendChild(root);

    // Audio element (hidden)
    const audio = document.createElement("audio");
    audio.id = "mp-audio";
    audio.preload = "auto";
    audio.style.display = "none";
    document.body.appendChild(audio);
  }

  /* ── References ─────────────────────────────────────────── */
  let els = {};
  let audioEl, videoEl;

  function refs() {
    els = {
      root: $("#mp-root"),
      mini: $("#mp-mini"),
      miniCover: $("#mp-mini-cover"),
      miniTitle: $("#mp-mini-title"),
      miniAuthor: $("#mp-mini-author"),
      miniPlay: $("#mp-mini-play"),
      miniPrev: $("#mp-mini-prev"),
      miniNext: $("#mp-mini-next"),
      miniExpand: $("#mp-mini-expand"),
      miniInfo: $("#mp-mini-info"),
      miniFill: $("#mp-mini-fill"),
      miniBuf: $("#mp-mini-buf"),
      miniProg: $("#mp-mini-prog"),
      exp: $("#mp-exp"),
      expCover: $("#mp-exp-cover"),
      expVideo: $("#mp-exp-video"),
      expTitle: $("#mp-exp-title"),
      expAuthor: $("#mp-exp-author"),
      expSubs: $("#mp-exp-subs"),
      expVSubs: $("#mp-exp-vsubs"),
      collapse: $("#mp-collapse"),
      play: $("#mp-play"),
      prev: $("#mp-prev"),
      next: $("#mp-next"),
      shuf: $("#mp-shuf"),
      rep: $("#mp-rep"),
      seek: $("#mp-seek"),
      seekFill: $("#mp-seek-fill"),
      seekBuf: $("#mp-seek-buf"),
      seekThumb: $("#mp-seek-thumb"),
      curTime: $("#mp-cur-time"),
      durTime: $("#mp-dur-time"),
      bg: $("#mp-bg"),
      modeSwitch: $("#mp-mode-switch"),
      subBtn: $("#mp-sub-btn"),
      volBtn: $("#mp-vol-btn"),
      volBar: $("#mp-vol-bar"),
      volFill: $("#mp-vol-fill"),
      dlBtn: $("#mp-btn-dl"),
      btnQueue: $("#mp-btn-queue"),
      btnSpeed: $("#mp-btn-speed"),
      btnTimer: $("#mp-btn-timer"),
      btnShare: $("#mp-btn-share"),
      panelQueue: $("#mp-panel-queue"),
      panelSpeed: $("#mp-panel-speed"),
      panelTimer: $("#mp-panel-timer"),
      panelShare: $("#mp-panel-share"),
      queueList: $("#mp-queue-list"),
      speedBody: $("#mp-speed-body"),
      timerBody: $("#mp-timer-body"),
      shareBody: $("#mp-share-body"),
      expContent: $("#mp-exp-content"),
    };
    audioEl = $("#mp-audio");
    videoEl = els.expVideo;
  }

  /* ── Active media element ──────────────────────────────── */
  function activeMedia() {
    return S.mode === "video" && S.mediaVideo ? videoEl : audioEl;
  }

  /* ── UI Update helpers ─────────────────────────────────── */
  function updateBg() {
    const c = S.bgColor || "#111";
    els.bg.style.background = `linear-gradient(180deg, ${c} 0%, ${darken(c,.25)} 100%)`;
    els.mini.style.background = `linear-gradient(90deg, ${darken(c,.35)} 0%, ${darken(c,.2)} 100%)`;
    const tc = textColor(c);
    els.exp.style.color = tc;
    els.mini.style.color = tc;
    // Play button contrast
    els.play.style.background = tc === "#fff" ? "#fff" : "#111";
    els.play.style.color = tc === "#fff" ? "#000" : "#fff";
  }

  function updateMiniInfo() {
    els.miniCover.src = S.coverUrl || "";
    els.miniTitle.textContent = S.title;
    els.miniAuthor.textContent = S.author;
    els.expCover.src = S.coverUrl || "";
    els.expTitle.textContent = S.title;
    els.expAuthor.textContent = S.author;
  }

  function updatePlayBtn() {
    const ic = S.playing ? ICO.pause : ICO.play;
    els.play.innerHTML = `<span class="mp-ico" style="width:28px;height:28px">${ic}</span>`;
    els.miniPlay.innerHTML = `<span class="mp-ico" style="width:22px;height:22px">${ic}</span>`;
  }

  function updateProgress() {
    const pct = S.duration ? (S.currentTime / S.duration) * 100 : 0;
    els.seekFill.style.width = pct + "%";
    els.seekThumb.style.left = pct + "%";
    els.miniFill.style.width = pct + "%";
    els.curTime.textContent = fmt(S.currentTime);
    els.durTime.textContent = fmt(S.duration);
    // Buffered
    const media = activeMedia();
    if (media && media.buffered && media.buffered.length > 0) {
      const buf = (media.buffered.end(media.buffered.length - 1) / (S.duration || 1)) * 100;
      els.seekBuf.style.width = buf + "%";
      els.miniBuf.style.width = buf + "%";
    }
  }

  function updateMode() {
    const hasAudio = !!S.mediaUrl;
    const hasVideo = !!S.mediaVideo;
    els.modeSwitch.style.display = (hasAudio && hasVideo) ? "flex" : "none";
    $$(".mp-mode-opt", els.modeSwitch).forEach(b => {
      b.classList.toggle("active", b.dataset.mode === S.mode);
    });
    if (S.mode === "video" && hasVideo) {
      els.expCover.style.display = "none";
      videoEl.style.display = "block";
      els.expSubs.classList.remove("audio-mode");
    } else {
      els.expCover.style.display = S.subtitlesOn && S.subtitlesUrl ? "none" : "block";
      videoEl.style.display = "none";
      if (S.subtitlesOn && S.subtitlesUrl) {
        els.expSubs.classList.add("audio-mode");
      }
    }
    updateSubtitles();
  }

  function updateSubtitles() {
    els.subBtn.classList.toggle("active", S.subtitlesOn);
    if (!S.subtitlesOn || !S.subtitlesUrl) {
      els.expSubs.style.display = "none";
      els.expVSubs.style.display = "none";
      if (S.mode === "audio") els.expCover.style.display = "block";
      return;
    }
    if (S.mode === "audio") {
      els.expSubs.style.display = "block";
      els.expVSubs.style.display = "none";
      els.expCover.style.display = "none";
      els.expSubs.classList.add("audio-mode");
    } else {
      els.expSubs.style.display = "none";
      els.expVSubs.style.display = "block";
    }
  }

  /* ── Speed panel ───────────────────────────────────────── */
  function buildSpeedPanel() {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3];
    els.speedBody.innerHTML = '<div class="mp-speed-grid">' + speeds.map(s =>
      `<div class="mp-speed-opt${S.speed===s?" active":""}" data-speed="${s}">${s}x</div>`
    ).join("") + '</div>';
    $$(".mp-speed-opt", els.speedBody).forEach(el => {
      el.onclick = () => {
        S.speed = parseFloat(el.dataset.speed);
        activeMedia().playbackRate = S.speed;
        buildSpeedPanel();
      };
    });
  }

  /* ── Timer panel ───────────────────────────────────────── */
  function buildTimerPanel() {
    const opts = [5,10,15,30,45,60,90,120];
    let html = '<div class="mp-timer-grid">' + opts.map(m =>
      `<div class="mp-timer-opt${S.sleepMinutes===m?" active":""}" data-min="${m}">${m} min</div>`
    ).join("") + `<div class="mp-timer-opt${!S.sleepMinutes?" active":""}" data-min="0">Apagar</div></div>`;
    if (S.sleepTimer) {
      const rem = Math.max(0, S.sleepMinutes * 60 - (Date.now() - S._timerStart) / 1000);
      html += `<div class="mp-timer-status">⏱ Quedan ${fmt(rem)}</div>`;
    }
    els.timerBody.innerHTML = html;
    $$(".mp-timer-opt", els.timerBody).forEach(el => {
      el.onclick = () => {
        const m = parseInt(el.dataset.min);
        if (S.sleepTimer) clearTimeout(S.sleepTimer);
        S.sleepTimer = null;
        S.sleepMinutes = m;
        if (m > 0) {
          S._timerStart = Date.now();
          S.sleepTimer = setTimeout(() => {
            pauseMedia();
            S.sleepTimer = null;
            S.sleepMinutes = 0;
          }, m * 60 * 1000);
        }
        buildTimerPanel();
      };
    });
  }

  /* ── Share panel ───────────────────────────────────────── */
  function buildSharePanel() {
    const url = S.detailUrl ? window.location.origin + S.detailUrl : window.location.href;
    const t = encodeURIComponent(S.title + " — " + S.author);
    const u = encodeURIComponent(url);
    const shares = [
      { name: "WhatsApp", color: "#25D366", url: `https://wa.me/?text=${t}%20${u}`, icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>` },
      { name: "Twitter", color: "#000", url: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
      { name: "Facebook", color: "#1877F2", url: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>` },
      { name: "Telegram", color: "#0088cc", url: `https://t.me/share/url?url=${u}&text=${t}`, icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>` },
      { name: "Copiar", color: "#555", url: null, icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>` },
    ];
    els.shareBody.innerHTML = '<div class="mp-share-grid">' + shares.map(s =>
      `<button class="mp-share-btn" data-url="${s.url||""}" data-name="${s.name}" style="border:1px solid rgba(255,255,255,.1)">${s.icon}<span>${s.name}</span></button>`
    ).join("") + '</div>';
    $$(".mp-share-btn", els.shareBody).forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.name === "Copiar") {
          navigator.clipboard.writeText(url).then(() => {
            btn.querySelector("span").textContent = "¡Copiado!";
            setTimeout(() => btn.querySelector("span").textContent = "Copiar", 2000);
          });
        } else {
          window.open(btn.dataset.url, "_blank", "width=600,height=400");
        }
      };
    });
  }

  /* ── Queue panel ───────────────────────────────────────── */
  function buildQueuePanel() {
    if (!S.queue || !S.queue.length) {
      els.queueList.innerHTML = '<p style="opacity:.5;padding:20px;text-align:center">No hay episodios en cola.</p>';
      return;
    }
    els.queueList.innerHTML = S.queue.map((ep, i) =>
      `<div class="mp-queue-item${i===S.queueIndex?" active":""}" data-qi="${i}">
        <img class="mp-queue-img" src="${ep.coverUrl||""}" alt="" />
        <div class="mp-queue-info">
          <div class="mp-queue-title">${ep.title||""}</div>
          <div class="mp-queue-author">${ep.author||""}</div>
        </div>
      </div>`
    ).join("");
    $$(".mp-queue-item", els.queueList).forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.qi);
        playQueueItem(idx);
      };
    });
  }

  function playQueueItem(idx) {
    if (!S.queue[idx]) return;
    const ep = S.queue[idx];
    S.queueIndex = idx;
    loadEpisode(ep.mediaUrl, ep.mediaVideo, ep.initialMode || "audio", ep.coverUrl, ep.coverInfo, ep.title, ep.detailUrl, ep.author, S.queue, ep.text, ep.subtitlesUrl, ep.bgColor, ep.allowDownload);
    playMedia();
    buildQueuePanel();
  }

  /* ── Media control ─────────────────────────────────────── */
  function loadEpisode(mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload) {
    // Pause current
    pauseMedia();

    S.mediaUrl = mediaUrl || "";
    S.mediaVideo = mediaVideo || "";
    S.coverUrl = coverUrl || coverInfo || "";
    S.coverInfo = coverInfo || coverUrl || "";
    S.title = title || "";
    S.detailUrl = detailUrl || "";
    S.author = author || "";
    S.queue = queue || [];
    S.text = text || "";
    S.subtitlesUrl = subtitlesUrl || "";
    S.bgColor = bgColor || "#111";
    S.allowDownload = allowDownload === true || allowDownload === "true";
    S.subtitlesOn = false;
    S.currentTime = 0;
    S.duration = 0;

    // Determine mode
    const hasAudio = !!S.mediaUrl;
    const hasVideo = !!S.mediaVideo;
    if (initialMode === "video" && hasVideo) {
      S.mode = "video";
    } else if (hasAudio) {
      S.mode = "audio";
    } else if (hasVideo) {
      S.mode = "video";
    } else {
      S.mode = "audio";
    }

    // Set sources
    if (hasAudio) audioEl.src = S.mediaUrl;
    if (hasVideo) videoEl.src = S.mediaVideo;

    // Apply speed
    audioEl.playbackRate = S.speed;
    videoEl.playbackRate = S.speed;

    // Update UI
    updateBg();
    updateMiniInfo();
    updatePlayBtn();
    updateMode();
    updateProgress();

    // Show mini
    els.mini.classList.add("visible");

    // Download
    els.dlBtn.style.display = S.allowDownload ? "block" : "none";

    // Load subtitles
    if (S.subtitlesUrl) loadSubtitles(S.subtitlesUrl);
  }

  function playMedia() {
    const media = activeMedia();
    if (!media || !media.src) return;
    media.play().catch(() => {});
    S.playing = true;
    updatePlayBtn();
    // Sync: if video mode, mute audio; if audio mode, pause video
    syncMediaStreams();
  }

  function pauseMedia() {
    audioEl.pause();
    videoEl.pause();
    S.playing = false;
    updatePlayBtn();
  }

  function togglePlay() {
    S.playing ? pauseMedia() : playMedia();
  }

  function syncMediaStreams() {
    if (S.mode === "video" && S.mediaVideo) {
      audioEl.pause();
      audioEl.muted = true;
      videoEl.muted = S.muted;
      videoEl.volume = S.volume;
      if (S.playing) videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
      videoEl.muted = true;
      audioEl.muted = S.muted;
      audioEl.volume = S.volume;
      if (S.playing) audioEl.play().catch(() => {});
    }
  }

  function switchMode(mode) {
    if (mode === S.mode) return;
    const currentTime = activeMedia().currentTime || 0;
    S.mode = mode;
    const newMedia = activeMedia();
    if (newMedia.src) {
      newMedia.currentTime = currentTime;
    }
    newMedia.playbackRate = S.speed;
    syncMediaStreams();
    updateMode();
  }

  function seekTo(pct) {
    const media = activeMedia();
    if (media && S.duration) {
      media.currentTime = pct * S.duration;
      S.currentTime = media.currentTime;
      updateProgress();
    }
  }

  function setVolume(v) {
    S.volume = clamp(v, 0, 1);
    S.muted = S.volume === 0;
    activeMedia().volume = S.volume;
    activeMedia().muted = S.muted;
    els.volFill.style.width = (S.volume * 100) + "%";
    els.volBtn.innerHTML = icon(S.muted ? "volMute" : "vol", 20);
  }

  /* ── Subtitles (VTT/SRT) ─────────────────────────────── */
  function loadSubtitles(url) {
    S.subtitlesCues = [];
    fetch(url).then(r => r.ok ? r.text() : "").then(txt => {
      if (!txt) return;
      // Parse simple VTT/SRT
      const blocks = txt.split(/\n\s*\n/);
      blocks.forEach(block => {
        const lines = block.trim().split("\n");
        for (let i = 0; i < lines.length; i++) {
          const m = lines[i].match(/(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:?\d{2}:\d{2}[.,]\d{3})/);
          if (m) {
            const start = parseTime(m[1]);
            const end = parseTime(m[2]);
            const text = lines.slice(i + 1).join(" ").replace(/<[^>]+>/g, "").trim();
            if (text) S.subtitlesCues.push({ start, end, text });
            break;
          }
        }
      });
    }).catch(() => {});
  }

  function parseTime(str) {
    str = str.replace(",", ".");
    const parts = str.split(":");
    if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    return parseFloat(str);
  }

  function getCurrentCue(time) {
    for (const cue of S.subtitlesCues) {
      if (time >= cue.start && time <= cue.end) return cue.text;
    }
    return "";
  }

  /* ── Expand / Collapse ─────────────────────────────────── */
  function expand() {
    S.expanded = true;
    els.exp.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function collapse() {
    S.expanded = false;
    els.exp.classList.remove("open");
    closeAllPanels();
    document.body.style.overflow = "";
  }

  function togglePanel(name) {
    const panels = ["queue", "speed", "timer", "share"];
    panels.forEach(p => {
      const el = els["panel" + p.charAt(0).toUpperCase() + p.slice(1)];
      if (p === name && !el.classList.contains("open")) {
        el.classList.add("open");
        S.panelOpen = name;
        if (p === "speed") buildSpeedPanel();
        if (p === "timer") buildTimerPanel();
        if (p === "share") buildSharePanel();
        if (p === "queue") buildQueuePanel();
      } else {
        el.classList.remove("open");
      }
    });
    if (S.panelOpen === name) S.panelOpen = null;
  }

  function closeAllPanels() {
    ["Queue","Speed","Timer","Share"].forEach(n => {
      els["panel"+n].classList.remove("open");
    });
    S.panelOpen = null;
  }

  /* ── Events ────────────────────────────────────────────── */
  function bindEvents() {
    // Mini
    els.miniPlay.onclick = togglePlay;
    els.miniExpand.onclick = expand;
    els.miniInfo.onclick = expand;
    els.miniCover.onclick = expand;
    els.miniPrev.onclick = () => skip(-1);
    els.miniNext.onclick = () => skip(1);

    // Mini progress click
    els.miniProg.onclick = (e) => {
      const r = els.miniProg.getBoundingClientRect();
      seekTo((e.clientX - r.left) / r.width);
    };

    // Expanded
    els.collapse.onclick = collapse;
    els.play.onclick = togglePlay;
    els.prev.onclick = () => skip(-1);
    els.next.onclick = () => skip(1);

    // Seek
    const seekHandler = (e) => {
      const r = els.seek.getBoundingClientRect();
      seekTo(clamp((e.clientX - r.left) / r.width, 0, 1));
    };
    els.seek.onmousedown = (e) => { S.seekDragging = true; seekHandler(e); };
    document.addEventListener("mousemove", (e) => { if (S.seekDragging) seekHandler(e); });
    document.addEventListener("mouseup", () => { S.seekDragging = false; });
    // Touch
    els.seek.ontouchstart = (e) => { S.seekDragging = true; seekHandler(e.touches[0]); };
    document.addEventListener("touchmove", (e) => { if (S.seekDragging) seekHandler(e.touches[0]); });
    document.addEventListener("touchend", () => { S.seekDragging = false; });

    // Volume
    els.volBtn.onclick = () => { setVolume(S.muted ? (S.volume || 1) : 0); S.muted = !S.muted; };
    els.volBar.onclick = (e) => {
      const r = els.volBar.getBoundingClientRect();
      setVolume((e.clientX - r.left) / r.width);
    };

    // Mode switch
    $$(".mp-mode-opt", els.modeSwitch).forEach(btn => {
      btn.onclick = () => switchMode(btn.dataset.mode);
    });

    // Subtitles
    els.subBtn.onclick = () => {
      S.subtitlesOn = !S.subtitlesOn;
      updateSubtitles();
      updateMode();
    };

    // Panels
    els.btnQueue.onclick = () => togglePanel("queue");
    els.btnSpeed.onclick = () => togglePanel("speed");
    els.btnTimer.onclick = () => togglePanel("timer");
    els.btnShare.onclick = () => togglePanel("share");
    $$(".mp-panel-close").forEach(btn => {
      btn.onclick = () => {
        const p = btn.dataset.panel;
        els["panel" + p.charAt(0).toUpperCase() + p.slice(1)].classList.remove("open");
        S.panelOpen = null;
      };
    });

    // Download
    els.dlBtn.onclick = () => {
      const url = S.mode === "video" && S.mediaVideo ? S.mediaVideo : S.mediaUrl;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = S.title || "download";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };

    // Shuffle / repeat
    let shuffleOn = false, repeatOn = false;
    els.shuf.onclick = () => { shuffleOn = !shuffleOn; els.shuf.classList.toggle("active", shuffleOn); };
    els.rep.onclick = () => { repeatOn = !repeatOn; els.rep.classList.toggle("active", repeatOn); };

    // Audio/Video events
    function onTimeUpdate() {
      if (S.seekDragging) return;
      const m = activeMedia();
      S.currentTime = m.currentTime;
      S.duration = m.duration || 0;
      updateProgress();
      // Subtitles
      if (S.subtitlesOn && S.subtitlesCues.length) {
        const cue = getCurrentCue(S.currentTime);
        if (S.mode === "audio") {
          els.expSubs.textContent = cue;
        } else {
          els.expVSubs.textContent = cue;
        }
      }
    }
    function onEnded() {
      if (repeatOn) {
        activeMedia().currentTime = 0;
        playMedia();
      } else {
        skip(1);
      }
    }
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("loadedmetadata", () => { S.duration = audioEl.duration; updateProgress(); });
    videoEl.addEventListener("loadedmetadata", () => { S.duration = videoEl.duration; updateProgress(); });
    audioEl.addEventListener("ended", onEnded);
    videoEl.addEventListener("ended", onEnded);

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (!els.mini.classList.contains("visible")) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") { const m = activeMedia(); m.currentTime = Math.min(m.duration, m.currentTime + 10); }
      if (e.code === "ArrowLeft") { const m = activeMedia(); m.currentTime = Math.max(0, m.currentTime - 10); }
      if (e.code === "ArrowUp") { e.preventDefault(); setVolume(S.volume + 0.1); }
      if (e.code === "ArrowDown") { e.preventDefault(); setVolume(S.volume - 0.1); }
    });
  }

  function skip(dir) {
    if (!S.queue || !S.queue.length) return;
    let next = S.queueIndex + dir;
    if (next < 0) next = S.queue.length - 1;
    if (next >= S.queue.length) next = 0;
    playQueueItem(next);
  }

  /* ── Public API ────────────────────────────────────────── */
  window.playEpisodeExpanded = function (mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload) {
    if (!els.mini) { buildUI(); refs(); bindEvents(); }
    loadEpisode(mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload);
    playMedia();
    expand();
  };

  window.playEpisodeMini = function (mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload) {
    if (!els.mini) { buildUI(); refs(); bindEvents(); }
    loadEpisode(mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload);
    playMedia();
  };

  /* ── Auto-init on DOM ready ────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { buildUI(); refs(); bindEvents(); });
  } else {
    buildUI(); refs(); bindEvents();
  }
})();
