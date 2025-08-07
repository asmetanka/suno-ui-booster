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

// Listen for custom delete request events from content.js
window.addEventListener('SunoDeleteRequest', async (event) => {
    const { songId } = event.detail;
    if (songId) {
        const result = await trashSongById(songId);
        // Send response event back to content.js with the result
        window.dispatchEvent(new CustomEvent('SunoDeleteResponse', { detail: { songId, ...result } }));
    }
});