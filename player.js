/**
 * Mobile Media Player — Spotify + YouTube Music Style
 * Touch gestures, Media Session API, dynamic colors, subtitles
 * Single standalone file — attach via <script src="player-mobile.js"></script>
 *
 * API: window.playEpisodeExpanded(mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload)
 */
(function () {
  'use strict';

  /* ─── helpers ─── */
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];
  const ce = (t) => document.createElement(t);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec < 10 ? '0' : ''}${sec}`; };
  function hexToHSL(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function luminance(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  function textColor(hex) { return luminance(hex) > 0.55 ? '#111' : '#fff'; }
  function textColorSub(hex) { return luminance(hex) > 0.55 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'; }

  /* ─── SVG icons ─── */
  const icons = {
    play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>`,
    prev: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>`,
    next: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2zM5.5 12 14 6v12z" transform="rotate(180 12 12)"/></svg>`,
    rewind: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="bold" fill="currentColor">10</text></svg>`,
    forward: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="bold" fill="currentColor">10</text></svg>`,
    chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    queue: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/></svg>`,
    speed: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003 12a10 10 0 0020 0c0-1.22-.22-2.39-.62-3.43zM12 8v4l3 3"/></svg>`,
    timer: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 000-6 3 3 0 00-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 000 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.88 2.88 0 002.88 2.88A2.88 2.88 0 0020.88 19a2.88 2.88 0 00-2.88-2.92z"/></svg>`,
    subtitle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    video: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`,
    audio: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,
    repeat: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
    shuffle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  };

  /* ─── STYLES ─── */
  const style = ce('style');
  style.textContent = `
/* Reset for player */
.mp-m *, .mp-m *::before, .mp-m *::after { box-sizing: border-box; margin: 0; padding: 0; }
.mp-m { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-tap-highlight-color: transparent; }
.mp-m button { background: none; border: none; cursor: pointer; outline: none; color: inherit; -webkit-tap-highlight-color: transparent; }
.mp-m svg { width: 100%; height: 100%; display: block; }

/* Mini bar */
.mp-mini-m {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
  height: 64px; display: flex; align-items: center;
  padding: 0 8px; gap: 10px;
  transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.25);
  will-change: transform;
}
.mp-mini-m.hidden { transform: translateY(100%); opacity: 0; pointer-events: none; }
.mp-mini-m .mp-mini-cover { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.mp-mini-m .mp-mini-info { flex: 1; min-width: 0; }
.mp-mini-m .mp-mini-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-mini-m .mp-mini-author { font-size: 11px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-mini-m .mp-mini-btn { width: 36px; height: 36px; padding: 6px; flex-shrink: 0; border-radius: 50%; }
.mp-mini-m .mp-mini-btn:active { opacity: 0.5; }
.mp-mini-m .mp-mini-progress { position: absolute; top: 0; left: 0; right: 0; height: 2.5px; background: rgba(255,255,255,0.15); }
.mp-mini-m .mp-mini-progress-fill { height: 100%; width: 0%; transition: width 0.3s linear; }

/* Expanded */
.mp-exp-m {
  position: fixed; inset: 0; z-index: 100000;
  display: flex; flex-direction: column;
  transition: transform 0.38s cubic-bezier(0.4,0,0.2,1);
  transform: translateY(100%);
  overflow: hidden;
  will-change: transform;
}
.mp-exp-m.open { transform: translateY(0); }
.mp-exp-m.dragging { transition: none; }

/* Drag handle */
.mp-exp-handle {
  width: 100%; display: flex; justify-content: center; padding: 10px 0 4px; flex-shrink: 0;
}
.mp-exp-handle span { width: 36px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.35); }

/* Header row */
.mp-exp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px 8px; flex-shrink: 0;
}
.mp-exp-header button { width: 32px; height: 32px; padding: 4px; border-radius: 50%; }
.mp-exp-header button:active { background: rgba(255,255,255,0.1); }

/* Media area */
.mp-media-area {
  flex: 1; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; min-height: 0;
  padding: 0 24px;
}
.mp-media-area img {
  max-width: 100%; max-height: 100%; border-radius: 12px;
  object-fit: cover; box-shadow: 0 8px 40px rgba(0,0,0,0.35);
  aspect-ratio: 1; width: min(85vw, 360px);
}
.mp-media-area video {
  max-width: 100%; max-height: 100%; border-radius: 8px;
  object-fit: contain; background: #000;
}
.mp-subtitles-overlay {
  position: absolute; bottom: 16px; left: 16px; right: 16px;
  text-align: center; font-size: 15px; font-weight: 500;
  text-shadow: 0 1px 6px rgba(0,0,0,0.7);
  padding: 6px 12px; border-radius: 6px;
  background: rgba(0,0,0,0.45); line-height: 1.4;
}
/* Subtitle full screen (audio mode) */
.mp-subtitle-full {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; padding: 24px;
  text-align: center; font-size: 22px; font-weight: 600;
  line-height: 1.5; letter-spacing: 0.01em;
}

/* Controls area */
.mp-controls-area { flex-shrink: 0; padding: 0 20px 8px; }
.mp-track-info { text-align: center; margin-bottom: 12px; }
.mp-track-title { font-size: 18px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-track-author { font-size: 13px; opacity: 0.6; }
.mp-track-author a { color: inherit; text-decoration: underline; opacity: 0.8; }

/* Progress bar */
.mp-progress-wrap { margin-bottom: 8px; position: relative; padding: 8px 0; }
.mp-progress-track { width: 100%; height: 3px; border-radius: 3px; background: rgba(255,255,255,0.2); position: relative; overflow: visible; }
.mp-progress-fill { height: 100%; border-radius: 3px; position: relative; width: 0%; transition: width 0.15s linear; }
.mp-progress-thumb {
  position: absolute; right: -7px; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.3);
  opacity: 0; transition: opacity 0.2s;
}
.mp-progress-wrap.active .mp-progress-thumb { opacity: 1; }
.mp-progress-wrap.active .mp-progress-track { height: 5px; }
.mp-times { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.5; margin-top: 4px; }

/* Main control buttons */
.mp-main-btns { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 10px; }
.mp-main-btns button { border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.mp-main-btns button:active { transform: scale(0.9); }
.mp-ctrl-sm { width: 36px; height: 36px; padding: 7px; }
.mp-ctrl-md { width: 44px; height: 44px; padding: 8px; }
.mp-ctrl-play { width: 58px; height: 58px; padding: 12px; border-radius: 50%; }

/* Extra buttons row */
.mp-extra-btns { display: flex; align-items: center; justify-content: space-around; padding: 4px 8px 6px; }
.mp-extra-btns button { width: 34px; height: 34px; padding: 6px; border-radius: 50%; opacity: 0.7; position: relative; }
.mp-extra-btns button.active { opacity: 1; }
.mp-extra-btns button:active { opacity: 0.5; }
.mp-extra-btns .mp-badge {
  position: absolute; top: 0; right: 0; font-size: 8px; font-weight: 700;
  background: currentColor; width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

/* Panel overlay */
.mp-panel-m {
  position: absolute; bottom: 0; left: 0; right: 0;
  max-height: 65vh; border-radius: 16px 16px 0 0;
  background: rgba(30,30,30,0.97); color: #fff;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  z-index: 10; overflow: hidden;
  display: flex; flex-direction: column;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}
.mp-panel-m.open { transform: translateY(0); }
.mp-panel-m.dragging { transition: none; }
.mp-panel-handle { display: flex; justify-content: center; padding: 10px 0 6px; flex-shrink: 0; }
.mp-panel-handle span { width: 36px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.3); }
.mp-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 0 16px 10px; flex-shrink: 0; }
.mp-panel-head h3 { font-size: 16px; font-weight: 700; }
.mp-panel-head button { width: 28px; height: 28px; padding: 4px; border-radius: 50%; }
.mp-panel-body { flex: 1; overflow-y: auto; padding: 0 16px 24px; -webkit-overflow-scrolling: touch; }

/* Queue item */
.mp-queue-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
}
.mp-queue-item:active { background: rgba(255,255,255,0.06); }
.mp-queue-item img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
.mp-queue-item .qi-info { flex: 1; min-width: 0; }
.mp-queue-item .qi-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-queue-item .qi-author { font-size: 12px; opacity: 0.5; }
.mp-queue-item.playing { background: rgba(255,255,255,0.08); }

/* Speed options */
.mp-speed-opt {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 4px; border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 15px; font-weight: 500;
}
.mp-speed-opt.active { font-weight: 700; }
.mp-speed-opt .dot { width: 8px; height: 8px; border-radius: 50%; background: #1db954; display: none; }
.mp-speed-opt.active .dot { display: block; }

/* Timer options */
.mp-timer-opt { display: flex; align-items: center; justify-content: space-between; padding: 14px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 15px; }
.mp-timer-opt.active { font-weight: 700; }
.mp-timer-opt .check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; }
.mp-timer-opt.active .check { border-color: #1db954; background: #1db954; }
.mp-timer-opt.active .check::after { content: '✓'; color: #000; font-size: 12px; font-weight: 700; }

/* Share buttons */
.mp-share-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 8px 0; }
.mp-share-item { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; opacity: 0.8; }
.mp-share-item button { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.mp-share-item button:active { transform: scale(0.9); }

/* Info panel */
.mp-info-content { font-size: 14px; line-height: 1.7; opacity: 0.8; padding: 4px 0; }

/* Animations */
@keyframes mp-spin { to { transform: rotate(360deg); } }
@keyframes mp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.mp-loading { animation: mp-pulse 1.5s ease-in-out infinite; }

/* Safe area */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .mp-mini-m { padding-bottom: env(safe-area-inset-bottom); height: calc(64px + env(safe-area-inset-bottom)); }
  .mp-controls-area { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
}

/* Landscape */
@media (orientation: landscape) and (max-height: 500px) {
  .mp-media-area img { width: min(40vw, 200px); }
  .mp-exp-m { flex-direction: row; }
  .mp-media-area { width: 45%; }
  .mp-controls-area { width: 55%; padding-top: 16px; }
}
`;
  document.head.appendChild(style);

  /* ─── State ─── */
  const state = {
    mediaUrl: '', mediaVideo: '', mode: 'audio',
    coverUrl: '', coverInfo: '', title: '', detailUrl: '',
    author: '', queue: [], text: '', subtitlesUrl: '',
    bgColor: '#1a1a2e', allowDownload: false,
    isPlaying: false, isExpanded: false,
    currentTime: 0, duration: 0,
    playbackRate: 1, subtitlesOn: false,
    repeat: 0, shuffle: false,
    timerEnd: null, timerType: null,
    cues: [], currentCue: '',
    queueIndex: -1,
    initialized: false,
  };

  /* ─── Audio/Video elements ─── */
  const audioEl = new Audio();
  audioEl.preload = 'metadata';
  const videoEl = ce('video');
  videoEl.preload = 'metadata';
  videoEl.playsInline = true;
  videoEl.setAttribute('playsinline', '');
  videoEl.setAttribute('webkit-playsinline', '');

  function activeMedia() { return state.mode === 'video' ? videoEl : audioEl; }

  /* ─── Build DOM ─── */
  const root = ce('div');
  root.className = 'mp-m';

  // Mini player
  const mini = ce('div');
  mini.className = 'mp-mini-m hidden';
  mini.innerHTML = `
    <div class="mp-mini-progress"><div class="mp-mini-progress-fill"></div></div>
    <img class="mp-mini-cover" src="" alt="">
    <div class="mp-mini-info">
      <div class="mp-mini-title"></div>
      <div class="mp-mini-author"></div>
    </div>
    <button class="mp-mini-btn mp-mini-play" aria-label="Play">${icons.play}</button>
    <button class="mp-mini-btn mp-mini-next" aria-label="Next">${icons.next}</button>
  `;

  // Expanded
  const exp = ce('div');
  exp.className = 'mp-exp-m';
  exp.innerHTML = `
    <div class="mp-exp-handle"><span></span></div>
    <div class="mp-exp-header">
      <button class="mp-btn-collapse" aria-label="Minimize">${icons.chevronDown}</button>
      <span class="mp-exp-source" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;opacity:0.7;">Reproduciendo</span>
      <button class="mp-btn-more" aria-label="More">${icons.more}</button>
    </div>
    <div class="mp-media-area">
      <img class="mp-exp-cover" src="" alt="">
    </div>
    <div class="mp-controls-area">
      <div class="mp-track-info">
        <div class="mp-track-title"></div>
        <div class="mp-track-author"></div>
      </div>
      <div class="mp-progress-wrap">
        <div class="mp-progress-track"><div class="mp-progress-fill"><div class="mp-progress-thumb"></div></div></div>
        <div class="mp-times"><span class="mp-time-cur">0:00</span><span class="mp-time-dur">0:00</span></div>
      </div>
      <div class="mp-main-btns">
        <button class="mp-ctrl-sm mp-btn-shuffle" aria-label="Shuffle">${icons.shuffle}</button>
        <button class="mp-ctrl-md mp-btn-prev" aria-label="Previous">${icons.prev}</button>
        <button class="mp-ctrl-sm mp-btn-rew" aria-label="Rewind 10s">${icons.rewind}</button>
        <button class="mp-ctrl-play mp-btn-play" aria-label="Play">${icons.play}</button>
        <button class="mp-ctrl-sm mp-btn-fwd" aria-label="Forward 10s">${icons.forward}</button>
        <button class="mp-ctrl-md mp-btn-next" aria-label="Next">${icons.next}</button>
        <button class="mp-ctrl-sm mp-btn-repeat" aria-label="Repeat">${icons.repeat}</button>
      </div>
      <div class="mp-extra-btns">
        <button class="mp-btn-mode" aria-label="Mode">${icons.video}</button>
        <button class="mp-btn-subtitle" aria-label="Subtitles">${icons.subtitle}</button>
        <button class="mp-btn-speed" aria-label="Speed">${icons.speed}</button>
        <button class="mp-btn-timer" aria-label="Timer">${icons.timer}</button>
        <button class="mp-btn-queue" aria-label="Queue">${icons.queue}</button>
        <button class="mp-btn-share" aria-label="Share">${icons.share}</button>
      </div>
    </div>
    <div class="mp-panel-m">
      <div class="mp-panel-handle"><span></span></div>
      <div class="mp-panel-head"><h3></h3><button class="mp-panel-close">${icons.close}</button></div>
      <div class="mp-panel-body"></div>
    </div>
  `;

  root.appendChild(mini);
  root.appendChild(exp);
  document.body.appendChild(root);

  /* ─── Element references ─── */
  const els = {
    mini, exp,
    miniCover: $('.mp-mini-cover', mini),
    miniTitle: $('.mp-mini-title', mini),
    miniAuthor: $('.mp-mini-author', mini),
    miniPlay: $('.mp-mini-play', mini),
    miniNext: $('.mp-mini-next', mini),
    miniProgressFill: $('.mp-mini-progress-fill', mini),
    expCover: $('.mp-exp-cover', exp),
    mediaArea: $('.mp-media-area', exp),
    trackTitle: $('.mp-track-title', exp),
    trackAuthor: $('.mp-track-author', exp),
    progressWrap: $('.mp-progress-wrap', exp),
    progressTrack: $('.mp-progress-track', exp),
    progressFill: $('.mp-progress-fill', exp),
    progressThumb: $('.mp-progress-thumb', exp),
    timeCur: $('.mp-time-cur', exp),
    timeDur: $('.mp-time-dur', exp),
    btnPlay: $('.mp-btn-play', exp),
    btnPrev: $('.mp-btn-prev', exp),
    btnNext: $('.mp-btn-next', exp),
    btnRew: $('.mp-btn-rew', exp),
    btnFwd: $('.mp-btn-fwd', exp),
    btnShuffle: $('.mp-btn-shuffle', exp),
    btnRepeat: $('.mp-btn-repeat', exp),
    btnCollapse: $('.mp-btn-collapse', exp),
    btnMore: $('.mp-btn-more', exp),
    btnMode: $('.mp-btn-mode', exp),
    btnSubtitle: $('.mp-btn-subtitle', exp),
    btnSpeed: $('.mp-btn-speed', exp),
    btnTimer: $('.mp-btn-timer', exp),
    btnQueue: $('.mp-btn-queue', exp),
    btnShare: $('.mp-btn-share', exp),
    panel: $('.mp-panel-m', exp),
    panelHead: $('.mp-panel-head h3', exp),
    panelBody: $('.mp-panel-body', exp),
    panelClose: $('.mp-panel-close', exp),
    handle: $('.mp-exp-handle', exp),
  };

  /* ─── Colors ─── */
  function applyColors(hex) {
    const tc = textColor(hex);
    const tcs = textColorSub(hex);
    const hsl = hexToHSL(hex);
    const bg1 = `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, ${clamp(hsl.l - 15, 5, 35)}%)`;
    const bg2 = `hsl(${hsl.h}, ${Math.min(hsl.s + 5, 100)}%, ${clamp(hsl.l - 30, 3, 20)}%)`;
    const grad = `linear-gradient(180deg, ${hex} 0%, ${bg1} 45%, ${bg2} 100%)`;

    exp.style.background = grad;
    exp.style.color = tc;
    mini.style.background = bg1;
    mini.style.color = tc;

    els.miniProgressFill.style.background = tc;
    els.progressFill.style.background = tc;
    els.progressThumb.style.background = tc;

    const playBg = luminance(hex) > 0.55 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
    const playFg = luminance(hex) > 0.55 ? '#fff' : '#000';
    els.btnPlay.style.background = playBg;
    els.btnPlay.style.color = playFg;

    els.timeCur.style.color = tcs;
    els.timeDur.style.color = tcs;
  }

  /* ─── Subtitles ─── */
  async function loadSubtitles(url) {
    state.cues = [];
    if (!url) return;
    try {
      const res = await fetch(url);
      const txt = await res.text();
      // parse VTT/SRT
      const blocks = txt.split(/\n\s*\n/);
      for (const block of blocks) {
        const lines = block.trim().split('\n');
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
          if (match) {
            const start = +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000;
            const end = +match[5] * 3600 + +match[6] * 60 + +match[7] + +match[8] / 1000;
            const text = lines.slice(i + 1).join('\n').replace(/<[^>]+>/g, '').trim();
            if (text) state.cues.push({ start, end, text });
            break;
          }
        }
      }
    } catch (e) { console.warn('Subtitle load failed:', e); }
  }

  function getCurrentCue(time) {
    for (const c of state.cues) { if (time >= c.start && time <= c.end) return c.text; }
    return '';
  }

  /* ─── Media Session API ─── */
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.title,
      artist: state.author,
      artwork: [{ src: state.coverUrl, sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekbackward', () => seek(-10));
    navigator.mediaSession.setActionHandler('seekforward', () => seek(10));
    try {
      navigator.mediaSession.setActionHandler('seekto', (d) => {
        if (d.seekTime != null) { activeMedia().currentTime = d.seekTime; }
      });
    } catch (e) {}
  }

  function updatePositionState() {
    if (!('mediaSession' in navigator) || !state.duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: state.playbackRate,
        position: Math.min(state.currentTime, state.duration),
      });
    } catch (e) {}
  }

  /* ─── Playback ─── */
  function togglePlay() {
    const m = activeMedia();
    if (m.paused) { m.play().catch(() => {}); }
    else { m.pause(); }
  }
  function seek(delta) { const m = activeMedia(); m.currentTime = clamp(m.currentTime + delta, 0, m.duration || 0); }
  function setRate(r) {
    state.playbackRate = r;
    audioEl.playbackRate = r;
    videoEl.playbackRate = r;
  }

  function switchMode(mode) {
    if (mode === state.mode) return;
    const wasPlaying = !activeMedia().paused;
    const pos = activeMedia().currentTime;
    activeMedia().pause();
    state.mode = mode;
    const m = activeMedia();
    if (m.readyState < 1) {
      m.addEventListener('loadedmetadata', function once() {
        m.removeEventListener('loadedmetadata', once);
        m.currentTime = pos;
        if (wasPlaying) m.play().catch(() => {});
      });
    } else {
      m.currentTime = pos;
      if (wasPlaying) m.play().catch(() => {});
    }
    updateMediaArea();
    updateModeBtn();
  }

  function updateModeBtn() {
    if (!state.mediaUrl || !state.mediaVideo) {
      els.btnMode.style.display = 'none';
      return;
    }
    els.btnMode.style.display = '';
    els.btnMode.innerHTML = state.mode === 'video' ? icons.audio : icons.video;
    els.btnMode.setAttribute('aria-label', state.mode === 'video' ? 'Switch to Audio' : 'Switch to Video');
  }

  function updateMediaArea() {
    const area = els.mediaArea;
    // remove video if present
    if (videoEl.parentNode === area) area.removeChild(videoEl);
    // remove subtitle container
    const existingSub = $('.mp-subtitles-overlay', area) || $('.mp-subtitle-full', area);
    if (existingSub) existingSub.remove();

    if (state.mode === 'video') {
      els.expCover.style.display = 'none';
      area.insertBefore(videoEl, area.firstChild);
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      // subtitles overlay on video
      if (state.subtitlesOn && state.cues.length) {
        const sub = ce('div');
        sub.className = 'mp-subtitles-overlay';
        area.appendChild(sub);
      }
    } else {
      els.expCover.style.display = '';
      if (state.subtitlesOn && state.cues.length) {
        els.expCover.style.display = 'none';
        const sub = ce('div');
        sub.className = 'mp-subtitle-full';
        area.appendChild(sub);
      }
    }
  }

  /* ─── UI Updates ─── */
  function updateUI() {
    // mini
    els.miniCover.src = state.coverUrl;
    els.miniTitle.textContent = state.title;
    els.miniAuthor.textContent = state.author;
    // expanded
    els.expCover.src = state.coverUrl;
    els.trackTitle.textContent = state.title;
    els.trackAuthor.innerHTML = state.detailUrl
      ? `<a href="${state.detailUrl}">${state.author}</a>`
      : state.author;
  }

  function updatePlayBtn() {
    const icon = state.isPlaying ? icons.pause : icons.play;
    els.btnPlay.innerHTML = icon;
    els.miniPlay.innerHTML = icon;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
    }
  }

  function updateProgress() {
    const pct = state.duration ? (state.currentTime / state.duration) * 100 : 0;
    els.progressFill.style.width = pct + '%';
    els.miniProgressFill.style.width = pct + '%';
    els.timeCur.textContent = fmt(state.currentTime);
    els.timeDur.textContent = fmt(state.duration);
    // subtitles
    if (state.subtitlesOn && state.cues.length) {
      const cue = getCurrentCue(state.currentTime);
      state.currentCue = cue;
      const subEl = $('.mp-subtitles-overlay', els.mediaArea) || $('.mp-subtitle-full', els.mediaArea);
      if (subEl) subEl.textContent = cue;
    }
  }

  /* ─── Expand / Collapse ─── */
  function expand() {
    state.isExpanded = true;
    exp.classList.add('open');
    mini.classList.add('hidden');
    document.body.style.overflow = 'hidden';
  }
  function collapse() {
    state.isExpanded = false;
    exp.classList.remove('open');
    mini.classList.remove('hidden');
    closePanel();
    document.body.style.overflow = '';
  }

  /* ─── Panels ─── */
  function openPanel(title, contentFn) {
    els.panelHead.textContent = title;
    els.panelBody.innerHTML = '';
    contentFn(els.panelBody);
    els.panel.classList.add('open');
  }
  function closePanel() { els.panel.classList.remove('open'); }

  function buildQueuePanel(body) {
    if (!state.queue.length) {
      body.innerHTML = '<p style="opacity:0.5;padding:20px 0;text-align:center;">No hay episodios en cola</p>';
      return;
    }
    state.queue.forEach((ep, i) => {
      const item = ce('div');
      item.className = 'mp-queue-item' + (i === state.queueIndex ? ' playing' : '');
      item.innerHTML = `
        <img src="${ep.coverUrl || state.coverUrl}" alt="">
        <div class="qi-info">
          <div class="qi-title">${ep.title}</div>
          <div class="qi-author">${ep.author || ''}</div>
        </div>
      `;
      item.addEventListener('click', () => { state.queueIndex = i; playQueueItem(i); });
      body.appendChild(item);
    });
  }

  function buildSpeedPanel(body) {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    speeds.forEach(s => {
      const opt = ce('div');
      opt.className = 'mp-speed-opt' + (state.playbackRate === s ? ' active' : '');
      opt.innerHTML = `<span>${s === 1 ? 'Normal' : s + 'x'}</span><div class="dot"></div>`;
      opt.addEventListener('click', () => {
        setRate(s);
        $$('.mp-speed-opt', body).forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        updateSpeedBadge();
      });
      body.appendChild(opt);
    });
  }

  function updateSpeedBadge() {
    const existing = $('.mp-badge', els.btnSpeed);
    if (existing) existing.remove();
    if (state.playbackRate !== 1) {
      const badge = ce('span');
      badge.className = 'mp-badge';
      badge.style.color = els.btnPlay.style.background;
      badge.style.background = els.btnPlay.style.color;
      badge.textContent = state.playbackRate + '';
      els.btnSpeed.appendChild(badge);
    }
  }

  function buildTimerPanel(body) {
    const options = [
      { label: 'Desactivado', mins: 0 },
      { label: '5 minutos', mins: 5 },
      { label: '10 minutos', mins: 10 },
      { label: '15 minutos', mins: 15 },
      { label: '30 minutos', mins: 30 },
      { label: '45 minutos', mins: 45 },
      { label: '1 hora', mins: 60 },
      { label: 'Fin del episodio', mins: -1 },
    ];
    const activeType = state.timerType;
    options.forEach(opt => {
      const el = ce('div');
      const isActive = (opt.mins === 0 && !state.timerEnd && !state.timerType) ||
                        (opt.mins === -1 && state.timerType === 'end') ||
                        (opt.mins > 0 && state.timerType === opt.mins);
      el.className = 'mp-timer-opt' + (isActive ? ' active' : '');
      el.innerHTML = `<span>${opt.label}${state.timerEnd && opt.mins > 0 && state.timerType === opt.mins ? ' (' + fmt(Math.max(0, (state.timerEnd - Date.now()) / 1000)) + ')' : ''}</span><div class="check"></div>`;
      el.addEventListener('click', () => {
        if (opt.mins === 0) { state.timerEnd = null; state.timerType = null; }
        else if (opt.mins === -1) { state.timerEnd = null; state.timerType = 'end'; }
        else { state.timerEnd = Date.now() + opt.mins * 60000; state.timerType = opt.mins; }
        closePanel();
      });
      body.appendChild(el);
    });
  }

  function buildSharePanel(body) {
    const url = state.detailUrl ? (location.origin + state.detailUrl) : location.href;
    const shareData = [
      { name: 'Copiar', icon: '📋', action: () => { navigator.clipboard.writeText(url).then(() => {}); } },
      { name: 'WhatsApp', icon: '💬', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(state.title + ' ' + url)}`) },
      { name: 'Twitter', icon: '𝕏', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(state.title)}&url=${encodeURIComponent(url)}`) },
      { name: 'Facebook', icon: '📘', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`) },
      { name: 'Telegram', icon: '✈️', action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(state.title)}`) },
      { name: 'Email', icon: '✉️', action: () => window.open(`mailto:?subject=${encodeURIComponent(state.title)}&body=${encodeURIComponent(url)}`) },
    ];
    // native share first if available
    if (navigator.share) {
      shareData.unshift({
        name: 'Compartir',
        icon: '📤',
        action: () => navigator.share({ title: state.title, url }).catch(() => {}),
      });
    }
    const grid = ce('div');
    grid.className = 'mp-share-grid';
    shareData.forEach(s => {
      const item = ce('div');
      item.className = 'mp-share-item';
      item.innerHTML = `<button style="background:rgba(255,255,255,0.1);font-size:22px;">${s.icon}</button><span>${s.name}</span>`;
      $('button', item).addEventListener('click', () => { s.action(); closePanel(); });
      grid.appendChild(item);
    });
    body.appendChild(grid);
  }

  function buildInfoPanel(body) {
    body.innerHTML = `
      <div class="mp-info-content">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
          <img src="${state.coverInfo || state.coverUrl}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;" alt="">
          <div>
            <div style="font-size:16px;font-weight:700;">${state.title}</div>
            <div style="font-size:13px;opacity:0.6;margin-top:4px;">${state.author}</div>
          </div>
        </div>
        <div style="white-space:pre-wrap;">${state.text || 'Sin descripción disponible.'}</div>
        ${state.allowDownload ? `<div style="margin-top:16px;"><button class="mp-dl-btn" style="display:flex;align-items:center;gap:8px;padding:12px 20px;background:rgba(255,255,255,0.1);border-radius:8px;font-size:14px;font-weight:600;width:100%;justify-content:center;"><span style="width:20px;height:20px;">${icons.download}</span>Descargar</button></div>` : ''}
      </div>
    `;
    const dlBtn = $('.mp-dl-btn', body);
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        const url = state.mode === 'video' && state.mediaVideo ? state.mediaVideo : state.mediaUrl;
        const a = ce('a'); a.href = url; a.download = state.title; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
    }
  }

  /* ─── Queue playback ─── */
  function playQueueItem(idx) {
    if (idx < 0 || idx >= state.queue.length) return;
    const ep = state.queue[idx];
    state.queueIndex = idx;
    loadEpisode(
      ep.mediaUrl || '', ep.mediaVideo || '', ep.initialMode || 'audio',
      ep.coverUrl || '', ep.coverInfo || '', ep.title || '',
      ep.detailUrl || '', ep.author || '', state.queue,
      ep.text || '', ep.subtitlesUrl || '', ep.bgColor || '#1a1a2e',
      ep.allowDownload || false
    );
    closePanel();
  }

  function playNext() {
    if (!state.queue.length) return;
    let next = state.queueIndex + 1;
    if (state.shuffle) next = Math.floor(Math.random() * state.queue.length);
    if (next >= state.queue.length) {
      if (state.repeat === 2) next = 0; else return;
    }
    playQueueItem(next);
  }
  function playPrev() {
    if (activeMedia().currentTime > 3) { activeMedia().currentTime = 0; return; }
    if (!state.queue.length) return;
    let prev = state.queueIndex - 1;
    if (prev < 0) prev = state.repeat === 2 ? state.queue.length - 1 : 0;
    playQueueItem(prev);
  }

  /* ─── Gestures ─── */
  function setupGestures() {
    let startY = 0, startX = 0, dy = 0, isDragging = false, target = null;

    // Expand gesture on mini player (swipe up)
    mini.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }, { passive: true });
    mini.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const diffY = startY - endY;
      const diffX = Math.abs(endX - startX);
      if (diffY > 40 && diffX < 80) expand();
    }, { passive: true });
    // Tap on mini to expand
    mini.addEventListener('click', (e) => {
      if (e.target.closest('.mp-mini-btn')) return;
      expand();
    });

    // Collapse gesture on expanded (swipe down from handle/header)
    const dragTarget = els.handle;
    dragTarget.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      dy = 0;
      exp.classList.add('dragging');
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      dy = e.touches[0].clientY - startY;
      if (dy < 0) dy = 0;
      exp.style.transform = `translateY(${dy}px)`;
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      exp.classList.remove('dragging');
      if (dy > 120) {
        collapse();
        exp.style.transform = '';
      } else {
        exp.style.transform = '';
      }
      dy = 0;
    }, { passive: true });

    // Panel drag-to-close
    let panelDragging = false, panelDy = 0, panelStartY = 0;
    const ph = $('.mp-panel-handle', exp);
    ph.addEventListener('touchstart', (e) => {
      panelStartY = e.touches[0].clientY;
      panelDragging = true;
      panelDy = 0;
      els.panel.classList.add('dragging');
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!panelDragging) return;
      panelDy = e.touches[0].clientY - panelStartY;
      if (panelDy < 0) panelDy = 0;
      els.panel.style.transform = `translateY(${panelDy}px)`;
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (!panelDragging) return;
      panelDragging = false;
      els.panel.classList.remove('dragging');
      if (panelDy > 80) {
        closePanel();
      }
      els.panel.style.transform = '';
      panelDy = 0;
    }, { passive: true });

    // Swipe up from bottom of expanded → open queue panel
    let expBottomStartY = 0;
    const ctrlArea = $('.mp-controls-area', exp);
    ctrlArea.addEventListener('touchstart', (e) => {
      expBottomStartY = e.touches[0].clientY;
    }, { passive: true });
    ctrlArea.addEventListener('touchend', (e) => {
      const diffY = expBottomStartY - e.changedTouches[0].clientY;
      if (diffY > 60 && !els.panel.classList.contains('open')) {
        openPanel('A continuación', buildQueuePanel);
      }
    }, { passive: true });
  }

  /* ─── Progress bar touch ─── */
  function setupProgressTouch() {
    let seeking = false;
    const wrap = els.progressWrap;
    const track = els.progressTrack;

    function getPos(e) {
      const rect = track.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return clamp(x / rect.width, 0, 1);
    }

    wrap.addEventListener('touchstart', (e) => {
      seeking = true;
      wrap.classList.add('active');
      const pct = getPos(e);
      activeMedia().currentTime = pct * (state.duration || 0);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!seeking) return;
      const pct = getPos(e);
      els.progressFill.style.width = (pct * 100) + '%';
      els.timeCur.textContent = fmt(pct * (state.duration || 0));
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!seeking) return;
      seeking = false;
      wrap.classList.remove('active');
      const rect = track.getBoundingClientRect();
      const x = e.changedTouches[0].clientX - rect.left;
      const pct = clamp(x / rect.width, 0, 1);
      activeMedia().currentTime = pct * (state.duration || 0);
    }, { passive: true });
  }

  /* ─── Timer logic ─── */
  function checkTimer() {
    if (!state.timerEnd && state.timerType !== 'end') return;
    if (state.timerType === 'end') return; // handled on 'ended'
    if (Date.now() >= state.timerEnd) {
      activeMedia().pause();
      state.timerEnd = null;
      state.timerType = null;
    }
  }

  /* ─── Event bindings ─── */
  function bindEvents() {
    // Media events — bind both audio and video
    [audioEl, videoEl].forEach(m => {
      m.addEventListener('play', () => { state.isPlaying = true; updatePlayBtn(); });
      m.addEventListener('pause', () => { state.isPlaying = false; updatePlayBtn(); });
      m.addEventListener('timeupdate', () => {
        state.currentTime = m.currentTime;
        state.duration = m.duration || 0;
        if (m === activeMedia()) { updateProgress(); updatePositionState(); checkTimer(); }
      });
      m.addEventListener('loadedmetadata', () => {
        state.duration = m.duration || 0;
        updateProgress();
      });
      m.addEventListener('ended', () => {
        if (state.timerType === 'end') {
          state.timerType = null;
          state.timerEnd = null;
          return;
        }
        if (state.repeat === 1) { m.currentTime = 0; m.play(); return; }
        playNext();
      });
    });

    // Buttons
    els.btnPlay.addEventListener('click', togglePlay);
    els.miniPlay.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
    els.miniNext.addEventListener('click', (e) => { e.stopPropagation(); playNext(); });
    els.btnPrev.addEventListener('click', playPrev);
    els.btnNext.addEventListener('click', playNext);
    els.btnRew.addEventListener('click', () => seek(-10));
    els.btnFwd.addEventListener('click', () => seek(10));
    els.btnCollapse.addEventListener('click', collapse);
    els.panelClose.addEventListener('click', closePanel);

    els.btnMode.addEventListener('click', () => {
      switchMode(state.mode === 'video' ? 'audio' : 'video');
    });

    els.btnSubtitle.addEventListener('click', () => {
      state.subtitlesOn = !state.subtitlesOn;
      els.btnSubtitle.classList.toggle('active', state.subtitlesOn);
      updateMediaArea();
    });

    els.btnShuffle.addEventListener('click', () => {
      state.shuffle = !state.shuffle;
      els.btnShuffle.classList.toggle('active', state.shuffle);
      els.btnShuffle.style.opacity = state.shuffle ? '1' : '0.5';
    });

    els.btnRepeat.addEventListener('click', () => {
      state.repeat = (state.repeat + 1) % 3;
      els.btnRepeat.style.opacity = state.repeat ? '1' : '0.5';
      if (state.repeat === 1) els.btnRepeat.innerHTML = icons.repeat.replace('</svg>', '<circle cx="12" cy="12" r="3" fill="currentColor"/></svg>');
      else els.btnRepeat.innerHTML = icons.repeat;
    });

    els.btnSpeed.addEventListener('click', () => openPanel('Velocidad', buildSpeedPanel));
    els.btnTimer.addEventListener('click', () => openPanel('Temporizador', buildTimerPanel));
    els.btnQueue.addEventListener('click', () => openPanel('A continuación', buildQueuePanel));
    els.btnShare.addEventListener('click', () => openPanel('Compartir', buildSharePanel));
    els.btnMore.addEventListener('click', () => openPanel('Información', buildInfoPanel));

    setupGestures();
    setupProgressTouch();
  }

  /* ─── Load episode ─── */
  function loadEpisode(mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload) {
    state.mediaUrl = mediaUrl || '';
    state.mediaVideo = mediaVideo || '';
    state.coverUrl = coverUrl || '';
    state.coverInfo = coverInfo || '';
    state.title = title || '';
    state.detailUrl = detailUrl || '';
    state.author = author || '';
    state.queue = queue || [];
    state.text = text || '';
    state.subtitlesUrl = subtitlesUrl || '';
    state.bgColor = bgColor || '#1a1a2e';
    state.allowDownload = allowDownload === true || allowDownload === 'true';
    state.subtitlesOn = false;
    state.currentCue = '';

    // determine mode
    if (initialMode === 'video' && state.mediaVideo) state.mode = 'video';
    else if (state.mediaUrl) state.mode = 'audio';
    else if (state.mediaVideo) state.mode = 'video';
    else state.mode = 'audio';

    // set sources
    if (state.mediaUrl) audioEl.src = state.mediaUrl;
    if (state.mediaVideo) videoEl.src = state.mediaVideo;

    // subtitle button visibility
    els.btnSubtitle.style.display = state.subtitlesUrl ? '' : 'none';

    // download
    // queue index
    if (state.queue.length) {
      state.queueIndex = state.queue.findIndex(q => q.title === state.title);
      if (state.queueIndex === -1) state.queueIndex = 0;
    }

    applyColors(state.bgColor);
    updateUI();
    updateModeBtn();
    updateMediaArea();
    updateMediaSession();
    loadSubtitles(state.subtitlesUrl);

    mini.classList.remove('hidden');

    // auto play
    activeMedia().play().catch(() => {});
    expand();
  }

  /* ─── Init ─── */
  function init() {
    if (state.initialized) return;
    state.initialized = true;
    bindEvents();
  }

  /* ─── Global API ─── */
  window.playEpisodeExpanded = function (mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload) {
    init();
    loadEpisode(mediaUrl, mediaVideo, initialMode, coverUrl, coverInfo, title, detailUrl, author, queue, text, subtitlesUrl, bgColor, allowDownload);
  };

  // Expose collapse/expand
  window.mpCollapse = collapse;
  window.mpExpand = expand;
})();
