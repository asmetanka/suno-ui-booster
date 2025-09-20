// injected.js

/**
 * Runs in the page context. Listens for delete requests from content.js
 * and executes API calls with page auth, bypassing CORS.
 */

/**
 * Retrieves authentication token from Clerk session or cookies.
 * @returns {string|null} The authentication token or null if not found
 */
async function getAuthToken() {
    try {
        if (window.Clerk && window.Clerk.session) {
            const token = await window.Clerk.session.getToken();
            if (token) return token;
        }
    } catch (e) {
        console.error('Injected Script: Failed to get token from Clerk, trying cookies.', e);
    }
    const sessionCookie = document.cookie.split(';').find(c => c.trim().startsWith('__session='));
    if (sessionCookie) return sessionCookie.split('=')[1].trim();
    return null;
}

/**
 * Sends a request to trash a song by its ID.
 * @param {string} songId - The ID of the song to trash
 * @returns {Object} Result object with success status and response details
 */
async function trashSongById(songId) {
    const token = await getAuthToken();
    if (!token) {
        console.error('Injected Script: No authentication token found.');
        return { success: false };
    }

    const API_URL = 'https://studio-api.prod.suno.com/api/gen/trash/';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // Required parameter to avoid 422 error - indicates this is a trash operation
            body: JSON.stringify({
                trash: true,
                clip_ids: [songId]
            })
        });

        return { success: response.ok, status: response.status };
    } catch (error) {
        console.error('Injected Script: Network error.', error);
        return { success: false };
    }
}

/**
 * Starts server-side WAV conversion for a clip and polls for the resulting file URL.
 * @param {string} clipId
 * @returns {Promise<{success: boolean, url?: string}>}
 */
async function convertAndFetchWavUrl(clipId) {
    const token = await getAuthToken();
    if (!token) {
        console.error('Injected Script: No authentication token for WAV.');
        return { success: false };
    }
    const base = 'https://studio-api.prod.suno.com/api/gen/';
    try {
        // Kick off conversion (may already be generated; server should be idempotent)
        await fetch(base + encodeURIComponent(clipId) + '/convert_wav/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            },
            body: null
        }).catch(() => {});

        // Poll for wav file availability
        const start = Date.now();
        const timeoutMs = 60000; // up to 60s
        let attempt = 0;
        while (Date.now() - start < timeoutMs) {
            attempt += 1;
            const res = await fetch(base + encodeURIComponent(clipId) + '/wav_file/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*'
                }
            });

            // If server returns a signed URL JSON
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    const data = await res.json();
                    const url = data?.url || data?.wav_url || data?.audio_url;
                    if (url) return { success: true, url };
                } catch (_) {}
            }

            // If resource is ready at CDN via open GET, try derived URL as a last resort
            if (res.ok) {
                // Some deployments expose direct CDN path — try HEAD to validate
                try {
                    const head = await fetch(`https://cdn1.suno.ai/${clipId}.wav`, { method: 'HEAD' });
                    if (head.ok) return { success: true, url: `https://cdn1.suno.ai/${clipId}.wav` };
                } catch (_) {}
            }

            // Not ready yet; backoff
            await new Promise(r => setTimeout(r, Math.min(500 + attempt * 300, 3000)));
        }
    } catch (e) {
        console.error('Injected Script: WAV conversion fetch error', e);
    }
    return { success: false };
}

// Listen for download wav request from content.js
window.addEventListener('SunoDownloadWavRequest', async (event) => {
    const { clipId } = event.detail || {};
    if (!clipId) return;
    const result = await convertAndFetchWavUrl(clipId);
    window.dispatchEvent(new CustomEvent('SunoDownloadWavResponse', { detail: { clipId, ...result } }));
});

// Listen for custom delete request events from content.js
window.addEventListener('SunoDeleteRequest', async (event) => {
    const { songId } = event.detail;
    if (songId) {
        const result = await trashSongById(songId);
        // Send response event back to content.js with the result
        window.dispatchEvent(new CustomEvent('SunoDeleteResponse', { detail: { songId, ...result } }));
    }
});