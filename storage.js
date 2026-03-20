// storage.js - Gestión de lista de usuario (playlist, likes, completados)

const PLAYLIST_KEY = 'balta_playlist';
const LIKED_KEY = 'balta_liked';
const COMPLETED_KEY = 'balta_completed';

// --- Playlist (guardados) ---
export function getPlaylist() {
    try {
        return JSON.parse(localStorage.getItem(PLAYLIST_KEY)) || [];
    } catch {
        return [];
    }
}

export function addToPlaylist(episodio) {
    const playlist = getPlaylist();
    if (!playlist.some(item => item.id === episodio.id)) {
        playlist.push(episodio);
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
    }
    return playlist;
}

export function removeFromPlaylist(episodioId) {
    let playlist = getPlaylist();
    playlist = playlist.filter(item => item.id !== episodioId);
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
    return playlist;
}

export function isInPlaylist(episodioId) {
    return getPlaylist().some(item => item.id === episodioId);
}

// --- Liked (me gusta) ---
export function getLiked() {
    try {
        return JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    } catch {
        return [];
    }
}

export function toggleLiked(episodioId) {
    let liked = getLiked();
    if (liked.includes(episodioId)) {
        liked = liked.filter(id => id !== episodioId);
    } else {
        liked.push(episodioId);
    }
    localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
    return liked;
}

export function isLiked(episodioId) {
    return getLiked().includes(episodioId);
}

// --- Completed (completados) ---
export function getCompleted() {
    try {
        return JSON.parse(localStorage.getItem(COMPLETED_KEY)) || [];
    } catch {
        return [];
    }
}

export function markCompleted(episodioId) {
    let completed = getCompleted();
    if (!completed.includes(episodioId)) {
        completed.push(episodioId);
        localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
    }
    return completed;
}

export function isCompleted(episodioId) {
    return getCompleted().includes(episodioId);
}

// Objeto unificado
export const userStorage = {
    playlist: { get: getPlaylist, add: addToPlaylist, remove: removeFromPlaylist, has: isInPlaylist },
    liked: { get: getLiked, toggle: toggleLiked, has: isLiked },
    completed: { get: getCompleted, mark: markCompleted, has: isCompleted }
};
