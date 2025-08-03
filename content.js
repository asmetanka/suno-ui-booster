// content.js
/**
 * @file content.js
 * @description Injects trash button functionality and communicates with injected.js for API requests,
 * solving CORS issues. This is the final, correct architecture.
 */

console.log('Suno UI Booster (CORS Fixed Version) Loaded!');

/**
 * Injects the 'injected.js' script into the page context.
 * This allows the script to access the page's authentication tokens and make API calls.
 */
function injectScript() {
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = () => {
            console.log('Suno UI Booster: Injected script loaded successfully');
            script.remove();
        };
        script.onerror = (error) => {
            console.error('Suno UI Booster: Failed to load injected script:', error);
        };
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.error('Suno UI Booster: Error injecting script:', error);
    }
}

/**
 * Extracts the unique song ID from a song row element.
 * @param {Element} songRow - The song row DOM element
 * @returns {string|null} The song ID or null if not found
 */
function getSongId(songRow) {
    try {
        const songLink = songRow.querySelector('a[href*="/song/"]');
        if (songLink) {
            const id = songLink.getAttribute('href').split('/song/')[1];
            if (id) return id;
        }
    } catch (error) {
        console.error('Suno UI Booster: Error getting song ID:', error);
    }
    return null;
}

/**
 * Hides share buttons from the interface.
 * Searches for various possible share button selectors and hides them.
 * @param {Element} songRow - The song row DOM element
 */
function hideShareButton(songRow) {
    try {
        // Search for share button using various possible selectors
        const shareSelectors = [
            'button[aria-label*="Share"]',
            'button[aria-label*="Поделиться"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="Export"]',
            'button[aria-label*="Link"]',
            'button[aria-label*="Copy"]',
            'button[data-testid*="share"]',
            'button[data-testid*="send"]',
            'button[data-testid*="export"]',
            'button[data-testid*="link"]',
            'button[data-testid*="copy"]'
        ];
        
        shareSelectors.forEach(selector => {
            const shareButton = songRow.querySelector(selector);
            if (shareButton) {
                shareButton.style.display = 'none !important';
                console.log('Suno UI Booster: Hidden share button:', selector);
            }
        });
    } catch (error) {
        console.error('Suno UI Booster: Error hiding share button:', error);
    }
}

/**
 * Creates and injects the trash button into song rows.
 * The button is styled to match the existing UI and positioned after "More Options".
 * @param {Element} songRow - The song row DOM element
 */
function addTrashButton(songRow) {
    try {
        if (songRow.querySelector('.suno-booster-trash-wrapper')) return;
        const moreOptionsButton = songRow.querySelector('button[aria-label="More Options"]');
        if (!moreOptionsButton) return;

        // Hide share button
        hideShareButton(songRow);

        const wrapper = document.createElement('div');
        wrapper.className = 'suno-booster-trash-wrapper';
        const trashButton = document.createElement('button');
        trashButton.className = 'trash-button-custom';
        trashButton.setAttribute('aria-label', 'Move to Trash');
        trashButton.setAttribute('type', 'button');
        trashButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M7.308 20.5a1.74 1.74 0 0 1-1.277-.531 1.74 1.74 0 0 1-.531-1.277V6h-.25a.73.73 0 0 1-.534-.216.73.73 0 0 1-.216-.534q0-.32.216-.535A.73.73 0 0 1 5.25 4.5H9q0-.368.259-.626a.85.85 0 0 1 .625-.259h4.232q.367 0 .625.259A.85.85 0 0 1 15 4.5h3.75q.318 0 .534-.216a.73.73 0 0 1 .216.534q0 .32-.216-.534A.73.73 0 0 1 18.75 6h-.25v12.692q0 .746-.531 1.277a1.74 1.74 0 0 1-1.277.531zm2.846-3.5q.319 0 .534-.215a.73.73 0 0 0 .216-.535v-7.5a.73.73 0 0 0-.216-.535.73.73 0 0 0-.535-.215.73.73 0 0 0-.534.215.73.73 0 0 0-.215.535v7.5q0 .318.216.535a.73.73 0 0 0 .534.215m3.693 0q.318 0 .534-.215a.73.73 0 0 0 .215-.535v-7.5a.73.73 0 0 0-.216-.535.73.73 0 0 0-.534-.215.73.73 0 0 0-.534-.215.73.73 0 0 0-.216.535v7.5q0 .318.216.535a.73.73 0 0 0 .535.215"></path></svg>`;

        trashButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const songId = getSongId(songRow);
            if (!songId) {
                alert('Suno UI Booster: Could not find song ID.');
                return;
            }

            window.dispatchEvent(new CustomEvent('SunoDeleteRequest', { detail: { songId } }));
            trashButton.disabled = true;
            trashButton.style.opacity = '0.5';
        });

        wrapper.appendChild(trashButton);
        
        // Insert button AFTER "More Options" button (changed order)
        const parentContainer = moreOptionsButton.parentElement;
        if (parentContainer) {
            parentContainer.insertBefore(wrapper, moreOptionsButton.nextSibling);
        } else {
            moreOptionsButton.parentElement.appendChild(wrapper);
        }
    } catch (error) {
        console.error('Suno UI Booster: Error adding trash button:', error);
    }
}

/**
 * Processes all song rows in a container and adds trash buttons to them.
 * @param {Element} containerNode - The container element to process
 */
function processSongRows(containerNode) {
    try {
        const songRows = containerNode.querySelectorAll('[data-testid="song-row"], .css-1b0cg3t, .css-1jkulof, .css-c1kosu');
        songRows.forEach(songRow => {
            addTrashButton(songRow);
            // Also hide share buttons in existing elements
            hideShareButton(songRow);
        });
    } catch (error) {
        console.error('Suno UI Booster: Error processing song rows:', error);
    }
}

/**
 * Initializes the extension functionality.
 * Sets up event listeners and starts observing DOM changes.
 */
function initialize() {
    try {
        injectScript();

        // Listen for delete response events from injected script
        window.addEventListener('SunoDeleteResponse', (event) => {
            try {
                const { songId, success, status } = event.detail;
                const songRow = document.querySelector(`a[href*="/song/${songId}"]`)?.closest('[data-testid="song-row"], .css-1b0cg3t, .css-1jkulof, .css-c1kosu');

                if (songRow) {
                    if (success) {
                        // Animate song row removal
                        songRow.style.transition = 'opacity 0.5s ease';
                        songRow.style.opacity = '0';
                        setTimeout(() => songRow.remove(), 500);
                    } else {
                        alert(`Failed to delete song ${songId}. Error status: ${status || 'Network Error'}. Check console for details.`);
                        const trashButton = songRow.querySelector('.trash-button-custom');
                        if (trashButton) {
                            trashButton.disabled = false;
                            trashButton.style.opacity = '1';
                        }
                    }
                }
            } catch (error) {
                console.error('Suno UI Booster: Error handling delete response:', error);
            }
        });

        // Observe DOM changes to handle dynamically added song rows
        const observer = new MutationObserver((mutationsList) => {
            try {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.matches('[data-testid="song-row"], .css-1b0cg3t, .css-1jkulof, .css-c1kosu')) {
                                    addTrashButton(node);
                                    hideShareButton(node);
                                } else if (node.querySelector) {
                                    processSongRows(node);
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Suno UI Booster: Error in mutation observer:', error);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        processSongRows(document.body);
        console.log('Suno UI Booster Initialized.');
    } catch (error) {
        console.error('Suno UI Booster: Error initializing:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 