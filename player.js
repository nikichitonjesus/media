/**
 * ═══════════════════════════════════════════════════════════════
 *  MEDIA PLAYER — YouTube Music + Spotify Style
 *  Enhanced version with persistent bottom bar & side panels
 *  v3.0 - Full features
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  "use strict";

  /* ── State ─────────────────────────────────────────────── */
  const S = {
    playing: false,
    expanded: false,
    mode: "audio",
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
    sleepEndTime: null,
    panelOpen: null,
    duration: 0,
    currentTime: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    seekDragging: false,
    repeat: false,
    shuffle: false,
    liked: false,
    videoFullscreen: false,
    videoControlsVisible: true,
    videoControlsTimeout: null,
    pendingPanel: null,
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
  const lighten = (hex, f) => {
    const [r,g,b] = hexToRgb(hex);
    return `rgb(${Math.min(255, Math.round(r*f))},${Math.min(255, Math.round(g*f))},${Math.min(255, Math.round(b*f))})`;
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
    rewind15: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><path d="M10.5 13.5h2v-4h-2v4zM14.5 13.5h2v-4h-2v4z"/></svg>`,
    forward15: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><path d="M10.5 13.5h2v-4h-2v4zM14.5 13.5h2v-4h-2v4z"/></svg>`,
    like: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    liked: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="red"/></svg>`,
    fullscreen: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
    exitFullscreen: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`,
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

  /* ── Mini bar (persistent bottom bar) ────────── */
  .mp-mini{display:none;background:#181818;color:#fff;position:fixed;bottom:0;left:0;right:0;z-index:1000000;border-top:1px solid rgba(255,255,255,.08);transition:background .4s}
  .mp-mini.visible{display:block}
  
  .mp-mini-progress{height:3px;background:rgba(255,255,255,.15);cursor:pointer;position:relative}
  .mp-mini-progress-fill{height:100%;background:#fff;border-radius:0 2px 2px 0;transition:width .1s linear;position:relative}
  .mp-mini-progress-fill::after{content:'';position:absolute;right:-4px;top:50%;transform:translateY(-50%);width:10px;height:10px;background:#fff;border-radius:50%;opacity:0;transition:opacity .15s}
  .mp-mini-progress:hover .mp-mini-progress-fill::after{opacity:1}
  .mp-mini-progress-buf{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.15);pointer-events:none}
  
  .mp-mini-content{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;height:80px;gap:20px}
  
  /* Left section - fixed width */
  .mp-mini-left{display:flex;align-items:center;gap:16px;flex:0 0 280px;min-width:0}
  .mp-mini-cover{width:56px;height:56px;border-radius:8px;object-fit:cover;cursor:pointer;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,.3)}
  .mp-mini-info{flex:1;min-width:0;cursor:pointer}
  .mp-mini-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-mini-author{font-size:12px;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-mini-add{background:none;border:none;color:#fff;cursor:pointer;padding:8px;border-radius:50%;opacity:.7;transition:all .2s;flex-shrink:0}
  .mp-mini-add:hover{opacity:1;transform:scale(1.1)}
  
  /* Center controls - fixed width and centered */
  .mp-mini-center{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;justify-content:center}
  .mp-mini-controls{display:flex;align-items:center;gap:12px;justify-content:center}
  .mp-mini-btn{background:none;border:none;color:inherit;cursor:pointer;padding:8px;border-radius:50%;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  .mp-mini-btn:hover{background:rgba(255,255,255,.1);transform:scale(1.05)}
  .mp-mini-btn:active{transform:scale(.95)}
  .mp-mini-play{width:44px;height:44px;background:#fff!important;color:#000!important;border-radius:50%;padding:0}
  .mp-mini-play:hover{transform:scale(1.08)}
  .mp-mini-time{display:flex;align-items:center;gap:12px;font-size:11px;color:rgba(255,255,255,.6)}
  .mp-mini-time span{min-width:40px;font-variant-numeric:tabular-nums}
  .mp-mini-time .mp-sep{flex:1;height:2px;background:rgba(255,255,255,.1);border-radius:2px;min-width:100px}
  
  /* Right section - fixed width */
  .mp-mini-right{display:flex;align-items:center;gap:16px;flex:0 0 280px;justify-content:flex-end}
  .mp-mini-vol-wrap{display:flex;align-items:center;gap:8px}
  .mp-mini-vol-bar{width:80px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;cursor:pointer;position:relative}
  .mp-mini-vol-fill{height:100%;background:#fff;border-radius:2px;pointer-events:none}
  .mp-speed-badge{padding:4px 12px;background:rgba(255,255,255,.1);border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
  .mp-speed-badge:hover{background:rgba(255,255,255,.2)}
  .mp-like-btn{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:8px;border-radius:50%;transition:all .2s;display:inline-flex;align-items:center;flex-shrink:0}
  .mp-like-btn:hover{transform:scale(1.1)}
  .mp-like-btn.active{color:#ff4444}

  /* ── Expanded view with dynamic background ───── */
  .mp-expanded{position:fixed;bottom:80px;left:0;right:0;top:0;display:flex;transform:translateY(100%);transition:transform .38s cubic-bezier(.16,1,.3,1);overflow:hidden;z-index:999998}
  .mp-expanded.open{transform:translateY(0)}
  .mp-expanded-bg{position:absolute;top:0;left:0;right:0;bottom:0;transition:background .5s ease;z-index:0}
  
  .mp-exp-container{display:flex;width:100%;height:100%;transition:all .3s ease;position:relative;z-index:1}
  .mp-exp-media{flex:1;display:flex;align-items:center;justify-content:center;position:relative;transition:flex .3s ease;background:transparent}
  .mp-exp-media.with-panel{flex:0 0 60%}
  .mp-exp-cover{max-width:80%;max-height:80%;object-fit:contain;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.5);transition:all .3s}
  .mp-exp-video{width:100%;height:100%;object-fit:contain;background:#000}
  
  /* Video controls overlay for fullscreen */
  .mp-video-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);z-index:1000001;display:none;flex-direction:column;justify-content:space-between;align-items:center;backdrop-filter:blur(10px)}
  .mp-video-overlay.active{display:flex}
  .mp-video-overlay-top{position:absolute;top:0;left:0;right:0;padding:20px;background:linear-gradient(180deg, rgba(0,0,0,.7) 0%, transparent 100%)}
  .mp-video-overlay-title{font-size:18px;font-weight:600;text-align:center;color:#fff}
  .mp-video-overlay-center{display:flex;align-items:center;justify-content:center;gap:40px;flex:1}
  .mp-video-overlay-btn{background:rgba(255,255,255,.2);border:none;color:#fff;width:60px;height:60px;border-radius:50%;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)}
  .mp-video-overlay-btn:hover{background:rgba(255,255,255,.4);transform:scale(1.1)}
  .mp-video-overlay-play{width:80px;height:80px;background:rgba(255,255,255,.3)}
  .mp-video-overlay-bottom{position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(0deg, rgba(0,0,0,.7) 0%, transparent 100%)}
  .mp-video-overlay-progress{height:4px;background:rgba(255,255,255,.3);border-radius:2px;cursor:pointer;margin-bottom:12px}
  .mp-video-overlay-progress-fill{height:100%;background:#fff;border-radius:2px;width:0%}
  .mp-video-overlay-time{display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px}
  .mp-video-overlay-exit{position:absolute;top:20px;right:20px;background:rgba(0,0,0,.5);border:none;color:#fff;padding:10px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
  
  .mp-exp-subs{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);text-align:center;font-size:clamp(18px,4vw,32px);font-weight:700;line-height:1.4;max-width:80%;text-shadow:0 2px 12px rgba(0,0,0,.7);pointer-events:none;z-index:2}
  
  /* Side panel */
  .mp-exp-panel{position:fixed;right:0;top:0;bottom:0;width:40%;background:rgba(20,20,20,.98);backdrop-filter:blur(20px);transform:translateX(100%);transition:transform .3s ease;z-index:20;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.1)}
  .mp-exp-panel.open{transform:translateX(0)}
  .mp-panel-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.1)}
  .mp-panel-header h3{font-size:18px;font-weight:700}
  .mp-panel-close{background:none;border:none;color:#fff;cursor:pointer;padding:8px;border-radius:50%;transition:background .15s;display:inline-flex;align-items:center}
  .mp-panel-close:hover{background:rgba(255,255,255,.1)}
  .mp-panel-body{flex:1;overflow-y:auto;padding:16px 24px}
  
  /* Queue items */
  .mp-queue-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:4px}
  .mp-queue-item:hover{background:rgba(255,255,255,.08)}
  .mp-queue-item.active{background:rgba(255,255,255,.12)}
  .mp-queue-img{width:48px;height:48px;border-radius:6px;object-fit:cover;flex-shrink:0}
  .mp-queue-info{flex:1;min-width:0}
  .mp-queue-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-queue-author{font-size:12px;opacity:.6}
  
  /* Speed grid */
  .mp-speed-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .mp-speed-opt{background:rgba(255,255,255,.08);border:2px solid transparent;border-radius:12px;padding:14px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
  .mp-speed-opt:hover{background:rgba(255,255,255,.12)}
  .mp-speed-opt.active{border-color:#1db954;background:rgba(29,185,84,.15)}
  
  /* Timer grid */
  .mp-timer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .mp-timer-opt{background:rgba(255,255,255,.08);border:2px solid transparent;border-radius:12px;padding:14px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
  .mp-timer-opt:hover{background:rgba(255,255,255,.12)}
  .mp-timer-opt.active{border-color:#1db954;background:rgba(29,185,84,.15)}
  .mp-timer-status{text-align:center;padding:16px;font-size:13px;opacity:.6}
  
  /* Share grid */
  .mp-share-grid{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
  .mp-share-btn{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border-radius:12px;background:rgba(255,255,255,.08);border:none;color:#fff;cursor:pointer;min-width:90px;font-size:12px;transition:all .15s}
  .mp-share-btn:hover{background:rgba(255,255,255,.15);transform:translateY(-2px)}
  
  /* Responsive */
  @media(max-width:768px){
    .mp-mini-left{flex:0 0 200px}
    .mp-mini-right{flex:0 0 200px}
    .mp-mini-vol-bar{width:60px}
    .mp-exp-panel{width:100%}
    .mp-exp-media.with-panel{flex:0 0 100%}
    .mp-mini-time .mp-sep{min-width:50px}
  }
  `;

  function buildUI() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = ce("div");
    root.id = "mp-root";
    root.innerHTML = `
    <!-- EXPANDED VIEW -->
    <div class="mp-expanded" id="mp-exp">
      <div class="mp-expanded-bg" id="mp-exp-bg"></div>
      <div class="mp-exp-container" id="mp-exp-container">
        <div class="mp-exp-media" id="mp-exp-media">
          <img class="mp-exp-cover" id="mp-exp-cover" src="" alt="cover" />
          <video class="mp-exp-video" id="mp-exp-video" style="display:none" playsinline></video>
          <div class="mp-exp-subs" id="mp-exp-subs" style="display:none"></div>
        </div>
      </div>
      
      <!-- Side Panel -->
      <div class="mp-exp-panel" id="mp-side-panel">
        <div class="mp-panel-header">
          <h3 id="mp-panel-title">Cola</h3>
          <button class="mp-panel-close" id="mp-panel-close">${icon("close",24)}</button>
        </div>
        <div class="mp-panel-body" id="mp-panel-body"></div>
      </div>
    </div>

    <!-- Video Overlay for Fullscreen -->
    <div class="mp-video-overlay" id="mp-video-overlay">
      <div class="mp-video-overlay-top">
        <div class="mp-video-overlay-title" id="mp-overlay-title"></div>
      </div>
      <button class="mp-video-overlay-exit" id="mp-overlay-exit">${icon("exitFullscreen",24)}</button>
      <div class="mp-video-overlay-center">
        <button class="mp-video-overlay-btn" id="mp-overlay-prev">${icon("prev",32)}</button>
        <button class="mp-video-overlay-btn mp-video-overlay-play" id="mp-overlay-play">${icon("play",40)}</button>
        <button class="mp-video-overlay-btn" id="mp-overlay-next">${icon("next",32)}</button>
      </div>
      <div class="mp-video-overlay-bottom">
        <div class="mp-video-overlay-progress" id="mp-overlay-progress">
          <div class="mp-video-overlay-progress-fill" id="mp-overlay-progress-fill"></div>
        </div>
        <div class="mp-video-overlay-time">
          <span id="mp-overlay-current">0:00</span>
          <span id="mp-overlay-duration">0:00</span>
        </div>
      </div>
    </div>

    <!-- MINI BAR -->
    <div class="mp-mini" id="mp-mini">
      <div class="mp-mini-progress" id="mp-mini-prog">
        <div class="mp-mini-progress-buf" id="mp-mini-buf"></div>
        <div class="mp-mini-progress-fill" id="mp-mini-fill"></div>
      </div>
      <div class="mp-mini-content">
        <div class="mp-mini-left">
          <img class="mp-mini-cover" id="mp-mini-cover" src="" alt="" />
          <div class="mp-mini-info" id="mp-mini-info">
            <div class="mp-mini-title" id="mp-mini-title"></div>
            <div class="mp-mini-author" id="mp-mini-author"></div>
          </div>
          <button class="mp-mini-add" id="mp-add-btn" title="Añadir a lista">${icon("queue",20)}</button>
        </div>
        
        <div class="mp-mini-center">
          <div class="mp-mini-controls">
            <button class="mp-mini-btn" id="mp-shuffle-btn" title="Aleatorio">${icon("shuffle",20)}</button>
            <button class="mp-mini-btn" id="mp-prev-btn" title="Anterior">${icon("prev",24)}</button>
            <button class="mp-mini-btn" id="mp-rewind-btn" title="Retroceder 15s">${icon("rewind15",24)}</button>
            <button class="mp-mini-btn mp-mini-play" id="mp-play-btn">${icon("play",28)}</button>
            <button class="mp-mini-btn" id="mp-forward-btn" title="Avanzar 15s">${icon("forward15",24)}</button>
            <button class="mp-mini-btn" id="mp-next-btn" title="Siguiente">${icon("next",24)}</button>
            <button class="mp-mini-btn" id="mp-repeat-btn" title="Repetir">${icon("repeat",20)}</button>
          </div>
          <div class="mp-mini-time">
            <span id="mp-cur-time">0:00</span>
            <div class="mp-sep"></div>
            <span id="mp-dur-time">0:00</span>
          </div>
        </div>
        
        <div class="mp-mini-right">
          <div class="mp-mini-vol-wrap">
            <button class="mp-mini-btn" id="mp-vol-btn">${icon("vol",20)}</button>
            <div class="mp-mini-vol-bar" id="mp-vol-bar"><div class="mp-mini-vol-fill" id="mp-vol-fill" style="width:100%"></div></div>
          </div>
          <button class="mp-speed-badge" id="mp-speed-btn">1.0x</button>
          <button class="mp-mini-btn" id="mp-timer-btn" title="Temporizador">${icon("timer",20)}</button>
          <button class="mp-like-btn" id="mp-like-btn" title="Me gusta">${icon("like",22)}</button>
          <button class="mp-mini-btn" id="mp-expand-btn" title="Expandir">${icon("expand",24)}</button>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(root);

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
      mini: $("#mp-mini"),
      miniCover: $("#mp-mini-cover"),
      miniTitle: $("#mp-mini-title"),
      miniAuthor: $("#mp-mini-author"),
      miniInfo: $("#mp-mini-info"),
      miniFill: $("#mp-mini-fill"),
      miniBuf: $("#mp-mini-buf"),
      miniProg: $("#mp-mini-prog"),
      curTime: $("#mp-cur-time"),
      durTime: $("#mp-dur-time"),
      playBtn: $("#mp-play-btn"),
      prevBtn: $("#mp-prev-btn"),
      nextBtn: $("#mp-next-btn"),
      rewindBtn: $("#mp-rewind-btn"),
      forwardBtn: $("#mp-forward-btn"),
      shuffleBtn: $("#mp-shuffle-btn"),
      repeatBtn: $("#mp-repeat-btn"),
      volBtn: $("#mp-vol-btn"),
      volBar: $("#mp-vol-bar"),
      volFill: $("#mp-vol-fill"),
      speedBtn: $("#mp-speed-btn"),
      timerBtn: $("#mp-timer-btn"),
      likeBtn: $("#mp-like-btn"),
      addBtn: $("#mp-add-btn"),
      expandBtn: $("#mp-expand-btn"),
      exp: $("#mp-exp"),
      expBg: $("#mp-exp-bg"),
      expContainer: $("#mp-exp-container"),
      expMedia: $("#mp-exp-media"),
      expCover: $("#mp-exp-cover"),
      expVideo: $("#mp-exp-video"),
      expSubs: $("#mp-exp-subs"),
      sidePanel: $("#mp-side-panel"),
      panelTitle: $("#mp-panel-title"),
      panelBody: $("#mp-panel-body"),
      panelClose: $("#mp-panel-close"),
      videoOverlay: $("#mp-video-overlay"),
      overlayTitle: $("#mp-overlay-title"),
      overlayPlay: $("#mp-overlay-play"),
      overlayPrev: $("#mp-overlay-prev"),
      overlayNext: $("#mp-overlay-next"),
      overlayProgress: $("#mp-overlay-progress"),
      overlayProgressFill: $("#mp-overlay-progress-fill"),
      overlayCurrent: $("#mp-overlay-current"),
      overlayDuration: $("#mp-overlay-duration"),
      overlayExit: $("#mp-overlay-exit"),
    };
    audioEl = $("#mp-audio");
    videoEl = els.expVideo;
  }

  function activeMedia() {
    return S.mode === "video" && S.mediaVideo ? videoEl : audioEl;
  }

  /* ── UI Update helpers ─────────────────────────────────── */
  function updateBg() {
    const c = S.bgColor || "#111";
    els.mini.style.background = `linear-gradient(90deg, ${darken(c,.35)} 0%, ${darken(c,.2)} 100%)`;
    els.expBg.style.background = `linear-gradient(135deg, ${lighten(c,1.2)} 0%, ${darken(c,.6)} 100%)`;
    const tc = textColor(c);
    els.mini.style.color = tc;
  }

  function updateMiniInfo() {
    els.miniCover.src = S.coverUrl || "";
    els.miniTitle.textContent = S.title || "";
    els.miniAuthor.textContent = S.author || "";
    els.expCover.src = S.coverUrl || "";
    els.overlayTitle.textContent = S.title || "";
  }

  function updatePlayBtn() {
    const ic = S.playing ? ICO.pause : ICO.play;
    els.playBtn.innerHTML = `<span class="mp-ico" style="width:28px;height:28px">${ic}</span>`;
    els.overlayPlay.innerHTML = `<span class="mp-ico" style="width:40px;height:40px">${ic}</span>`;
  }

  function updateProgress() {
    const pct = S.duration ? (S.currentTime / S.duration) * 100 : 0;
    els.miniFill.style.width = pct + "%";
    els.curTime.textContent = fmt(S.currentTime);
    els.durTime.textContent = fmt(S.duration);
    els.overlayProgressFill.style.width = pct + "%";
    els.overlayCurrent.textContent = fmt(S.currentTime);
    els.overlayDuration.textContent = fmt(S.duration);
    
    const media = activeMedia();
    if (media && media.buffered && media.buffered.length > 0) {
      const buf = (media.buffered.end(media.buffered.length - 1) / (S.duration || 1)) * 100;
      els.miniBuf.style.width = buf + "%";
    }
    
    // Check sleep timer based on actual progress
    checkSleepTimer();
  }
  
  function checkSleepTimer() {
    if (S.sleepTimer && S.sleepEndTime) {
      const remaining = S.sleepEndTime - Date.now();
      if (remaining <= 0) {
        // Time's up - stop playback
        pauseMedia();
        clearSleepTimer();
        if (S.panelOpen === "timer") buildTimerPanel();
      }
    }
  }
  
  function clearSleepTimer() {
    if (S.sleepTimer) {
      clearInterval(S.sleepTimer);
      S.sleepTimer = null;
    }
    S.sleepMinutes = 0;
    S.sleepEndTime = null;
  }

  function updateMode() {
    const hasVideo = !!S.mediaVideo;
    if (S.mode === "video" && hasVideo) {
      els.expCover.style.display = "none";
      videoEl.style.display = "block";
    } else {
      els.expCover.style.display = "block";
      videoEl.style.display = "none";
    }
  }

  function updateSpeedUI() {
    els.speedBtn.textContent = S.speed + "x";
  }

  function updateLikeUI() {
    els.likeBtn.innerHTML = icon(S.liked ? "liked" : "like", 22);
    if (S.liked) {
      els.likeBtn.classList.add("active");
    } else {
      els.likeBtn.classList.remove("active");
    }
  }

  function updateRepeatUI() {
    els.repeatBtn.classList.toggle("active", S.repeat);
  }

  function updateShuffleUI() {
    els.shuffleBtn.classList.toggle("active", S.shuffle);
  }

  /* ── Panel management with side slide ──────────────────── */
  let currentPanelType = null;

  function openPanelWithExpand(type) {
    if (!S.expanded) {
      S.pendingPanel = type;
      expand();
    } else {
      openPanel(type);
    }
  }

  function openPanel(type) {
    const titles = {
      queue: "A continuación",
      speed: "Velocidad de reproducción",
      timer: "Temporizador de sueño",
      share: "Compartir"
    };
    
    if (currentPanelType === type && els.sidePanel.classList.contains("open")) {
      closePanel();
      return;
    }
    
    els.panelTitle.textContent = titles[type] || "Panel";
    currentPanelType = type;
    
    if (type === "queue") buildQueuePanel();
    if (type === "speed") buildSpeedPanel();
    if (type === "timer") buildTimerPanel();
    if (type === "share") buildSharePanel();
    
    els.expMedia.classList.add("with-panel");
    els.sidePanel.classList.add("open");
    S.panelOpen = type;
  }

  function closePanel() {
    els.expMedia.classList.remove("with-panel");
    els.sidePanel.classList.remove("open");
    currentPanelType = null;
    S.panelOpen = null;
  }

  /* ── Panel builders ───────────────────────────────────── */
  function buildSpeedPanel() {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3];
    els.panelBody.innerHTML = '<div class="mp-speed-grid">' + speeds.map(s =>
      `<div class="mp-speed-opt${S.speed===s?" active":""}" data-speed="${s}">${s}x</div>`
    ).join("") + '</div>';
    $$(".mp-speed-opt", els.panelBody).forEach(el => {
      el.onclick = () => {
        S.speed = parseFloat(el.dataset.speed);
        activeMedia().playbackRate = S.speed;
        updateSpeedUI();
        buildSpeedPanel();
      };
    });
  }

  function buildTimerPanel() {
    const opts = [5,10,15,30,45,60,90,120];
    let remaining = 0;
    if (S.sleepEndTime) {
      remaining = Math.max(0, (S.sleepEndTime - Date.now()) / 1000);
    }
    
    let html = '<div class="mp-timer-grid">' + opts.map(m =>
      `<div class="mp-timer-opt${S.sleepMinutes===m?" active":""}" data-min="${m}">${m} min</div>`
    ).join("") + `<div class="mp-timer-opt${!S.sleepMinutes?" active":""}" data-min="0">Apagar</div></div>`;
    if (remaining > 0) {
      html += `<div class="mp-timer-status">⏱ Quedan ${fmt(remaining)}</div>`;
    }
    els.panelBody.innerHTML = html;
    $$(".mp-timer-opt", els.panelBody).forEach(el => {
      el.onclick = () => {
        const m = parseInt(el.dataset.min);
        clearSleepTimer();
        S.sleepMinutes = m;
        if (m > 0) {
          S.sleepEndTime = Date.now() + (m * 60 * 1000);
          S.sleepTimer = setInterval(() => {
            checkSleepTimer();
            if (S.panelOpen === "timer") buildTimerPanel();
          }, 1000);
        }
        buildTimerPanel();
      };
    });
  }

  function buildSharePanel() {
    const url = S.detailUrl ? window.location.origin + S.detailUrl : window.location.href;
    const t = encodeURIComponent(S.title + " — " + S.author);
    const u = encodeURIComponent(url);
    const shares = [
      { name: "WhatsApp", url: `https://wa.me/?text=${t}%20${u}`, icon: "💬" },
      { name: "Twitter", url: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, icon: "🐦" },
      { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: "👍" },
      { name: "Telegram", url: `https://t.me/share/url?url=${u}&text=${t}`, icon: "📱" },
      { name: "Copiar", url: null, icon: "📋" },
    ];
    els.panelBody.innerHTML = '<div class="mp-share-grid">' + shares.map(s =>
      `<button class="mp-share-btn" data-url="${s.url||""}" data-name="${s.name}"><span style="font-size:28px">${s.icon}</span><span>${s.name}</span></button>`
    ).join("") + '</div>';
    $$(".mp-share-btn", els.panelBody).forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.name === "Copiar") {
          navigator.clipboard.writeText(url).then(() => {
            btn.querySelector("span:last-child").textContent = "¡Copiado!";
            setTimeout(() => btn.querySelector("span:last-child").textContent = "Copiar", 2000);
          });
        } else {
          window.open(btn.dataset.url, "_blank", "width=600,height=400");
        }
      };
    });
  }

  function buildQueuePanel() {
    if (!S.queue || !S.queue.length) {
      els.panelBody.innerHTML = '<p style="opacity:.5;padding:20px;text-align:center">No hay episodios en cola.</p>';
      return;
    }
    els.panelBody.innerHTML = S.queue.map((ep, i) =>
      `<div class="mp-queue-item${i===S.queueIndex?" active":""}" data-qi="${i}">
        <img class="mp-queue-img" src="${ep.coverUrl||""}" alt="" />
        <div class="mp-queue-info">
          <div class="mp-queue-title">${ep.title||""}</div>
          <div class="mp-queue-author">${ep.author||""}</div>
        </div>
      </div>`
    ).join("");
    $$(".mp-queue-item", els.panelBody).forEach(el => {
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
    S.currentTime = 0;
    S.duration = 0;

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

    if (hasAudio) audioEl.src = S.mediaUrl;
    if (hasVideo) videoEl.src = S.mediaVideo;

    audioEl.playbackRate = S.speed;
    videoEl.playbackRate = S.speed;

    updateBg();
    updateMiniInfo();
    updatePlayBtn();
    updateMode();
    updateProgress();
    updateSpeedUI();

    els.mini.classList.add("visible");

    if (S.subtitlesUrl) loadSubtitles(S.subtitlesUrl);
  }

  function playMedia() {
    const media = activeMedia();
    if (!media || !media.src) return;
    media.play().catch(() => {});
    S.playing = true;
    updatePlayBtn();
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

  function seekTo(pct) {
    const media = activeMedia();
    if (media && S.duration) {
      media.currentTime = pct * S.duration;
      S.currentTime = media.currentTime;
      updateProgress();
    }
  }

  function skip(offset) {
    const media = activeMedia();
    if (media && S.duration) {
      media.currentTime = Math.min(S.duration, Math.max(0, media.currentTime + offset));
    }
  }

  function nextTrack() {
    if (!S.queue || !S.queue.length) return;
    let next = S.queueIndex + 1;
    if (next >= S.queue.length) next = S.shuffle ? Math.floor(Math.random() * S.queue.length) : 0;
    if (S.queue[next]) playQueueItem(next);
  }

  function prevTrack() {
    if (!S.queue || !S.queue.length) return;
    let prev = S.queueIndex - 1;
    if (prev < 0) prev = S.queue.length - 1;
    if (S.queue[prev]) playQueueItem(prev);
  }

  function setVolume(v) {
    S.volume = clamp(v, 0, 1);
    S.muted = S.volume === 0;
    activeMedia().volume = S.volume;
    activeMedia().muted = S.muted;
    els.volFill.style.width = (S.volume * 100) + "%";
    els.volBtn.innerHTML = icon(S.muted ? "volMute" : "vol", 20);
  }

  function toggleFullscreen() {
    if (!videoEl) return;
    if (!document.fullscreenElement) {
      videoEl.requestFullscreen().catch(() => {});
      S.videoFullscreen = true;
      showVideoOverlay();
    } else {
      document.exitFullscreen();
      S.videoFullscreen = false;
      hideVideoOverlay();
    }
  }
  
  function showVideoOverlay() {
    els.videoOverlay.classList.add("active");
    updateOverlayProgress();
  }
  
  function hideVideoOverlay() {
    els.videoOverlay.classList.remove("active");
  }
  
  function updateOverlayProgress() {
    const pct = S.duration ? (S.currentTime / S.duration) * 100 : 0;
    els.overlayProgressFill.style.width = pct + "%";
    els.overlayCurrent.textContent = fmt(S.currentTime);
    els.overlayDuration.textContent = fmt(S.duration);
  }

  /* ── Subtitles ─────────────────────────────────────────── */
  function loadSubtitles(url) {
    S.subtitlesCues = [];
    fetch(url).then(r => r.ok ? r.text() : "").then(txt => {
      if (!txt) return;
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

  function updateSubtitles() {
    if (S.subtitlesOn && S.subtitlesCues.length) {
      const cue = getCurrentCue(S.currentTime);
      els.expSubs.textContent = cue;
      els.expSubs.style.display = cue ? "block" : "none";
    } else {
      els.expSubs.style.display = "none";
    }
  }

  /* ── Expand / Collapse ─────────────────────────────────── */
  function expand() {
    S.expanded = true;
    els.exp.classList.add("open");
    document.body.style.overflow = "hidden";
    updateMode();
    
    if (S.pendingPanel) {
      setTimeout(() => {
        openPanel(S.pendingPanel);
        S.pendingPanel = null;
      }, 400);
    }
  }

  function collapse() {
    S.expanded = false;
    els.exp.classList.remove("open");
    closePanel();
    document.body.style.overflow = "";
    S.pendingPanel = null;
  }

  function toggleExpand() {
    if (S.expanded) {
      collapse();
    } else {
      expand();
    }
  }

  /* ── Events ────────────────────────────────────────────── */
  function bindEvents() {
    els.playBtn.onclick = togglePlay;
    els.prevBtn.onclick = prevTrack;
    els.nextBtn.onclick = nextTrack;
    els.rewindBtn.onclick = () => skip(-15);
    els.forwardBtn.onclick = () => skip(15);
    
    els.repeatBtn.onclick = () => {
      S.repeat = !S.repeat;
      updateRepeatUI();
    };
    els.shuffleBtn.onclick = () => {
      S.shuffle = !S.shuffle;
      updateShuffleUI();
    };
    
    els.likeBtn.onclick = () => {
      S.liked = !S.liked;
      updateLikeUI();
    };
    
    els.speedBtn.onclick = () => openPanelWithExpand("speed");
    els.timerBtn.onclick = () => openPanelWithExpand("timer");
    els.addBtn.onclick = () => openPanelWithExpand("queue");
    els.expandBtn.onclick = toggleExpand;
    
    els.panelClose.onclick = closePanel;
    
    els.miniProg.onclick = (e) => {
      const r = els.miniProg.getBoundingClientRect();
      seekTo((e.clientX - r.left) / r.width);
    };
    
    els.volBtn.onclick = () => { setVolume(S.muted ? (S.volume || 1) : 0); };
    els.volBar.onclick = (e) => {
      const r = els.volBar.getBoundingClientRect();
      setVolume((e.clientX - r.left) / r.width);
    };
    
    // Fullscreen overlay controls
    els.overlayPlay.onclick = togglePlay;
    els.overlayPrev.onclick = prevTrack;
    els.overlayNext.onclick = nextTrack;
    els.overlayExit.onclick = toggleFullscreen;
    els.overlayProgress.onclick = (e) => {
      const r = els.overlayProgress.getBoundingClientRect();
      seekTo((e.clientX - r.left) / r.width);
    };
    
    // Close expanded with close button
    const closeBtn = ce("button", "mp-panel-close");
    closeBtn.style.cssText = "position:absolute;top:20px;left:20px;z-index:15;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);border-radius:50%;padding:10px";
    closeBtn.innerHTML = icon("close", 24);
    els.exp.appendChild(closeBtn);
    closeBtn.onclick = collapse;
    
    // Video hover for fullscreen button
    videoEl.addEventListener("mouseenter", () => {
      if (S.mode === "video" && !S.videoFullscreen) {
        const fsBtn = $("#mp-video-fs-btn");
        if (fsBtn) fsBtn.style.opacity = "1";
      }
    });
    
    videoEl.addEventListener("click", () => {
      if (S.mode === "video") togglePlay();
    });
    
    // Media events
    function onTimeUpdate() {
      if (S.seekDragging) return;
      const m = activeMedia();
      S.currentTime = m.currentTime;
      S.duration = m.duration || 0;
      updateProgress();
      if (S.subtitlesUrl) updateSubtitles();
      if (els.videoOverlay.classList.contains("active")) updateOverlayProgress();
    }
    
    function onEnded() {
      if (S.repeat) {
        activeMedia().currentTime = 0;
        playMedia();
      } else {
        nextTrack();
      }
    }
    
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("loadedmetadata", () => { S.duration = audioEl.duration; updateProgress(); });
    videoEl.addEventListener("loadedmetadata", () => { S.duration = videoEl.duration; updateProgress(); });
    audioEl.addEventListener("ended", onEnded);
    videoEl.addEventListener("ended", onEnded);
    
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (!els.mini.classList.contains("visible")) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") skip(10);
      if (e.code === "ArrowLeft") skip(-10);
      if (e.code === "ArrowUp") { e.preventDefault(); setVolume(S.volume + 0.1); }
      if (e.code === "ArrowDown") { e.preventDefault(); setVolume(S.volume - 0.1); }
      if (e.code === "KeyF") { e.preventDefault(); toggleFullscreen(); }
    });
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { buildUI(); refs(); bindEvents(); });
  } else {
    buildUI(); refs(); bindEvents();
  }
})();
