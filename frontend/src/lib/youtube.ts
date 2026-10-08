// YouTube URL helpers for metadata prefetch gating.
// Strict kind parsing stays server-side; these only decide whether to fire.

const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
]);

export function isYouTubeUrl(raw: string): boolean {
    const text = raw.trim();
    if (!text) return false;
    try {
        const u = new URL(text.includes('://') ? text : `https://${text}`);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        const host = u.hostname.toLowerCase().replace(/\.$/, '');
        if (YOUTUBE_HOSTS.has(host)) return true;
        return host === 'youtube.com' || host.endsWith('.youtube.com');
    } catch {
        return false;
    }
}

export function hasPlaylistParam(raw: string): boolean {
    try {
        const u = new URL(raw.trim().includes('://') ? raw.trim() : `https://${raw.trim()}`);
        return u.searchParams.get('list') !== null && u.searchParams.get('list') !== '';
    } catch {
        return false;
    }
}
