// 404.js
export function render(container) {
    container.innerHTML = `
        <div class="text-center py-20">
            <h1 class="text-6xl font-bold text-white mb-4">404</h1>
            <p class="text-xl text-gray-400 mb-8">Página no encontrada</p>
            <a href="/" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full transition" data-link>Volver al inicio</a>
        </div>
    `;
}

export const header = true;
