// buscar.js - Página de búsqueda profesional con vistas integradas
import { getEpisodiosConSerie, series } from './episodios.js';
import { createGridCard } from './show.js';

// ---------- CONSTANTES ----------
const ICONS = {
    play: 'https://marca1.odoo.com/web/image/508-f876320c/play.svg',
    add: 'https://marca1.odoo.com/web/image/509-c555b4ef/a%C3%B1adir%20a.svg',
    added: 'https://nikichitonjesus.odoo.com/web/image/1112-d141b3eb/a%C3%B1adido.png',
    dl: 'https://marca1.odoo.com/web/image/510-7a9035c1/descargar.svg',
    noDl: 'https://nikichitonjesus.odoo.com/web/image/1051-622a3db3/no-desc.webp',
    share: 'https://marca1.odoo.com/web/image/511-3d2d2e2c/compartir.svg'
};

const CATEGORIES = [
    { name: "Derecho", icon: "⚖️", color: "from-blue-900 to-blue-700" },
    { name: "Matemáticas", icon: "📐", color: "from-green-900 to-green-700" },
    { name: "Física y Astronomía", icon: "🔭", color: "from-purple-900 to-purple-700" },
    { name: "Historia", icon: "📜", color: "from-amber-900 to-amber-700" },
    { name: "Filosofía", icon: "🤔", color: "from-emerald-900 to-emerald-700" },
    { name: "Economía y Finanzas", icon: "📊", color: "from-cyan-900 to-cyan-700" },
    { name: "Ciencias Sociales", icon: "👥", color: "from-pink-900 to-pink-700" },
    { name: "Arte y Cultura", icon: "🎨", color: "from-orange-900 to-orange-700" },
    { name: "Literatura y Audiolibros", icon: "📚", color: "from-indigo-900 to-indigo-700" },
    { name: "Cine y TV", icon: "🎬", color: "from-red-900 to-red-700" },
    { name: "Documentales", icon: "🎥", color: "from-lime-900 to-lime-700" },
    { name: "Ciencias Naturales", icon: "🌿", color: "from-teal-900 to-teal-700" },
    { name: "Tecnología e Informática", icon: "💻", color: "from-sky-900 to-sky-700" },
    { name: "Otras Ciencias", icon: "🔬", color: "from-gray-900 to-gray-700" }
];

// ---------- VARIABLES DE ESTADO ----------
let DATA = [];
let searchHistory = JSON.parse(localStorage.getItem('sh_history')) || [];
let searchTimeout = null;
let currentQuery = '';

// ---------- FUNCIONES AUXILIARES ----------
function safeToString(value) {
    return value ? String(value).toLowerCase() : '';
}

function checkInPlaylist(mediaUrl) {
    try {
        const playlist = JSON.parse(localStorage.getItem('streamhub_userPlaylist')) || [];
        return playlist.some(item => item.mediaUrl === mediaUrl);
    } catch {
        return false;
    }
}

// ---------- DETECCIÓN DE CATEGORÍAS ----------
function determineCategories(ep) {
    const cats = new Set();
    const text = (ep.title + ' ' + ep.description + ' ' + (ep.series?.titulo_serie || '') + ' ' + (ep.series?.descripcion_serie || '')).toLowerCase();

    const patterns = {
        "Derecho": /\b(derecho|penal|civil|constitucional|procesal|delito|ley|jurisprudencia|código|tribunal|justicia|proceso)\b/i,
        "Física y Astronomía": /\b(física|fisica|mecánica|mecanica|cuántica|cuantica|termodinámica|termodinamica|newton|einstein|astronomía|astronomia|planeta|cosmos)\b/i,
        "Matemáticas": /\b(matemática|matematicas|calculo|cálculo|algebra|álgebra|geometria|geometría|estadistica|estadística|probabilidad|ecuacion|ecuación|teorema|integral)\b/i,
        "Historia": /\b(historia|histórico|historico|siglo|época|epoca|imperio|guerra|revolución|revolucion|antiguo|medieval)\b/i,
        "Filosofía": /\b(filosofía|filosofia|kant|platon|platón|aristoteles|ética|etica|metafísica|metafisica|ontología|ontologia|epistemología|epistemologia)\b/i,
        "Economía y Finanzas": /\b(economía|economia|finanzas|inflación|inflacion|keynes|oferta|demanda|macroeconomía|macroeconomia|pib|mercado)\b/i,
        "Ciencias Sociales": /\b(sociología|sociologia|antropología|antropologia|psicología|psicologia|sociedad|cultura|identidad|género|genero|desigualdad)\b/i,
        "Arte y Cultura": /\b(arte|pintura|escultura|arquitectura|renacimiento|barroco|música|musica|cultura|artístico|artistico)\b/i,
        "Literatura y Audiolibros": /\b(audiolibro|libro|novela|cuento|poema|clásico|clasico|literatura|lectura)\b/i,
        "Cine y TV": /\b(cine|película|pelicula|serie|director|guion|ficción|ficcion|animación|animacion)\b/i,
        "Documentales": /\b(documental|bbc|ciencia|naturaleza|espacio|universo|planeta|nacional geographic)\b/i,
        "Ciencias Naturales": /\b(biología|biologia|química|quimica|geología|geologia|ecología|ecologia|evolución|evolucion|genética|genetica|clima|botánica|botanica)\b/i,
        "Tecnología e Informática": /\b(tecnología|tecnologia|programación|programacion|python|ia|computación|computacion|algoritmo|software|desarrollo)\b/i
    };

    for (const [cat, regex] of Object.entries(patterns)) {
        if (regex.test(text)) cats.add(cat);
    }

    if (ep.type === 'video') {
        if (text.includes('documental')) cats.add("Documentales");
        else cats.add("Cine y TV");
    }

    if (cats.size === 0) cats.add("Otras Ciencias");

    return Array.from(cats);
}

// ---------- FUNCIONES DE BÚSQUEDA ----------
function performQuickSearch(query) {
    if (!query || query.trim() === '') return [];
    const qLow = safeToString(query);
    return DATA.filter(ep => {
        const title = safeToString(ep.title);
        const author = safeToString(ep.author);
        const seriesTitle = ep.series ? safeToString(ep.series.titulo_serie) : '';
        const description = safeToString(ep.description);
        return title.includes(qLow) || author.includes(qLow) || seriesTitle.includes(qLow) || description.includes(qLow);
    }).slice(0, 5);
}

function executeSearch(query) {
    if (!query) return;
    
    // Guardar en historial
    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        if (searchHistory.length > 8) searchHistory.pop();
        localStorage.setItem('sh_history', JSON.stringify(searchHistory));
    }
    
    // Navegar usando el router
    window.history.pushState(null, null, `/buscar?q=${encodeURIComponent(query)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

// ---------- RENDERIZADO DE COMPONENTES ----------
function renderHeroCategory(category) {
    const cat = CATEGORIES.find(c => c.name === category) || CATEGORIES[CATEGORIES.length - 1];
    
    return `
        <div class="relative w-full h-64 rounded-2xl overflow-hidden mb-8 cursor-pointer group" 
             onclick="window.history.pushState(null, null, '/categoria/${encodeURIComponent(category)}'); window.dispatchEvent(new PopStateEvent('popstate'))">
            <div class="absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90 group-hover:scale-105 transition-transform duration-700"></div>
            <div class="absolute inset-0 bg-black/20"></div>
            <div class="absolute inset-0 flex items-center justify-between p-8">
                <div>
                    <span class="text-6xl mb-2 block">${cat.icon}</span>
                    <h1 class="text-4xl font-black text-white">${category}</h1>
                    <p class="text-white/80 mt-2">Explorar contenido →</p>
                </div>
                <div class="text-8xl opacity-20">${cat.icon}</div>
            </div>
        </div>
    `;
}

function renderSearchResults(results, query) {
    if (results.length === 0) {
        return `
            <div class="text-center py-16">
                <span class="text-6xl mb-4 block">🔍</span>
                <h3 class="text-2xl font-bold text-white mb-2">No encontramos resultados</h3>
                <p class="text-gray-400">Prueba con otros términos o explora las categorías</p>
            </div>
        `;
    }

    return `
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-white mb-2">Resultados para "${query}"</h2>
            <p class="text-gray-400">${results.length} episodios encontrados</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            ${results.map(ep => createGridCard(ep)).join('')}
        </div>
    `;
}

function renderCategoryContent(category) {
    const categoryEpisodes = DATA.filter(ep => {
        const epCategories = determineCategories(ep);
        return epCategories.includes(category);
    });

    if (categoryEpisodes.length === 0) {
        return `
            <div class="text-center py-16">
                <span class="text-6xl mb-4 block">📚</span>
                <h3 class="text-2xl font-bold text-white mb-2">No hay episodios en esta categoría</h3>
                <p class="text-gray-400">Pronto agregaremos contenido</p>
            </div>
        `;
    }

    // Agrupar por series
    const seriesMap = new Map();
    categoryEpisodes.forEach(ep => {
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

    const seriesList = Array.from(seriesMap.values());

    return `
        <div class="space-y-12">
            <!-- Episodios recientes -->
            <div>
                <h3 class="text-xl font-bold text-white mb-4">Episodios recientes</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    ${categoryEpisodes.slice(0, 10).map(ep => createGridCard(ep)).join('')}
                </div>
            </div>

            <!-- Series relacionadas -->
            ${seriesList.length > 0 ? `
                <div>
                    <h3 class="text-xl font-bold text-white mb-4">Series en esta categoría</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${seriesList.slice(0, 8).map(s => `
                            <div class="bg-white/5 rounded-xl overflow-hidden cursor-pointer group"
                                 onclick="window.history.pushState(null, null, '${s.info.url_serie}'); window.dispatchEvent(new PopStateEvent('popstate'))">
                                <img src="${s.info.portada_serie}" class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500">
                                <div class="p-3">
                                    <h4 class="font-bold text-white truncate">${s.info.titulo_serie}</h4>
                                    <p class="text-xs text-gray-400">${s.episodes.length} episodios</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Ver todos -->
            <div class="text-center">
                <button onclick="document.getElementById('categoryAllBtn').click()" 
                        class="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition">
                    Ver todos los episodios
                </button>
                <a id="categoryAllBtn" href="/categoria/${encodeURIComponent(category)}" data-link class="hidden"></a>
            </div>
        </div>
    `;
}

// ---------- FUNCIÓN PRINCIPAL DE RENDERIZADO ----------
export function render(container) {
    // Cargar datos
    DATA = getEpisodiosConSerie();

    // Detectar si hay query en la URL
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get('q') || '';
    currentQuery = query;

    // Inyectar HTML
    container.innerHTML = `
        <div class="max-w-7xl mx-auto py-6 md:py-10 px-4">
            <!-- Header de búsqueda -->
            <div class="mb-8">
                <div class="flex flex-col md:flex-row gap-4 items-center">
                    <div class="relative flex-1 w-full">
                        <span class="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                        <input 
                            type="text" 
                            id="searchInput" 
                            value="${query}"
                            placeholder="Buscar episodios, series, autores..." 
                            class="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                            autocomplete="off"
                        >
                        <div id="suggestionsBox" class="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl hidden z-50"></div>
                    </div>
                    <button 
                        id="searchButton"
                        class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition-colors whitespace-nowrap"
                    >
                        Buscar
                    </button>
                </div>

                <!-- Historial de búsquedas -->
                <div id="historyContainer" class="mt-4 flex flex-wrap gap-2"></div>
            </div>

            <!-- Contenido dinámico -->
            <div id="searchContent">
                ${query ? renderSearchResults(
                    DATA.filter(ep => {
                        const q = query.toLowerCase();
                        return ep.title.toLowerCase().includes(q) ||
                               ep.author.toLowerCase().includes(q) ||
                               (ep.series?.titulo_serie || '').toLowerCase().includes(q) ||
                               ep.description.toLowerCase().includes(q);
                    }), 
                    query
                ) : `
                    <!-- Vista Home: Categorías -->
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-6">Explorar categorías</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${CATEGORIES.map(cat => `
                                <div class="relative h-32 rounded-xl overflow-hidden cursor-pointer group"
                                     onclick="window.history.pushState(null, null, '/categoria/${encodeURIComponent(cat.name)}'); window.dispatchEvent(new PopStateEvent('popstate'))">
                                    <div class="absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90 group-hover:scale-105 transition-transform duration-500"></div>
                                    <div class="absolute inset-0 flex items-center p-6">
                                        <span class="text-4xl mr-4">${cat.icon}</span>
                                        <span class="text-xl font-bold text-white">${cat.name}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;

    // Renderizar historial
    const historyContainer = document.getElementById('historyContainer');
    if (historyContainer && searchHistory.length > 0) {
        historyContainer.innerHTML = searchHistory.map(term => `
            <button class="history-tag bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm transition-colors border border-white/10"
                    onclick="document.getElementById('searchInput').value = '${term.replace(/'/g, "\\'")}'; document.getElementById('searchButton').click()">
                <span class="material-symbols-rounded text-sm mr-1">history</span>
                ${term}
            </button>
        `).join('');
    }

    // Configurar eventos
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const suggestionsBox = document.getElementById('suggestionsBox');

    // Input con sugerencias
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (val.length > 1) {
            searchTimeout = setTimeout(() => {
                const matches = performQuickSearch(val);
                if (matches.length > 0) {
                    suggestionsBox.innerHTML = matches.map(ep => `
                        <div class="suggestion-item flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors"
                             onclick="document.getElementById('searchInput').value = '${ep.title.replace(/'/g, "\\'")}'; document.getElementById('searchButton').click()">
                            <img src="${ep.coverUrl}" class="w-10 h-10 rounded object-cover">
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-sm text-white truncate">${ep.title}</h4>
                                <p class="text-xs text-gray-500 truncate">${ep.author}</p>
                            </div>
                        </div>
                    `).join('');
                    suggestionsBox.classList.remove('hidden');
                } else {
                    suggestionsBox.classList.add('hidden');
                }
            }, 300);
        } else {
            suggestionsBox.classList.add('hidden');
        }
    });

    // Búsqueda al hacer clic en botón o Enter
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            suggestionsBox.classList.add('hidden');
            executeSearch(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchButton.click();
        }
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });
}

// ---------- FUNCIONES ESPECIALES PARA EL ROUTER ----------
export function renderSearch(container, query) {
    if (query) {
        // Si hay query, redirigimos al router para que maneje la URL
        window.history.replaceState(null, null, `/buscar?q=${encodeURIComponent(query)}`);
    }
    render(container);
}

export function renderCategory(container, category) {
    // Cargar datos
    DATA = getEpisodiosConSerie();

    container.innerHTML = `
        <div class="max-w-7xl mx-auto py-6 md:py-10 px-4">
            <!-- Hero de categoría -->
            ${renderHeroCategory(category)}
            
            <!-- Contenido de la categoría -->
            <div id="categoryContent">
                ${renderCategoryContent(category)}
            </div>
        </div>
    `;
}

export const header = true; // Mostrar header por defecto
