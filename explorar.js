// explorar.js - Página de exploración con diseño profesional
import { getEpisodiosConSerie, getAllEpisodios, series } from './episodios.js';

// ---------- CONSTANTES ----------
const ICONS = {
    play: 'https://marca1.odoo.com/web/image/508-f876320c/play.svg',
    add: 'https://marca1.odoo.com/web/image/509-c555b4ef/a%C3%B1adir%20a.svg',
    added: 'https://nikichitonjesus.odoo.com/web/image/1112-d141b3eb/a%C3%B1adido.png',
    dl: 'https://marca1.odoo.com/web/image/510-7a9035c1/descargar.svg',
    noDl: 'https://nikichitonjesus.odoo.com/web/image/1051-622a3db3/no-desc.webp',
    share: 'https://marca1.odoo.com/web/image/511-3d2d2e2c/compartir.svg'
};

// ---------- VARIABLES DE ESTADO ----------
let DATA = [];
let heroIndex = 0;
let heroItems = [];
let autoHeroInterval = null;

// ---------- FUNCIONES AUXILIARES ----------
function normalizeItem(ep) {
    return {
        id: ep.id,
        title: ep.title || 'Sin título',
        author: ep.author || 'Autor desconocido',
        cover: ep.coverUrl || ep.cover || 'https://via.placeholder.com/400/333/666?text=Sin+imagen',
        coverWide: ep.coverUrl2 || ep.coverWide || ep.coverUrl || ep.cover,
        mediaUrl: ep.mediaUrl || '#',
        type: ep.type || 'audio',
        description: ep.description || '',
        allowDownload: ep.allowDownload !== undefined ? ep.allowDownload : true,
        detailUrl: ep.detailUrl || '#',
        date: ep.date || new Date().toISOString().split('T')[0],
        series: ep.series || null
    };
}

function checkInPlaylist(mediaUrl) {
    try {
        const playlist = JSON.parse(localStorage.getItem('streamhub_userPlaylist')) || [];
        return playlist.some(item => item.mediaUrl === mediaUrl);
    } catch {
        return false;
    }
}

function updateAddButtons(mediaUrl) {
    document.querySelectorAll(`[data-mediaurl="${mediaUrl}"]`).forEach(img => {
        if (img.tagName === 'IMG') {
            img.src = ICONS.added;
            img.setAttribute('data-added', 'true');
        }
    });
}

// ========== FUNCIONES DE RENDERIZADO ==========

// Hero Carrusel
function renderHero() {
    const container = document.getElementById('heroSlidesContainer');
    const indicators = document.getElementById('heroIndicators');
    if (!container) return;

    // Los últimos 5 episodios más recientes
    heroItems = [...DATA]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(normalizeItem);

    if (heroItems.length === 0) {
        container.innerHTML = '<div class="text-center py-20 text-gray-500">No hay episodios disponibles</div>';
        return;
    }

    let slidesHtml = '';
    let indHtml = '';

    heroItems.forEach((item, idx) => {
        const activeClass = idx === 0 ? 'active' : '';
        const inPlaylist = checkInPlaylist(item.mediaUrl);
        const addIcon = inPlaylist ? ICONS.added : ICONS.add;
        
        slidesHtml += `
            <div class="np-hero-slide ${activeClass}" data-index="${idx}" onclick="window.explorar.goToDetail('${item.detailUrl}')">
                <div class="np-hero-content" onclick="event.stopPropagation();">
                    <h1 onclick="event.stopPropagation(); window.explorar.goToDetail('${item.detailUrl}')">${item.title}</h1>
                    <div class="author" onclick="event.stopPropagation(); window.explorar.goToDetail('${item.detailUrl}')">${item.author}</div>
                    <div class="np-hero-controls" onclick="event.stopPropagation();">
                        <div class="np-hero-controls-left">
                            <button onclick="event.stopPropagation(); window.explorar.downloadItem('${item.mediaUrl}', ${item.allowDownload})" title="Descargar">
                                <img src="${item.allowDownload ? ICONS.dl : ICONS.noDl}">
                            </button>
                            <button onclick="event.stopPropagation(); window.explorar.shareItem('${item.title}', '${item.detailUrl}')" title="Compartir">
                                <img src="${ICONS.share}" style="filter: brightness(0) invert(1);">
                            </button>
                            <button onclick="event.stopPropagation(); window.explorar.togglePlaylist('${item.mediaUrl}')" title="Añadir a lista">
                                <img src="${addIcon}" data-mediaurl="${item.mediaUrl}">
                            </button>
                        </div>
                        <button class="np-hero-play-btn" onclick="event.stopPropagation(); window.explorar.playItem('${item.mediaUrl}')">
                            <img src="${ICONS.play}"> Reproducir
                        </button>
                    </div>
                </div>
                <div class="np-hero-image">
                    <img src="${item.coverWide || item.cover}" alt="${item.title}" loading="lazy">
                </div>
            </div>
        `;
        indHtml += `<span class="np-hero-indicator ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`;
    });

    container.innerHTML = slidesHtml;
    indicators.innerHTML = indHtml;

    document.querySelectorAll('.np-hero-indicator').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(el.dataset.index);
            showHeroSlide(idx);
        });
    });
}

function showHeroSlide(index) {
    const slides = document.querySelectorAll('.np-hero-slide');
    const indicators = document.querySelectorAll('.np-hero-indicator');
    if (!slides.length) return;
    
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
    heroIndex = index;
}

function nextHero() { showHeroSlide(heroIndex + 1); }
function prevHero() { showHeroSlide(heroIndex - 1); }

// Carrusel de Series Destacadas
function renderSeriesDestacadas() {
    const container = document.getElementById('seriesCarousel');
    if (!container) return;

    const episodiosConSerie = getEpisodiosConSerie();
    const seriesMap = new Map();

    episodiosConSerie.forEach(ep => {
        if (ep.series) {
            const serieId = ep.series.seriesid || ep.series.titulo_serie;
            if (!seriesMap.has(serieId)) {
                seriesMap.set(serieId, {
                    info: ep.series,
                    episodes: []
                });
            }
            seriesMap.get(serieId).episodes.push(ep);
        }
    });

    // Incluir series sin episodios
    series.forEach(s => {
        if (!seriesMap.has(s.seriesid)) {
            seriesMap.set(s.seriesid, {
                info: s,
                episodes: []
            });
        }
    });

    let seriesArray = Array.from(seriesMap.values());
    seriesArray = seriesArray.sort(() => Math.random() - 0.5).slice(0, 8);

    if (seriesArray.length === 0) {
        container.innerHTML = '<div class="text-gray-500 py-10 text-center w-full">No hay series disponibles</div>';
        return;
    }

    let html = '';
    seriesArray.forEach(serie => {
        const s = serie.info;
        const episodes = serie.episodes
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 4);

        html += `<div class="np-series-group">`;
        
        // Cabecera de la serie
        html += `
            <div class="np-series-item" style="padding-left:0;" onclick="window.explorar.goToDetail('${s.url_serie || '#'}')">
                <div class="np-series-thumb">
                    <img src="${s.portada_serie || episodes[0]?.coverUrl || 'https://via.placeholder.com/56'}" loading="lazy">
                </div>
                <div style="flex:1; min-width:0;">
                    <div class="np-title">${s.titulo_serie}</div>
                    <div class="np-author">${episodes.length} episodios</div>
                </div>
            </div>
        `;

        // Episodios de la serie
        episodes.forEach((ep, idx) => {
            const inPlaylist = checkInPlaylist(ep.mediaUrl);
            const addIcon = inPlaylist ? ICONS.added : ICONS.add;
            
            html += `
                <div class="np-series-item" data-mediaurl="${ep.mediaUrl}">
                    <span style="color:#666; width:20px; text-align:center;">${idx+1}</span>
                    <div class="np-series-thumb" onclick="window.explorar.goToDetail('${ep.detailUrl}')">
                        <img src="${ep.coverUrl}" loading="lazy">
                        <div class="np-overlay-mini" onclick="event.stopPropagation(); window.explorar.playItem('${ep.mediaUrl}'); return false;">
                            <img src="${ICONS.play}" class="np-play-icon-sm">
                        </div>
                    </div>
                    <div style="flex:1; min-width:0;" onclick="window.explorar.goToDetail('${ep.detailUrl}')">
                        <div class="np-title">${ep.title}</div>
                        <div class="np-author">${ep.author}</div>
                    </div>
                    <button class="np-add-btn" style="background:none; border:none; cursor:pointer;" 
                            onclick="event.stopPropagation(); window.explorar.togglePlaylist('${ep.mediaUrl}'); return false;">
                        <img src="${addIcon}" style="width:20px; height:20px; filter: brightness(0) invert(1);" data-mediaurl="${ep.mediaUrl}">
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    });

    container.innerHTML = html;
}

// Carrusel de Videos Destacados
function renderVideosDestacados() {
    const container = document.getElementById('videosCarousel');
    if (!container) return;

    const videos = DATA
        .filter(ep => ep.type === 'video')
        .sort(() => Math.random() - 0.5)
        .slice(0, 12)
        .map(normalizeItem);

    if (videos.length === 0) {
        container.innerHTML = '<div class="text-gray-500 py-10 text-center w-full">No hay videos disponibles</div>';
        return;
    }

    let html = '';
    videos.forEach(ep => {
        const inPlaylist = checkInPlaylist(ep.mediaUrl);
        const addIcon = inPlaylist ? ICONS.added : ICONS.add;
        
        html += `
            <div class="np-card-video group" data-mediaurl="${ep.mediaUrl}">
                <img src="${ep.cover}" class="img-default" loading="lazy">
                <img src="${ep.coverWide || ep.cover}" class="img-wide" loading="lazy">
                <div class="np-overlay-full">
                    <img src="${addIcon}" class="np-icon-add" onclick="event.stopPropagation(); window.explorar.togglePlaylist('${ep.mediaUrl}'); return false;" data-mediaurl="${ep.mediaUrl}">
                    <img src="${ICONS.play}" class="np-icon-play" onclick="event.stopPropagation(); window.explorar.playItem('${ep.mediaUrl}'); return false;">
                    <img src="${ep.allowDownload ? ICONS.dl : ICONS.noDl}" class="np-icon-dl" onclick="event.stopPropagation(); window.explorar.downloadItem('${ep.mediaUrl}', ${ep.allowDownload}); return false;">
                </div>
                <span class="np-mobile-play" onclick="event.stopPropagation(); window.explorar.playItem('${ep.mediaUrl}'); return false;">
                    <img src="${ICONS.play}">
                </span>
                <div class="np-video-badge">VIDEO</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Grid Aleatorio (Descubrir)
function renderRandomGrid() {
    const container = document.getElementById('randomGrid');
    if (!container) return;

    const shuffled = [...DATA].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 20).map(normalizeItem);

    if (selected.length === 0) {
        container.innerHTML = '<div class="col-span-full text-gray-500 py-10 text-center">No hay episodios disponibles</div>';
        return;
    }

    let html = '';
    selected.forEach(ep => {
        const inPlaylist = checkInPlaylist(ep.mediaUrl);
        const addIcon = inPlaylist ? ICONS.added : ICONS.add;
        
        html += `
            <div class="np-card-std" data-mediaurl="${ep.mediaUrl}">
                <div class="np-img-container" onclick="window.explorar.goToDetail('${ep.detailUrl}')">
                    <img src="${ep.cover}" loading="lazy">
                    <div class="np-overlay-full">
                        <img src="${addIcon}" class="np-icon-add" onclick="event.stopPropagation(); window.explorar.togglePlaylist('${ep.mediaUrl}'); return false;" data-mediaurl="${ep.mediaUrl}">
                        <img src="${ICONS.play}" class="np-icon-play" onclick="event.stopPropagation(); window.explorar.playItem('${ep.mediaUrl}'); return false;">
                        <img src="${ep.allowDownload ? ICONS.dl : ICONS.noDl}" class="np-icon-dl" onclick="event.stopPropagation(); window.explorar.downloadItem('${ep.mediaUrl}', ${ep.allowDownload}); return false;">
                    </div>
                    <span class="np-mobile-play" onclick="event.stopPropagation(); window.explorar.playItem('${ep.mediaUrl}'); return false;">
                        <img src="${ICONS.play}">
                    </span>
                </div>
                <div onclick="window.explorar.goToDetail('${ep.detailUrl}')">
                    <div class="np-title">${ep.title}</div>
                    <div class="np-author">${ep.author}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ========== ACCIONES GLOBALES ==========
function playItem(mediaUrl) {
    const item = DATA.find(ep => ep.mediaUrl === mediaUrl);
    if (!item) return;

    if (typeof window.playEpisodeExpanded === 'function') {
        window.playEpisodeExpanded(
            item.mediaUrl,
            item.type,
            item.cover,
            item.coverWide,
            item.title,
            item.detailUrl,
            item.author,
            [],
            item.description,
            item.allowDownload
        );
    } else {
        window.open(item.mediaUrl, '_blank');
    }
}

function downloadItem(mediaUrl, allow) {
    if (!allow) {
        alert('Descarga no disponible para este episodio');
        return;
    }

    const item = DATA.find(ep => ep.mediaUrl === mediaUrl);
    if (!item) return;

    const ext = item.type === 'video' ? 'mp4' : 'mp3';
    const filename = `${item.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.${ext}`;

    try {
        const a = document.createElement('a');
        a.href = item.mediaUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        window.open(item.mediaUrl, '_blank');
    }
}

function togglePlaylist(mediaUrl) {
    const item = DATA.find(ep => ep.mediaUrl === mediaUrl);
    if (!item) return;

    if (typeof window.addToUserPlaylist === 'function') {
        const added = window.addToUserPlaylist({
            mediaUrl: item.mediaUrl,
            type: item.type,
            cover: item.cover,
            title: item.title,
            detailUrl: item.detailUrl,
            author: item.author,
            description: item.description,
            allowDownload: item.allowDownload,
            id: item.id
        });

        if (added) {
            updateAddButtons(mediaUrl);
        }
    } else {
        console.warn('Función addToUserPlaylist no disponible');
    }
}

function shareItem(title, url) {
    const fullUrl = window.location.origin + url;
    if (navigator.share) {
        navigator.share({ title, url: fullUrl }).catch(() => {});
    } else {
        navigator.clipboard.writeText(fullUrl);
        alert('Enlace copiado al portapapeles');
    }
}

function goToDetail(url) {
    if (url && url !== '#') {
        if (typeof window.goToDetail === 'function') {
            window.goToDetail(url);
        } else {
            window.location.href = url;
        }
    }
}

function verTodasSeries() {
    if (typeof window.goToDetail === 'function') {
        window.goToDetail('/series');
    }
}

function verTodosVideos() {
    if (typeof window.goToDetail === 'function') {
        window.goToDetail('/videos');
    }
}

function actualizarAleatorios() {
    renderRandomGrid();
}

// ========== INICIALIZACIÓN ==========
function init() {
    // Limpiar intervalo anterior si existe
    if (autoHeroInterval) clearInterval(autoHeroInterval);

    // Renderizar todas las secciones
    renderHero();
    renderSeriesDestacadas();
    renderVideosDestacados();
    renderRandomGrid();

    // Configurar eventos de navegación del carrusel
    const heroPrev = document.getElementById('heroPrev');
    const heroNext = document.getElementById('heroNext');
    const seriesLeft = document.getElementById('seriesLeft');
    const seriesRight = document.getElementById('seriesRight');
    const videosLeft = document.getElementById('videosLeft');
    const videosRight = document.getElementById('videosRight');

    if (heroPrev) {
        heroPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            prevHero();
            if (autoHeroInterval) {
                clearInterval(autoHeroInterval);
                autoHeroInterval = setInterval(nextHero, 8000);
            }
        });
    }

    if (heroNext) {
        heroNext.addEventListener('click', (e) => {
            e.stopPropagation();
            nextHero();
            if (autoHeroInterval) {
                clearInterval(autoHeroInterval);
                autoHeroInterval = setInterval(nextHero, 8000);
            }
        });
    }

    if (seriesLeft) {
        seriesLeft.addEventListener('click', () => {
            document.getElementById('seriesCarousel').scrollLeft -= 600;
        });
    }

    if (seriesRight) {
        seriesRight.addEventListener('click', () => {
            document.getElementById('seriesCarousel').scrollLeft += 600;
        });
    }

    if (videosLeft) {
        videosLeft.addEventListener('click', () => {
            document.getElementById('videosCarousel').scrollLeft -= 400;
        });
    }

    if (videosRight) {
        videosRight.addEventListener('click', () => {
            document.getElementById('videosCarousel').scrollLeft += 400;
        });
    }

    // Auto-play del hero
    autoHeroInterval = setInterval(nextHero, 8000);
}

// ========== FUNCIÓN PRINCIPAL DE RENDERIZADO ==========
export function render(container) {
    // Cargar datos
    DATA = getEpisodiosConSerie();

    // Inyectar el HTML con los estilos incluidos
    container.innerHTML = `
        <div id="explorar-page" style="font-family: 'Plus Jakarta Sans', sans-serif; background: #050505; color: white; max-width: 1600px; margin: 0 auto; padding: 20px 24px;">
            <style>
                /* RESET Y UTILIDADES */
                #explorar-page * {
                    box-sizing: border-box;
                }
                .np-no-scrollbar::-webkit-scrollbar { display: none; }
                .np-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Hero Carrusel */
                .np-hero-carousel {
                    position: relative;
                    width: 100%;
                    height: 500px;
                    border-radius: 24px;
                    overflow: hidden;
                    margin-bottom: 40px;
                    background: #111;
                }
                .np-hero-slide {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding: 0;
                    cursor: pointer;
                }
                .np-hero-slide.active {
                    opacity: 1;
                    z-index: 2;
                }
                .np-hero-image {
                    width: 60%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    pointer-events: none;
                }
                .np-hero-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .np-hero-image::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 70%;
                    height: 100%;
                    background: linear-gradient(to right, #050505 0%, rgba(5,5,5,0.8) 50%, transparent 100%);
                    z-index: 2;
                    pointer-events: none;
                }
                .np-hero-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 50%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 60px;
                    z-index: 3;
                    color: white;
                    background: transparent;
                    pointer-events: none;
                }
                .np-hero-content h1,
                .np-hero-content .author,
                .np-hero-controls {
                    pointer-events: auto;
                }
                .np-hero-content h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 16px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                }
                .np-hero-content .author {
                    font-size: 1.2rem;
                    color: #ccc;
                    margin-bottom: 24px;
                }
                .np-hero-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 30px;
                }
                .np-hero-controls-left {
                    display: flex;
                    gap: 20px;
                }
                .np-hero-controls-left button {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                }
                .np-hero-controls-left button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.05);
                }
                .np-hero-controls-left button img {
                    width: 24px;
                    height: 24px;
                    filter: brightness(0) invert(1);
                }
                .np-hero-play-btn {
                    background: #3b82f6;
                    border: none;
                    border-radius: 40px;
                    padding: 12px 32px;
                    font-weight: bold;
                    font-size: 1.1rem;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                }
                .np-hero-play-btn:hover {
                    background: #2563eb;
                    transform: scale(1.05);
                }
                .np-hero-play-btn img {
                    width: 24px;
                    height: 24px;
                    filter: brightness(0) invert(1);
                }
                .np-hero-indicators {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 12px;
                    z-index: 4;
                }
                .np-hero-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.4);
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                }
                .np-hero-indicator.active {
                    background: white;
                    transform: scale(1.2);
                }
                .np-hero-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 48px;
                    height: 48px;
                    background: rgba(0,0,0,0.5);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    z-index: 5;
                    transition: background 0.2s;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .np-hero-arrow:hover {
                    background: rgba(0,0,0,0.8);
                }
                .np-hero-arrow.left {
                    left: 20px;
                }
                .np-hero-arrow.right {
                    right: 20px;
                }

                /* Versión móvil del hero */
                @media (max-width: 768px) {
                    .np-hero-slide {
                        justify-content: flex-end;
                    }
                    .np-hero-image {
                        width: 100%;
                        height: 100%;
                        position: absolute;
                        top: 0;
                        left: 0;
                    }
                    .np-hero-image::before {
                        background: linear-gradient(to top, #050505 0%, rgba(5,5,5,0.8) 40%, transparent 100%);
                        width: 100%;
                        height: 70%;
                        top: auto;
                        bottom: 0;
                        left: 0;
                    }
                    .np-hero-content {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        padding: 20px;
                        background: transparent;
                        pointer-events: auto;
                        z-index: 3;
                        height: auto;
                        top: auto;
                        justify-content: flex-end;
                    }
                    .np-hero-content h1 {
                        font-size: 2rem;
                        margin-bottom: 8px;
                    }
                    .np-hero-content .author {
                        font-size: 1rem;
                        margin-bottom: 16px;
                    }
                    .np-hero-controls {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 10px;
                    }
                    .np-hero-controls-left {
                        display: none;
                    }
                    .np-hero-play-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }

                /* Secciones de carrusel */
                .np-carousel-wrapper {
                    position: relative;
                    margin-top: 48px;
                }
                .np-section-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 0 4px;
                }
                .np-section-header h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    transition: color 0.2s;
                    cursor: default;
                }
                .np-section-header h2:hover {
                    color: #3b82f6;
                }
                .np-section-header button {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #aaa;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .np-section-header button:hover {
                    color: white;
                }
                .np-nav-btn {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    z-index: 40;
                    width: 60px;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.3s;
                }
                .np-nav-btn.left {
                    left: 0;
                    background: linear-gradient(to right, #050505 0%, transparent 100%);
                }
                .np-nav-btn.right {
                    right: 0;
                    background: linear-gradient(to left, #050505 0%, transparent 100%);
                }
                .np-nav-btn button {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    transition: transform 0.2s, background 0.2s;
                }
                .np-nav-btn button:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.1);
                }
                .np-carousel-wrapper:hover .np-nav-btn {
                    display: flex;
                }
                .np-horizontal-scroll {
                    display: flex;
                    gap: 24px;
                    overflow-x: auto;
                    scroll-behavior: smooth;
                    padding: 8px 4px;
                }

                /* Tarjeta estándar */
                .np-card-std {
                    min-width: 200px;
                    width: 200px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    cursor: pointer;
                    position: relative;
                }
                .np-card-std .np-img-container {
                    width: 100%;
                    aspect-ratio: 1/1;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #1a1a1a;
                    position: relative;
                }
                .np-card-std img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s;
                }
                .np-card-std:hover img {
                    transform: scale(1.05);
                }
                .np-overlay-full {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(2px);
                    opacity: 0;
                    transition: opacity 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    border-radius: 12px;
                }
                .np-card-std:hover .np-overlay-full {
                    opacity: 1;
                }

                /* Iconos dentro del overlay */
                .np-overlay-full img.np-icon-add,
                .np-overlay-full img.np-icon-dl {
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    transition: transform 0.2s;
                    filter: brightness(0) invert(1);
                }
                .np-overlay-full img.np-icon-play {
                    width: 56px;
                    height: 56px;
                    cursor: pointer;
                    transition: transform 0.2s;
                    filter: brightness(0) invert(1);
                }
                .np-overlay-full img:hover {
                    transform: scale(1.1);
                }

                /* Botón móvil */
                .np-mobile-play {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    width: 40px;
                    height: 40px;
                    background: rgba(0,0,0,0.7);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 30;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .np-mobile-play img {
                    width: 20px;
                    height: 20px;
                    filter: brightness(0) invert(1);
                }
                @media (min-width: 1024px) {
                    .np-mobile-play {
                        display: none;
                    }
                }

                /* Tarjeta de video expandible */
                .np-card-video {
                    height: 220px;
                    width: 220px;
                    flex-shrink: 0;
                    position: relative;
                    overflow: hidden;
                    border-radius: 12px;
                    transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);
                    cursor: pointer;
                }
                @media (min-width: 1024px) {
                    .np-card-video:hover {
                        width: 390px;
                    }
                }
                .np-card-video img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: opacity 0.3s;
                }
                .np-card-video .img-default {
                    z-index: 1;
                }
                .np-card-video .img-wide {
                    opacity: 0;
                    z-index: 2;
                }
                .np-card-video:hover .img-wide {
                    opacity: 1;
                }
                .np-card-video .np-overlay-full {
                    z-index: 3;
                    gap: 12px;
                }
                .np-card-video .np-mobile-play {
                    z-index: 4;
                }
                .np-video-badge {
                    position: absolute;
                    bottom: 8px;
                    left: 8px;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    z-index: 5;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Grid */
                .np-grid-container {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                    margin-top: 24px;
                }
                @media (min-width: 768px) {
                    .np-grid-container {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                @media (min-width: 1024px) {
                    .np-grid-container {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }
                @media (min-width: 1280px) {
                    .np-grid-container {
                        grid-template-columns: repeat(5, 1fr);
                    }
                }

                /* Series (listas) */
                .np-series-group {
                    min-width: 340px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .np-series-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .np-series-item:hover {
                    background: rgba(255,255,255,0.08);
                }
                .np-series-thumb {
                    width: 56px;
                    height: 56px;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                    flex-shrink: 0;
                }
                .np-series-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .np-overlay-mini {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    opacity: 0;
                    transition: opacity 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }
                .np-series-item:hover .np-overlay-mini {
                    opacity: 1;
                }
                .np-play-icon-sm {
                    width: 20px;
                    height: 20px;
                    filter: brightness(0) invert(1);
                }

                /* Títulos truncados */
                .np-title {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-weight: bold;
                    color: white;
                }
                .np-author {
                    font-size: 0.8rem;
                    color: #aaa;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            </style>

            <!-- Hero Carrusel -->
            <div class="np-hero-carousel" id="heroCarousel">
                <div class="np-hero-arrow left" id="heroPrev">❮</div>
                <div class="np-hero-arrow right" id="heroNext">❯</div>
                <div id="heroSlidesContainer"></div>
                <div class="np-hero-indicators" id="heroIndicators"></div>
            </div>

            <!-- Series Destacadas -->
            <section class="np-carousel-wrapper">
                <div class="np-section-header">
                    <h2>Series destacadas</h2>
                    <button onclick="window.explorar.verTodasSeries()">Ver todo</button>
                </div>
                <div class="relative">
                    <div class="np-nav-btn left" id="seriesLeft"><button>❮</button></div>
                    <div id="seriesCarousel" class="np-horizontal-scroll np-no-scrollbar" style="gap: 32px;"></div>
                    <div class="np-nav-btn right" id="seriesRight"><button>❯</button></div>
                </div>
            </section>

            <!-- Videos Destacados -->
            <section class="np-carousel-wrapper" style="margin-top: 48px;">
                <div class="np-section-header">
                    <h2>Videos destacados</h2>
                    <button onclick="window.explorar.verTodosVideos()">Ver todo</button>
                </div>
                <div class="relative">
                    <div class="np-nav-btn left" id="videosLeft"><button>❮</button></div>
                    <div id="videosCarousel" class="np-horizontal-scroll np-no-scrollbar"></div>
                    <div class="np-nav-btn right" id="videosRight"><button>❯</button></div>
                </div>
            </section>

            <!-- Descubrir (Grid Aleatorio) -->
            <section style="margin-top: 48px;">
                <div class="np-section-header">
                    <h2>Descubrir</h2>
                    <button onclick="window.explorar.actualizarAleatorios()">↻ Actualizar</button>
                </div>
                <div id="randomGrid" class="np-grid-container"></div>
            </section>
        </div>
    `;

    // Inicializar la lógica
    init();
}

// Exportar API global
export const explorarAPI = {
    playItem,
    downloadItem,
    togglePlaylist,
    shareItem,
    goToDetail,
    verTodasSeries,
    verTodosVideos,
    actualizarAleatorios
};

// Exponer globalmente para los onclick en el HTML
window.explorar = explorarAPI;

export const header = true;
