// injected.js

/**
 * Этот скрипт работает в контексте самой страницы. Он слушает запросы на удаление
 * от content.js и выполняет API-вызов, обходя проблемы с CORS.
 */
async function getAuthToken() {
    try {
        if (window.Clerk && window.Clerk.session) {
            const token = await window.Clerk.session.getToken();
            if (token) return token;
        }
    } catch (e) {
        console.error('Injected Script: Не удалось получить токен от Clerk, пробую cookies.', e);
    }
    const sessionCookie = document.cookie.split(';').find(c => c.trim().startsWith('__session='));
    if (sessionCookie) return sessionCookie.split('=')[1].trim();
    return null;
}

async function trashSongById(songId) {
    const token = await getAuthToken();
    if (!token) {
        console.error('Injected Script: Нет токена авторизации.');
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
            // ИСПРАВЛЕНО: Добавлен недостающий параметр "trash: true", чтобы избежать ошибки 422.
            body: JSON.stringify({
                trash: true,
                clip_ids: [songId]
            })
        });

        return { success: response.ok, status: response.status };
    } catch (error) {
        console.error('Injected Script: Ошибка сети.', error);
        return { success: false };
    }
}

// Слушаем кастомное событие от content.js с запросом на удаление.
window.addEventListener('SunoDeleteRequest', async (event) => {
    const { songId } = event.detail;
    if (songId) {
        const result = await trashSongById(songId);
        // Отправляем ответное событие обратно в content.js с результатом.
        window.dispatchEvent(new CustomEvent('SunoDeleteResponse', { detail: { songId, ...result } }));
    }
});

console.log('Suno UI Booster Injected Script Loaded!'); 