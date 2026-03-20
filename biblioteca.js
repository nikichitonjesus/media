// biblioteca.js
import { userStorage } from './storage.js';
import { episodios } from './episodios.js';

export function render(container) {
    const playlist = userStorage.playlist.get();
    const likedIds = userStorage.liked.get();
    const completedIds = userStorage.completed.get();

    const likedEpisodios = episodios.filter(ep => likedIds.includes(ep.id));
    const completedEpisodios = episodios.filter(ep => completedIds.includes(ep.id));

    let html = `
        <div class="max-w-5xl mx-auto py-8">
            <h1 class="text-4xl font-bold mb-8">Mi biblioteca</h1>

            <div class="mb-12">
                <h2 class="text-2xl font-bold mb-4">Guardados (${playlist.length})</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    `;

    if (playlist.length === 0) {
        html += '<p class="text-gray-400 col-span-full">No has guardado ningún episodio todavía.</p>';
    } else {
        playlist.forEach(ep => {
            html += `
                <div class="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition" onclick="window.goToDetail('${ep.detailUrl}')">
                    <img src="${ep.coverUrl}" class="w-full aspect-square object-cover rounded-lg mb-3" loading="lazy">
                    <h3 class="font-bold text-white truncate">${ep.title}</h3>
                    <p class="text-sm text-gray-400 truncate">${ep.author}</p>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>

            <div class="mb-12">
                <h2 class="text-2xl font-bold mb-4">Me gusta (${likedEpisodios.length})</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    `;

    if (likedEpisodios.length === 0) {
        html += '<p class="text-gray-400 col-span-full">No has marcado ningún episodio con "Me gusta".</p>';
    } else {
        likedEpisodios.forEach(ep => {
            html += `
                <div class="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition" onclick="window.goToDetail('${ep.detailUrl}')">
                    <img src="${ep.coverUrl}" class="w-full aspect-square object-cover rounded-lg mb-3" loading="lazy">
                    <h3 class="font-bold text-white truncate">${ep.title}</h3>
                    <p class="text-sm text-gray-400 truncate">${ep.author}</p>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>

            <div class="mb-12">
                <h2 class="text-2xl font-bold mb-4">Completados (${completedEpisodios.length})</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    `;

    if (completedEpisodios.length === 0) {
        html += '<p class="text-gray-400 col-span-full">No has completado ningún episodio.</p>';
    } else {
        completedEpisodios.forEach(ep => {
            html += `
                <div class="bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition" onclick="window.goToDetail('${ep.detailUrl}')">
                    <img src="${ep.coverUrl}" class="w-full aspect-square object-cover rounded-lg mb-3" loading="lazy">
                    <h3 class="font-bold text-white truncate">${ep.title}</h3>
                    <p class="text-sm text-gray-400 truncate">${ep.author}</p>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

export const header = true;
