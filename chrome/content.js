// content.js
/**
 * Entry point for in-page behavior.
 *
 * Responsibilities:
 * - Observe DOM changes and initialize UI customizations deterministically
 * - Inject a Trash button into song rows; prefer native menu action, fallback to API channel
 * - Align Workspace dropdown under its button and match width/position
 * - Keep Advanced Options expanded by hiding only the header row
 * - Adjust bottom spacing of the Create row based on Playbar progress height (above default), capped to 80px
 *
 * Principles:
 * - Non-invasive (no network/CSP tampering, no constructor overrides)
 * - Small, focused helpers; avoid global state beyond enabled flag
 * - Prefer resilient structural selectors; avoid brittle class chains
 */

// Suno UI Booster content entry point. All UI customizations and in-page
// interactions start here.

// Global variable to track extension state
let isExtensionEnabled = true;
// Keep references to observers and listeners so we can fully disable
let domObserverRef = null;
let advancedObserverRef = null;
let viewportListenerRef = null;

/**
 * Checks if the extension is enabled by reading from storage
 * @returns {Promise<boolean>} Whether the extension is enabled
 */
async function checkExtensionState() {
    try {
        const result = await chrome.storage.sync.get(['enabled']);
        isExtensionEnabled = result.enabled !== false; // Defaults to enabled
        return isExtensionEnabled;
    } catch (error) {
        console.error('Suno UI Booster: Error checking extension state:', error);
        return true; // Default to enabled on error
    }
}

/**
 * Injects the 'injected.js' script into the page context.
 * This allows the script to access the page's authentication tokens and make API calls.
 */
function injectScript() {
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = () => { script.remove(); };
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
        // Prefer explicit data attribute if present on the row
        const dataId = songRow.getAttribute && songRow.getAttribute('data-clip-id');
        if (dataId) return dataId;
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

/** Extract current playing clip id from playbar area. */
function getPlaybarSongId(root = document) {
  try {
    const link = root.querySelector('a[aria-label^="Playbar: Title"][href*="/song/"]') || document.querySelector('a[aria-label^="Playbar: Title"][href*="/song/"]');
    if (!link) return null;
    const href = link.getAttribute('href') || '';
    const parts = href.split('/song/');
    if (parts[1]) return parts[1];
  } catch (_) {}
  return null;
}

/**
 * Insert our Download WAV button into the playbar controls, between Pin and More Options.
 */
function addPlaybarDownloadButton(playbarRoot) {
  try {
    if (!isExtensionEnabled) return;
    if (playbarRoot.querySelector('.suno-booster-download-wrapper')) return;
    const moreBtn = playbarRoot.querySelector('button[aria-label*="More"]');
    if (!moreBtn) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'suno-booster-download-wrapper flex items-center';
    const btn = document.createElement('button');
    btn.className = 'download-button-custom';
    btn.setAttribute('type','button');
    btn.setAttribute('aria-label','Download WAV');
    btn.innerHTML = '<span class="download-wav-text">WAV</span>';

    const stop = (ev) => { ev.stopImmediatePropagation?.(); ev.stopPropagation(); };
    ['pointerdown','mousedown','mouseup','touchstart','touchend','keydown','keyup'].forEach(t=>btn.addEventListener(t, stop, { capture:true }));
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      try {
        const clipId = getPlaybarSongId(playbarRoot) || getPlaybarSongId(document);
        if (!clipId) { alert('Suno UI Booster: Could not find song ID.'); return; }
        if (!btn.dataset.prevInner) btn.dataset.prevInner = btn.innerHTML;
        const waveAnim = '<svg class="suno-wav-anim" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(12,12)"><rect class="animate-wave1" x="-10" y="-7" width="4" height="14" rx="2"></rect><rect class="animate-wave2" x="-2" y="-7" width="4" height="14" rx="2"></rect><rect class="animate-wave3" x="6" y="-7" width="4" height="14" rx="2"></rect></g></svg>';
        btn.innerHTML = waveAnim;
        btn.disabled = true;
        btn.classList.add('suno-loading');
        window.dispatchEvent(new CustomEvent('SunoDownloadWavRequest', { detail: { clipId } }));
      } catch(err) { console.error('Suno UI Booster: playbar WAV click', err); }
    });

    wrapper.appendChild(btn);

    // Place between Pin and More Options when possible
    let insertionContainer = moreBtn.parentElement;
    for (let n = 0; n < 5 && insertionContainer && !insertionContainer.classList.contains('flex'); n += 1) {
      insertionContainer = insertionContainer.parentElement;
    }
    if (insertionContainer && moreBtn) {
      // After Pin block if exists
      const pin = insertionContainer.querySelector('button[aria-label*="Pin"][type="button"]');
      if (pin) {
        let top = pin; while (top && top.parentElement !== insertionContainer) top = top.parentElement;
        if (top && top.nextSibling) { insertionContainer.insertBefore(wrapper, top.nextSibling); return; }
      }
      // Otherwise before More
      let anchor = moreBtn; while (anchor && anchor.parentElement !== insertionContainer) anchor = anchor.parentElement;
      if (anchor) { insertionContainer.insertBefore(wrapper, anchor); return; }
    }
    // Fallback
    moreBtn.parentElement?.insertBefore(wrapper, moreBtn);
  } catch (e) { console.error('Suno UI Booster: addPlaybarDownloadButton error', e); }
}

/** Insert our Trash button into playbar and wire native+fallback delete. */
function addPlaybarTrashButton(playbarRoot) {
  try {
    if (!isExtensionEnabled) return;
    if (playbarRoot.querySelector('.suno-booster-trash-wrapper')) return;
    const moreBtn = playbarRoot.querySelector('button[aria-label*="More"]');
    if (!moreBtn) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'suno-booster-trash-wrapper';
    const btn = document.createElement('button');
    btn.className = 'trash-button-custom';
    btn.setAttribute('type','button');
    btn.setAttribute('aria-label','Move to Trash');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M7.308 20.5a1.74 1.74 0 0 1-1.277-.531 1.74 1.74 0 0 1-.531-1.277V6h-.25a.73.73 0 0 1-.534-.216.73.73 0 0 1-.216-.534q0-.32.216-.535A.73.73 0 0 1 5.25 4.5H9q0-.368.259-.626a.85.85 0 0 1 .625-.259h4.232q.367 0 .625.259A.85.85 0 0 1 15 4.5h3.75q.318 0 .534-.216a.73.73 0 0 1 .216.534q0 .32-.216-.534A.73.73 0 0 1 18.75 6h-.25v12.692q0 .746-.531 1.277a1.74 1.74 0 0 1-1.277.531zm2.846-3.5q.319 0 .534-.215a.73.73 0 0 0 .216-.535v-7.5a.73.73 0 0 0-.216-.535.73.73 0 0 0-.535-.215.73.73 0 0 0-.534.215.73.73 0 0 0-.215.535v7.5q0 .318.216.535a.73.73 0 0 0 .534.215m3.693 0q.318 0 .534-.215a.73.73 0 0 0 .215-.535v-7.5a.73.73 0 0 0-.216-.535.73.73 0 0 0-.534-.215.73.73 0 0 0-.534-.215.73.73 0 0 0-.216.535v7.5q0 .318.216.535a.73.73 0 0 0 .535.215"></path></svg>';

    const stop = (ev) => { ev.stopImmediatePropagation?.(); ev.stopPropagation(); };
    ['pointerdown','mousedown','mouseup','touchstart','touchend','keydown','keyup'].forEach(t=>btn.addEventListener(t, stop, { capture:true }));
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const clipId = getPlaybarSongId(playbarRoot) || getPlaybarSongId(document);
      if (!clipId) { alert('Suno UI Booster: Could not find song ID.'); return; }
      // Prefer native menu path for Undo toast
      const usedNative = await (async () => {
        try {
          const mb = playbarRoot.querySelector('button[aria-label*="More"]');
          if (!mb) return false;
          mb.click();
          const found = await waitForMenuItem([/move\s*to\s*trash/i, /trash/i, /delete/i], 1500);
          if (found) { found.click(); return true; }
        } catch(_) {}
        return false;
      })();
      if (usedNative) return;
      // Fallback via API
      window.dispatchEvent(new CustomEvent('SunoDeleteRequest', { detail: { songId: clipId } }));
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });

    wrapper.appendChild(btn);

    // Place before More Options (mirroring row)
    let insertionContainer = moreBtn.parentElement;
    for (let n = 0; n < 5 && insertionContainer && !insertionContainer.classList.contains('flex'); n += 1) {
      insertionContainer = insertionContainer.parentElement;
    }
    if (insertionContainer && moreBtn) {
      let anchor = moreBtn; while (anchor && anchor.parentElement !== insertionContainer) anchor = anchor.parentElement;
      if (anchor) { insertionContainer.insertBefore(wrapper, anchor); return; }
    }
    moreBtn.parentElement?.insertBefore(wrapper, moreBtn);
  } catch (e) { console.error('Suno UI Booster: addPlaybarTrashButton error', e); }
}

/** Ensure playbar controls have our buttons. */
function ensurePlaybarButtons(root = document) {
  try {
    const moreButtons = Array.from(root.querySelectorAll('button[aria-label*="More"]'))
      .filter((b) => !b.closest('[data-testid="song-row"]'));
    if (moreButtons.length === 0) return;
    // Use nearest flex container as playbar root
    for (const moreBtn of moreButtons) {
      let pr = moreBtn.parentElement;
      let steps = 0;
      while (pr && steps < 8 && !(pr.querySelector?.('button[aria-label="Playbar: Like"], a[aria-label^="Playbar: Title"]'))) { pr = pr.parentElement; steps += 1; }
      const rootNode = pr || moreBtn.parentElement || root;
      addPlaybarDownloadButton(rootNode);
      addPlaybarTrashButton(rootNode);
    }
  } catch (e) { console.error('Suno UI Booster: ensurePlaybarButtons error', e); }
}

/**
 * Tries to trigger Suno's native "Move to Trash" action via the 3-dots menu
 * so their own toast with Undo appears. Returns true if we managed to click it.
 * @param {Element} songRow
 * @returns {Promise<boolean>}
 */
async function triggerNativeTrash(songRow) {
    try {
        const moreBtn = songRow.querySelector('button[aria-label*="More"]');
        if (!moreBtn) return false;

        // Open the native menu
        moreBtn.click();

        // Wait for a menu item containing "Trash" / "Move to Trash" / "Delete"
        const found = await waitForMenuItem([
            /move\s*to\s*trash/i,
            /trash/i,
            /delete/i
        ], 1500);

        if (found) {
            found.click();
            return true;
        }
        return false;
    } catch (err) {
        console.error('Suno UI Booster: triggerNativeTrash error', err);
        return false;
    }
}

/**
 * Triggers Suno's native Download → WAV Audio flow via the 3-dots menu.
 * Returns true if both menu items were found and clicked.
 * @param {Element} songRow
 * @returns {Promise<boolean>}
 */
async function triggerNativeDownloadWAV(songRow) {
    try {
        const moreBtn = songRow.querySelector('button[aria-label*="More"]');
        if (!moreBtn) return false;

        // Open the native menu
        moreBtn.click();
        
        // Find the "Download" submenu trigger
        const downloadItem = await waitForMenuItem([/\bdownload\b/i], 1800);
        if (!downloadItem) return false;

        // Radix submenus often open on hover; simulate hover to open the submenu
        const events = ['pointerover', 'mouseover', 'mouseenter', 'pointermove'];
        for (const type of events) {
            downloadItem.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        }
        // Small delay to allow submenu to render
        await new Promise(r => setTimeout(r, 120));

        // Now find and click "WAV Audio" in the opened submenu
        const wavItem = await waitForMenuItem([/wav\s*audio/i, /\bwav\b/i], 2000);
        if (!wavItem) return false;
        wavItem.click();
        return true;
    } catch (err) {
        console.error('Suno UI Booster: triggerNativeDownloadWAV error', err);
        return false;
    }
}

/**
 * Waits for a menu item whose text matches any of the given patterns.
 * @param {RegExp[]} patterns
 * @param {number} timeoutMs
 * @returns {Promise<HTMLElement|null>}
 */
function waitForMenuItem(patterns, timeoutMs = 1500) {
    return new Promise((resolve) => {
        const tryFind = () => {
            const candidates = document.querySelectorAll('button, [role="menuitem"], div[role="menuitem"]');
            for (const el of candidates) {
                const text = (el.textContent || '').trim();
                if (!text) continue;
                if (patterns.some((re) => re.test(text))) {
                    return el;
                }
            }
            return null;
        };

        const immediate = tryFind();
        if (immediate) return resolve(immediate);

        const obs = new MutationObserver(() => {
            const match = tryFind();
            if (match) {
                obs.disconnect();
                resolve(match);
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            obs.disconnect();
            resolve(null);
        }, timeoutMs);
    });
}

/**
 * Send a message to the background service worker safely.
 * Resolves with the response or an object { success: false, error?, timeout: true }
 */
function safeSendMessage(message, timeoutMs = 700) {
  return new Promise((resolve) => {
    let finished = false;
    try {
      chrome.runtime.sendMessage(message, (resp) => {
        if (finished) return;
        finished = true;
        const err = chrome.runtime.lastError;
        if (err) return resolve({ success: false, error: err.message });
        return resolve(resp || { success: false });
      });
    } catch (e) {
      if (!finished) {
        finished = true;
        return resolve({ success: false, error: String(e) });
      }
    }
    setTimeout(() => {
      if (finished) return;
      finished = true;
      return resolve({ success: false, timeout: true });
    }, timeoutMs);
  });
}

/**
 * Hides share buttons from the interface.
 * Searches for various possible share button selectors and hides them.
 * @param {Element} songRow - The song row DOM element
 */
function hideShareButton(songRow) {
    // Don't hide share buttons if extension is disabled
    if (!isExtensionEnabled) return;
    
    try {
        // Search for share button using various possible selectors
        const shareSelectors = [
            'button[aria-label*="Share"]',
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
                // Inline style is sufficient here
                shareButton.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Suno UI Booster: Error hiding share button:', error);
    }
}

/**
 * Replaces Like/Dislike button icons with heart/cross while preserving styles.
 * @param {Element} songRow - The song row DOM element
 */
function replaceLikeDislikeIcons(songRow) {
    if (!isExtensionEnabled) return;

    try {
        const likeButtons = songRow.querySelectorAll('button[aria-label*="Like"], button[aria-label*="like"]');
        const dislikeButtons = songRow.querySelectorAll('button[aria-label*="Dislike"], button[aria-label*="dislike"]');

        const setIcon = (button, type) => {
            if (!button || button.dataset.sunoIconType === type) return;
            const svg = button.querySelector('svg');
            if (!svg) return;

            // Ensure the SVG uses currentColor so it follows hover/active styles
            svg.setAttribute('fill', 'currentColor');
            svg.setAttribute('viewBox', '0 0 24 24');

            if (type === 'like') {
                // Heart icon
                svg.innerHTML = '<g><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1 4.22 2.44C11.09 5 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></g>';
                button.dataset.sunoIconType = 'like';
            } else if (type === 'dislike') {
                // Cross (close) icon
                svg.innerHTML = '<g><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29z"></path></g>';
                button.dataset.sunoIconType = 'dislike';
            }
        };

        likeButtons.forEach(btn => setIcon(btn, 'like'));
        dislikeButtons.forEach(btn => setIcon(btn, 'dislike'));
    } catch (error) {
        console.error('Suno UI Booster: Error replacing like/dislike icons:', error);
    }
}

/**
 * Replaces Pin/Pin to Project icons with an outlined bookmark icon.
 * @param {Element} songRow - The song row DOM element
 */
function replaceBookmarkIcons(songRow) {
    if (!isExtensionEnabled) return;

    try {
        const pinButtons = songRow.querySelectorAll('button[aria-label="Pin"], button[aria-label*="Pin to Project"], button[aria-label*="Pin to"]');

        const isPinned = (button) => {
            const ariaPressed = button.getAttribute('aria-pressed');
            if (ariaPressed === 'true') return true;
            const ariaLabel = button.getAttribute('aria-label') || '';
            return /Unpin|Pinned/i.test(ariaLabel);
        };

        pinButtons.forEach(button => {
            if (!button || button.dataset.sunoBookmarkOutlined === '1') return;
            if (isPinned(button)) return; // keep pinned look unchanged

            const svg = button.querySelector('svg');
            if (!svg) return;

            // Make bookmark outlined using currentColor
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.innerHTML = '<g><path d="M7 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2z"/></g>';

            button.dataset.sunoBookmarkOutlined = '1';
        });
    } catch (error) {
        console.error('Suno UI Booster: Error replacing bookmark icons:', error);
    }
}

/**
 * Hides specific header labels with exact texts to avoid hiding unrelated UI.
 * Only hides spans having all of: mr-8, flex, flex-row, items-center, gap-[5px]
 * and text content strictly equal to "Song Title" or "Workspace".
 * @param {ParentNode} root
 */
function hideHeaderLabels(root = document) {
  if (!isExtensionEnabled) return;
  try {
    const candidates = root.querySelectorAll('span.mr-8.flex.flex-row.items-center');
    candidates.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (!el.classList.contains('gap-[5px]')) return;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text === 'Song Title' || text === 'Workspace') {
        el.style.setProperty('display', 'none', 'important');
      }
    });
  } catch (_) {
    // no-op
  }
}

/** Show labels previously hidden by hideHeaderLabels. */
function unhideHeaderLabels(root = document) {
  try {
    const candidates = root.querySelectorAll('span.mr-8.flex.flex-row.items-center');
    candidates.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text === 'Song Title' || text === 'Workspace') {
        el.style.removeProperty('display');
      }
    });
  } catch (_) {
    // no-op
  }
}

/**
 * Creates and injects the trash button into song rows.
 * The button is styled to match the existing UI and positioned after "More Options".
 * @param {Element} songRow - The song row DOM element
 */
function addTrashButton(songRow) {
    // Don't add trash button if extension is disabled
    if (!isExtensionEnabled) return;
    
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

        // Shield the row from receiving press events when clicking the trash button
        const stop = (ev) => { ev.stopImmediatePropagation?.(); ev.stopPropagation(); };
        ['pointerdown','mousedown','mouseup','touchstart','touchend'].forEach(type => {
            trashButton.addEventListener(type, stop, { capture: true });
        });
        // Also shield keyboard navigation on the row when activating the button
        ['keydown','keyup'].forEach(type => {
            trashButton.addEventListener(type, stop, { capture: true });
        });

    trashButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

            const songId = getSongId(songRow);
            if (!songId) {
                console.error('Suno UI Booster: Could not find song ID.');
                alert('Suno UI Booster: Could not find song ID.');
          return;
        }

            // Prefer native menu flow to get Suno's built-in toast/undo
            const usedNative = await triggerNativeTrash(songRow);
            if (usedNative) {
                // Let Suno UI handle toast/undo. Optionally disable briefly to avoid double-clicks
                trashButton.disabled = true;
                setTimeout(() => { trashButton.disabled = false; }, 1500);
                return;
            }

            // Fallback: direct API deletion
            // Native option not found – use direct API deletion
            window.dispatchEvent(new CustomEvent('SunoDeleteRequest', { detail: { songId } }));
            trashButton.disabled = true;
            trashButton.style.opacity = '0.5';
        });

        wrapper.appendChild(trashButton);
        
        // Smart placement logic - find the best position for the trash button
        const parentContainer = moreOptionsButton.parentElement;
        if (!parentContainer) {
            console.error('Suno UI Booster: Could not find parent container for More Options button');
            return;
        }

        // Strategy 1: Try to find the dislike button and place after it
        const dislikeButton = songRow.querySelector('button[aria-label*="Dislike"], button[aria-label*="dislike"]');
        if (dislikeButton && dislikeButton.parentElement === parentContainer) {
            parentContainer.insertBefore(wrapper, dislikeButton.nextSibling);
          return;
        }

        // Strategy 2: Try to find like button and place after it
        const likeButton = songRow.querySelector('button[aria-label*="Like"], button[aria-label*="like"]');
        if (likeButton && likeButton.parentElement === parentContainer) {
            parentContainer.insertBefore(wrapper, likeButton.nextSibling);
          return;
        }

        // Strategy 3: Look for specific container classes that indicate button groups
        const buttonContainer = songRow.querySelector('.flex.w-full.flex-row.items-center.gap-1.ml-4, .css-1kcq9v9, [class*="flex"][class*="items-center"][class*="gap"]');
        if (buttonContainer) {
            // Find the last button in this container
            const buttons = buttonContainer.querySelectorAll('button');
            if (buttons.length > 0) {
                const lastButton = buttons[buttons.length - 1];
                buttonContainer.insertBefore(wrapper, lastButton.nextSibling);
                return;
            }
        }

        // Strategy 3.5: Look for any flex container with buttons
        const flexContainers = songRow.querySelectorAll('[class*="flex"][class*="items-center"]');
        for (const container of flexContainers) {
            const buttons = container.querySelectorAll('button');
            if (buttons.length > 2) { // If there are multiple buttons, this is likely a button group
                const lastButton = buttons[buttons.length - 1];
                container.insertBefore(wrapper, lastButton.nextSibling);
                return;
            }
        }

        // Strategy 4: Fallback - place after More Options button
        parentContainer.insertBefore(wrapper, moreOptionsButton.nextSibling);
        // Fallback placement after More Options

      } catch (error) {
        console.error('Suno UI Booster: Error adding trash button:', error);
    }
}

/**
 * Creates and injects the Download WAV button into song rows.
 * The button is styled to match the existing UI and positioned after "More Options".
 * @param {Element} songRow - The song row DOM element
 */
function addDownloadButton(songRow) {
    if (!isExtensionEnabled) return;
    try {
        if (songRow.querySelector('.suno-booster-download-wrapper')) return;
        // Target the bottom action row container precisely
        const actionRow = songRow.querySelector('.css-1kcq9v9 > .flex.w-full.flex-row.items-center.gap-0.ml-4')
          || songRow.querySelector('.flex.w-full.flex-row.items-center.gap-0.ml-4')
          || songRow.querySelector('.css-1kcq9v9');
        if (!actionRow) return;
        // Look for the ellipsis button inside the action row
        const moreOptionsButton = actionRow.querySelector('button[aria-label*="More"]');
        if (!moreOptionsButton) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'suno-booster-download-wrapper flex items-center';
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-button-custom';
        downloadButton.setAttribute('aria-label', 'Download WAV');
        downloadButton.setAttribute('type', 'button');
        downloadButton.innerHTML = '<span class="download-wav-text">WAV</span>';

        const stop = (ev) => { ev.stopImmediatePropagation?.(); ev.stopPropagation(); };
        ['pointerdown','mousedown','mouseup','touchstart','touchend'].forEach(type => {
            downloadButton.addEventListener(type, stop, { capture: true });
        });
        ['keydown','keyup'].forEach(type => {
            downloadButton.addEventListener(type, stop, { capture: true });
        });

        downloadButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const clipId = getSongId(songRow);
                if (!clipId) {
                    console.error('Suno UI Booster: Could not find song ID for WAV.');
                    alert('Suno UI Booster: Could not find song ID.');
                    return;
                }
                // Swap WAV label with a small 3-bar wave animation while preparing
                const waveAnim = '<svg class="suno-wav-anim" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g transform="translate(12,12)"><rect class="animate-wave1" x="-10" y="-7" width="4" height="14" rx="2"></rect><rect class="animate-wave2" x="-2" y="-7" width="4" height="14" rx="2"></rect><rect class="animate-wave3" x="6" y="-7" width="4" height="14" rx="2"></rect></g></svg>';
                if (!downloadButton.dataset.prevInner) {
                  downloadButton.dataset.prevInner = downloadButton.innerHTML;
                }
                downloadButton.innerHTML = waveAnim;
                downloadButton.classList.add('suno-loading');
                downloadButton.disabled = true;
                downloadButton.style.opacity = '1';
                window.dispatchEvent(new CustomEvent('SunoDownloadWavRequest', { detail: { clipId } }));
            } catch (err) {
                console.error('Suno UI Booster: Download WAV click error', err);
            }
        });

        wrapper.appendChild(downloadButton);

        // Preferred placement: inside the inner action container (the button group) between Pin and More
        const innerContainer = actionRow.querySelector('.flex.w-full.flex-row.items-center.gap-0, .flex.w-full.flex-row.items-center') || actionRow.querySelector('.flex.w-full.flex-row.items-center.gap-0.ml-4');
        if (innerContainer) {
            try {
                // Find the top-level child that contains the Pin button
                const children = Array.from(innerContainer.children);
                let placed = false;
                for (const child of children) {
                    if (child.querySelector && child.querySelector('button[aria-label*="Pin"], [data-suno-bookmark-outlined]')) {
                        // insert after this child
                        if (child.nextSibling) {
                            innerContainer.insertBefore(wrapper, child.nextSibling);
                        } else {
                            innerContainer.appendChild(wrapper);
                        }
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    // Fallback: insert before direct child that contains More button
                    for (const child of children) {
                        if (child.querySelector && child.querySelector('button[aria-label*="More"]')) {
                            innerContainer.insertBefore(wrapper, child);
                            placed = true;
                            break;
                        }
                    }
                }
                if (placed) return;
            } catch (err) {
                // continue to other fallbacks
            }
        }

        // Fallback: try to append near like/dislike group
        const buttonContainer = actionRow;
        if (buttonContainer) {
            const buttons = buttonContainer.querySelectorAll('button');
            if (buttons.length > 0) {
                // Try to find a More/ellipsis button to insert before, otherwise after Pin
                const moreBtnInContainer = Array.from(buttons).find(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('more'));
                if (moreBtnInContainer) {
                    // Ensure anchor is a direct child of buttonContainer
                    let anchorNode = moreBtnInContainer;
                    while (anchorNode && anchorNode.parentElement !== buttonContainer) {
                        anchorNode = anchorNode.parentElement;
                    }
                    if (anchorNode && anchorNode.parentElement === buttonContainer) {
                        buttonContainer.insertBefore(wrapper, anchorNode);
                        return;
                    }
                    return;
                }
                const pinBtnInContainer = Array.from(buttons).find(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('pin'));
                if (pinBtnInContainer && pinBtnInContainer.nextSibling) {
                    // Find the top-level child that holds pin button
                    let anchorNode = pinBtnInContainer;
                    while (anchorNode && anchorNode.parentElement !== buttonContainer) {
                        anchorNode = anchorNode.parentElement;
                    }
                    if (anchorNode && anchorNode.nextSibling) {
                        buttonContainer.insertBefore(wrapper, anchorNode.nextSibling);
                        return;
                    }
                    return;
                }
                // Otherwise append at end of this container
                const lastButton = buttons[buttons.length - 1];
                buttonContainer.insertBefore(wrapper, lastButton.nextSibling);
                return;
            }
        }

        // Final fallback: try to place right before any element whose aria-label contains More
        const anyMore = actionRow.querySelector('button[aria-label*="More"]');
        if (anyMore && anyMore.parentElement) {
            anyMore.parentElement.insertBefore(wrapper, anyMore);
        } else {
            // If nothing matched, append to row (rare)
            actionRow.appendChild(wrapper);
        }
    } catch (error) {
        console.error('Suno UI Booster: Error adding download button:', error);
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
            addDownloadButton(songRow);
            // Also hide share buttons in existing elements
            hideShareButton(songRow);
            // Replace like/dislike icons
            replaceLikeDislikeIcons(songRow);
            // Replace pin icons with outlined variant
            replaceBookmarkIcons(songRow);
        });
    } catch (error) {
        console.error('Suno UI Booster: Error processing song rows:', error);
    }
}

/**
 * Removes all trash buttons from the page when extension is disabled
 */
function removeAllTrashButtons() {
    try {
        const trashButtons = document.querySelectorAll('.suno-booster-trash-wrapper');
        trashButtons.forEach(wrapper => {
            wrapper.remove();
        });
        console.log('Suno UI Booster: Removed all trash buttons');
    } catch (error) {
        console.error('Suno UI Booster: Error removing trash buttons:', error);
    }
}

/**
 * Removes all Download WAV buttons from the page when extension is disabled
 */
function removeAllDownloadButtons() {
    try {
        const downloadButtons = document.querySelectorAll('.suno-booster-download-wrapper');
        downloadButtons.forEach(wrapper => {
            wrapper.remove();
        });
        console.log('Suno UI Booster: Removed all download buttons');
    } catch (error) {
        console.error('Suno UI Booster: Error removing download buttons:', error);
    }
}

/**
 * Shows all share buttons that were hidden by the extension
 */
function showAllShareButtons() {
    try {
        const shareSelectors = [
            'button[aria-label*="Share"]',
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
            const shareButtons = document.querySelectorAll(selector);
            shareButtons.forEach(button => {
                button.style.display = ''; // Reset to default display
            });
        });
        console.log('Suno UI Booster: Showed all share buttons');
    } catch (error) {
        console.error('Suno UI Booster: Error showing share buttons:', error);
    }
}

/**
 * Handles extension state changes in real-time
 * @param {boolean} enabled - Whether the extension should be enabled
 */
async function handleExtensionStateChange(enabled) {
    isExtensionEnabled = enabled;
    
    if (enabled) {
        console.log('Suno UI Booster: Extension enabled - initializing features');
        // Re-initialize features
        processSongRows(document.body);
      } else {
        console.log('Suno UI Booster: Extension disabled - removing features');
        // Remove all extension features and inline adjustments
        removeAllTrashButtons();
        removeAllDownloadButtons();
        showAllShareButtons();
        unhideHeaderLabels(document.body);
        resetAdvancedOptions(document.body);
        resetWorkspaceDropdowns(document.body);
        resetCreateRowBottomMargin(document.body);
    resetVocalGenderRowStyles(document.body);
        // Disconnect observers
        try { domObserverRef && domObserverRef.disconnect(); } catch (_) {}
        try { advancedObserverRef && advancedObserverRef.disconnect(); } catch (_) {}
        // Remove viewport listeners
        if (viewportListenerRef) {
          window.removeEventListener('resize', viewportListenerRef);
          window.removeEventListener('scroll', viewportListenerRef, true);
          viewportListenerRef = null;
        }
    }
}

/**
 * Initializes the extension functionality.
 * Sets up event listeners and starts observing DOM changes.
 */
async function initialize() {
    try {
        await checkExtensionState(); // Check extension state first
        if (!isExtensionEnabled) {
            console.log('Suno UI Booster: Extension is disabled. Skipping initialization.');
            return;
        }

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

        // Listen for WAV download responses
        window.addEventListener('SunoDownloadWavResponse', (event) => {
            try {
                const { clipId, success, url } = event.detail || {};
                const songRow = document.querySelector(`[data-clip-id="${clipId}"]`) || document.querySelector(`a[href*="/song/${clipId}"]`)?.closest('[data-testid="song-row"], .css-1b0cg3t, .css-1jkulof, .css-c1kosu');
                const button = songRow?.querySelector('.download-button-custom');
                if (!success || !url) {
                    if (button) {
                      button.disabled = false;
                      button.style.opacity = '1';
                      if (button.dataset.prevInner) {
                        button.innerHTML = button.dataset.prevInner;
                        delete button.dataset.prevInner;
                      }
                    }
                    alert('Suno UI Booster: WAV not ready. Try again later.');
                    return;
                }
                // Generate filename
                const titleEl = songRow?.querySelector('a[href*="/song/"] span, span[title]');
                const title = (titleEl?.textContent || titleEl?.getAttribute('title') || 'suno').replace(/[\\/:*?"<>|]+/g, ' ').trim();
                const versionBadge = songRow?.querySelector('.css-1fb3o3p span');
                const versionText = (versionBadge?.textContent || '').trim().replace(/\s+/g, '');
                const baseName = [title, versionText ? `(${versionText})` : '', clipId].filter(Boolean).join(' - ');
                const fileName = baseName.endsWith('.wav') ? baseName : `${baseName}.wav`;

                // Ask the background service worker to perform the download (forces save, avoids in-tab play)
                try {
                    if (chrome?.runtime?.sendMessage) {
                        (async () => {
                          const resp = await safeSendMessage({ type: 'suno_download', url, filename: fileName, saveAs: false }, 800);
                          if (!(resp && resp.success)) {
                            const a = document.createElement('a');
                            a.href = url;
                            a.setAttribute('download', fileName);
                            a.rel = 'noopener';
                            a.target = '_self';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }
                        })();
                    } else {
                        const a = document.createElement('a');
                        a.href = url;
                        a.setAttribute('download', fileName);
                        a.rel = 'noopener';
                        a.target = '_self';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }
                } catch (e) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.setAttribute('download', fileName);
                    a.rel = 'noopener';
                    a.target = '_self';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }

                if (button) {
                  // success state: white checkmark + tinted background, then revert after 1s
                  const checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17 4 12"/></svg>';
                  if (!button.dataset.prevInner) { button.dataset.prevInner = button.innerHTML; }
                  button.innerHTML = checkSvg;
                  button.disabled = true;
                  button.style.opacity = '1';
                  button.classList.add('suno-success');
                  setTimeout(() => {
                    if (button.dataset.prevInner) {
                      button.innerHTML = button.dataset.prevInner;
                      delete button.dataset.prevInner;
                    }
                    button.disabled = false;
                    button.classList.remove('suno-success');
                  }, 3000);
                }
            } catch (e) {
                console.error('Suno UI Booster: WAV response handling error', e);
            }
        });

        // Listen for storage changes to handle real-time state updates
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.enabled) {
                const newState = changes.enabled.newValue;
                handleExtensionStateChange(newState !== false);
            }
        });

        // Observe DOM changes to handle dynamically added song rows
        const observer = new MutationObserver((mutationsList) => {
            try {
                let needsDropdownAdjust = false;
                let needsCreateAdjust = false;
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.matches('[data-testid="song-row"], .css-1b0cg3t, .css-1jkulof, .css-c1kosu')) {
                                    addTrashButton(node);
                                    addDownloadButton(node);
                                    hideShareButton(node);
                                    replaceLikeDislikeIcons(node);
                                    replaceBookmarkIcons(node);
                                    hideHeaderLabels(node);
                                } else if (node.querySelector) {
                                    processSongRows(node);
                                    hideHeaderLabels(node);
                                    // If new playbar parts appeared, ensure buttons
                                    if (node.querySelector('a[aria-label^="Playbar: Title"], button[aria-label*="More"]')) {
                                      ensurePlaybarButtons(node);
                                    }
                                }
                                // Dropdown adjustment triggers
                                if (node.querySelector?.('input[placeholder="Search..."]') || node.matches?.('input[placeholder="Search..."]')) {
                                  needsDropdownAdjust = true;
                                }
                                if (node.querySelector?.('span.mr-8.flex.flex-row.items-center') || node.matches?.('span.mr-8.flex.flex-row.items-center')) {
                                  needsDropdownAdjust = true;
                                }
                                // Create-row spacing triggers when playbar or progress bar appears/changes
                                if (
                                  node.matches?.('[aria-label^="Playbar"], [aria-label*="Playbar:"]') ||
                                  node.querySelector?.('[aria-label^="Playbar"], [aria-label*="Playbar:"]') ||
                                  node.matches?.('.group.flex.h-2') ||
                                  node.querySelector?.('.group.flex.h-2')
                                ) {
                                  needsCreateAdjust = true;
                                }
                              }
                        });
                    }
                }
                if (needsDropdownAdjust) {
                  requestAnimationFrame(() => adjustWorkspaceDropdowns(document));
                }
                if (needsCreateAdjust) {
                  requestAnimationFrame(() => adjustCreateRowBottomMargin(document));
                }
            } catch (error) {
                console.error('Suno UI Booster: Error in mutation observer:', error);
            }
        });

        domObserverRef = observer;
        observer.observe(document.body, { childList: true, subtree: true });
        processSongRows(document.body);
        hideHeaderLabels(document.body);
        ensurePlaybarButtons(document.body);
        // Ensure Advanced Options is expanded and header hidden
        ensureAdvancedOptions(document.body);
        // Align Workspace dropdown width/position under the button
        adjustWorkspaceDropdowns(document);
        // Set Create row bottom margin depending on bottom-fixed player presence
        adjustCreateRowBottomMargin(document);
        // Ensure Vocal Gender row has transparent background only for that block
        ensureVocalGenderRowStyles(document.body);
        // Move "Exclude styles" field into Styles panel bottom with matching paddings
        ensureExcludeStylesPlacement(document.body);
        // Schedule a second pass after layout settles
        setTimeout(() => adjustCreateRowBottomMargin(document), 200);

        // Reposition dropdown and adjust bottom spacing when viewport changes
        const onViewportChange = () => {
          adjustWorkspaceDropdowns(document);
          adjustCreateRowBottomMargin(document);
        };
        viewportListenerRef = onViewportChange;
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('scroll', onViewportChange, true);

        // Observe future DOM changes to re-apply expansion
        const advancedObserver = new MutationObserver(() => {
          ensureAdvancedOptions(document.body);
          ensureVocalGenderRowStyles(document.body);
          ensureExcludeStylesPlacement(document.body);
        });
        advancedObserverRef = advancedObserver;
        advancedObserver.observe(document.body, { childList: true, subtree: true });

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

// Ensure the Advanced Options section is always expanded and its header (toggle row) hidden
function ensureAdvancedOptions(root = document) {
  try {
    const headingSpans = Array.from(root.querySelectorAll('span.font-medium')).filter((el) =>
      (el.textContent || '').trim().toLowerCase().startsWith('advanced options')
    );

    headingSpans.forEach((heading) => {
      // Find wrapper panel (rounded + bg-secondary)
      let wrapper = heading;
      while (wrapper && wrapper !== document.body) {
        if (
          wrapper instanceof HTMLElement &&
          wrapper.classList.contains('bg-background-secondary') &&
          wrapper.classList.contains('p-2') &&
          wrapper.classList.contains('h-auto')
        ) {
          break;
        }
        wrapper = wrapper.parentElement;
      }
      if (!wrapper || !(wrapper instanceof HTMLElement)) return;
      if (wrapper.getAttribute('data-suno-adv-processed') === '1') return;

      // Header row is the row that contains the heading itself
      const headerRow = heading.closest('div');
      // Content is the next sibling container after the header row
      const contentRow = headerRow && headerRow.nextElementSibling instanceof HTMLElement ? headerRow.nextElementSibling : null;

      if (contentRow) {
        // Remove collapsing constraints, make it visible, and remove vertical padding for this block only
        contentRow.classList.remove('max-h-0');
        contentRow.classList.remove('py-2');
        contentRow.style.setProperty('max-height', 'none', 'important');
        contentRow.style.setProperty('height', 'auto', 'important');
        contentRow.style.setProperty('overflow', 'visible', 'important');
        contentRow.style.setProperty('opacity', '1', 'important');
        contentRow.style.setProperty('padding-top', '0px', 'important');
        contentRow.style.setProperty('padding-bottom', '0px', 'important');
      }

      // Hide only the header row (title + chevron) so the panel looks always expanded
      if (headerRow && headerRow instanceof HTMLElement) {
        headerRow.style.setProperty('display', 'none', 'important');
      }

      wrapper.setAttribute('data-suno-adv-processed', '1');
    });
  } catch (_) {
    // no-op
  }
}

/** Restore Advanced Options default header/content when disabling the extension. */
function resetAdvancedOptions(root = document) {
  try {
    const wrappers = Array.from(root.querySelectorAll('.h-auto.rounded-[20px].bg-background-secondary.p-2[data-suno-adv-processed="1"]'));
    wrappers.forEach((wrapper) => {
      if (!(wrapper instanceof HTMLElement)) return;
      // Find heading again
      const heading = wrapper.querySelector('span.font-medium');
      const headerRow = heading ? heading.closest('div') : null;
      const contentRow = headerRow && headerRow.nextElementSibling instanceof HTMLElement ? headerRow.nextElementSibling : null;
      if (headerRow instanceof HTMLElement) {
        headerRow.style.removeProperty('display');
      }
      if (contentRow) {
        // Restore default paddings by removing our inline overrides and re-adding typical py-2
        contentRow.classList.add('py-2');
        contentRow.style.removeProperty('padding-top');
        contentRow.style.removeProperty('padding-bottom');
        contentRow.style.removeProperty('max-height');
        contentRow.style.removeProperty('height');
        contentRow.style.removeProperty('overflow');
        contentRow.style.removeProperty('opacity');
      }
      wrapper.removeAttribute('data-suno-adv-processed');
    });
  } catch (_) {
    // no-op
  }
}

/**
 * Finds the Workspace button within the Workspace row.
 * The row contains a span label "Workspace" (may be hidden) and a reversed flex button container.
 * @returns {HTMLElement|null}
 */
function findWorkspaceButton(root = document) {
  try {
    const rows = root.querySelectorAll('div.flex.w-full.flex-row.items-center');
    for (const row of rows) {
      const label = row.querySelector('span.mr-8.flex.flex-row.items-center');
      if (!label) continue;
      const text = (label.textContent || '').trim();
      if (text !== 'Workspace') continue;
      const button = row.querySelector('.flex.flex-1.flex-row-reverse > button');
      if (button instanceof HTMLElement) return button;
    }
  } catch (_) {
    // no-op
  }
  return null;
}

/**
 * Aligns "Search..." dropdown menus to the Workspace button: same width and left, below the button.
 */
function adjustWorkspaceDropdowns(root = document) {
  if (!isExtensionEnabled) return;
  try {
    const workspaceButton = findWorkspaceButton(document);
    if (!workspaceButton) return;

    const buttonRect = workspaceButton.getBoundingClientRect();
    const desiredWidth = Math.round(buttonRect.width);
    const desiredLeft = Math.round(buttonRect.left + window.scrollX);
    const desiredTop = Math.round(buttonRect.bottom + window.scrollY + 8); // 8px gap

    const menus = Array.from(document.querySelectorAll('div.absolute'))
      .filter((el) => el instanceof HTMLElement && el.querySelector('input[placeholder="Search..."]'));

    for (const menu of menus) {
      const menuRect = menu.getBoundingClientRect();
      const verticalDistance = Math.abs((menuRect.top + window.scrollY) - desiredTop);
      // Only adjust menus that are close to the Workspace button vertically (likely the Workspace dropdown)
      if (verticalDistance > 300) continue;

      menu.style.setProperty('position', 'absolute', 'important');
      menu.style.setProperty('width', `${desiredWidth}px`, 'important');
      menu.style.setProperty('left', `${desiredLeft}px`, 'important');
      menu.style.setProperty('top', `${desiredTop}px`, 'important');
      menu.style.setProperty('right', 'auto', 'important');
    }
  } catch (_) {
    // no-op
  }
}

/** Remove inline positioning injected into Workspace dropdowns. */
function resetWorkspaceDropdowns(root = document) {
  try {
    const menus = Array.from(document.querySelectorAll('div.absolute'))
      .filter((el) => el instanceof HTMLElement && el.querySelector('input[placeholder="Search..."]'));
    for (const menu of menus) {
      menu.style.removeProperty('position');
      menu.style.removeProperty('width');
      menu.style.removeProperty('left');
      menu.style.removeProperty('top');
      menu.style.removeProperty('right');
    }
  } catch (_) {
    // no-op
  }
}

/**
 * Find the Create row that holds the big Create button.
 * @returns {HTMLElement|null}
 */
function findCreateRow(root = document) {
  try {
    const btn = root.querySelector('button[data-testid="create-button"]');
    if (!btn) return null;
    return btn.closest('div.flex.w-full.flex-row.items-center');
  } catch (_) {
    return null;
  }
}

/**
 * Find the fixed Playbar container by locating a Playbar button and walking up to its fixed ancestor.
 * @returns {HTMLElement|null}
 */
function findFixedPlaybarContainer(root = document) {
  try {
    const playbarButton = root.querySelector('button[aria-label^="Playbar"], button[aria-label*="Playbar:"]');
    if (!playbarButton) return null;
    let el = playbarButton.parentElement;
    for (let i = 0; i < 12 && el; i += 1) {
      if (!(el instanceof HTMLElement)) break;
      const cs = window.getComputedStyle(el);
      const isAnchored = (cs.position === 'fixed' || cs.position === 'absolute');
      const bottomVal = parseFloat(cs.bottom || '');
      const bottomIsZeroish = Number.isFinite(bottomVal) ? Math.abs(bottomVal) <= 2 : (cs.bottom === '0px' || cs.bottom === '0');
      if (isAnchored && bottomIsZeroish) {
        if (el.offsetHeight > 0 && cs.visibility !== 'hidden' && cs.display !== 'none') {
          return el;
        }
      }
      el = el.parentElement;
    }
  } catch (_) {
    // no-op
  }
  return null;
}

/**
 * Compute bottom overlay height using only the real Playbar, otherwise 0.
 */
function computePlaybarHeight(root = document) {
  // Try precise fixed container first
  const fixed = findFixedPlaybarContainer(root);
  if (fixed) {
    const h = fixed.offsetHeight || 0;
    return Number.isFinite(h) && h > 0 && h < 300 ? h : 0;
  }
  // Fallback: union of all visible Playbar-labeled elements
  try {
    const nodes = Array.from(root.querySelectorAll('[aria-label^="Playbar"], [aria-label*="Playbar:"]'))
      .filter((el) => el instanceof HTMLElement);
    let minTop = Number.POSITIVE_INFINITY;
    let maxBottom = 0;
    for (const el of nodes) {
      const rect = el.getBoundingClientRect();
      if (!rect || rect.height === 0 || rect.width === 0) continue;
      minTop = Math.min(minTop, rect.top);
      maxBottom = Math.max(maxBottom, rect.bottom);
    }
    if (minTop !== Number.POSITIVE_INFINITY && maxBottom > minTop) {
      const h = Math.round(maxBottom - minTop);
      return h > 0 && h < 400 ? h : 0;
    }
  } catch (_) {
    // no-op
  }
  return 0;
}

/**
 * Compute how much taller the Playbar progress bar became compared to default (8px for h-2).
 * Returns a non-negative delta in pixels.
 */
function computeProgressBarDelta(root = document) {
  try {
    const container = findFixedPlaybarContainer(root) || document;
    // Prefer progress bar inside the playbar container
    const bar = container.querySelector?.('.group.flex.h-2.w-full') || container.querySelector?.('.group.flex.h-2');
    if (!bar || !(bar instanceof HTMLElement)) return 0;
    const rect = bar.getBoundingClientRect();
    const actual = Math.round(rect.height || 0);
    const defaultPx = 8; // Tailwind h-2 default
    const delta = Math.max(0, actual - defaultPx);
    return Math.min(delta, 80); // cap lift to 80px
  } catch (_) {
    return 0;
  }
}

/**
 * Ensure the Create row lifts exactly by the increased progress bar height (above default).
 */
function adjustCreateRowBottomMargin(root = document) {
  if (!isExtensionEnabled) return;
  try {
    const row = findCreateRow(root);
    if (!row) return;
    const hasPlaybar = !!findFixedPlaybarContainer(root) || document.querySelector('[aria-label^="Playbar"], [aria-label*="Playbar:"]');
    const delta = hasPlaybar ? computeProgressBarDelta(root) : 0;
    row.style.setProperty('margin-bottom', `${delta}px`, 'important');
  } catch (_) {
    // no-op
  }
}

/** Remove Create row bottom margin adjustment. */
function resetCreateRowBottomMargin(root = document) {
  try {
    const row = findCreateRow(root);
    if (row) row.style.removeProperty('margin-bottom');
  } catch (_) {
    // no-op
  }
} 

/**
 * Ensure the Vocal Gender row (by label match) has transparent background only for that block.
 */
function ensureVocalGenderRowStyles(root = document) {
  try {
    const rows = root.querySelectorAll('div.flex.flex-1.items-center.justify-between');
    for (const row of rows) {
      if (!(row instanceof HTMLElement)) continue;
      const label = row.querySelector('span.text-sm');
      const text = (label?.textContent || '').trim();
      if (text === 'Vocal Gender') {
        row.style.setProperty('background-color', 'transparent', 'important');
        row.style.setProperty('padding-right', '8px', 'important');
      }
    }
  } catch (_) {
    // no-op
  }
}

/** Remove inline background override for the Vocal Gender row. */
function resetVocalGenderRowStyles(root = document) {
  try {
    const rows = root.querySelectorAll('div.flex.flex-1.items-center.justify-between');
    for (const row of rows) {
      if (!(row instanceof HTMLElement)) continue;
      const label = row.querySelector('span.text-sm');
      const text = (label?.textContent || '').trim();
      if (text === 'Vocal Gender') {
        row.style.removeProperty('background-color');
        row.style.removeProperty('padding-right');
      }
    }
  } catch (_) {
    // no-op
  }
}

/**
 * Ensure the "Exclude styles" input block resides at the bottom of Styles panel with matching paddings.
 */
function ensureExcludeStylesPlacement(root = document) {
  try {
    // Find the input by its placeholder
    const input = root.querySelector('input[placeholder="Exclude styles"]');
    if (!input || !(input instanceof HTMLElement)) return;

    // Find the Styles header to anchor reliably, then the panel root
    const stylesHeader = Array.from(root.querySelectorAll('div.flex.h-\\[60px\\].flex-row.items-center.px-4')).find((el) =>
      /\bStyles\b/i.test((el.textContent || '').trim())
    );
    if (!(stylesHeader instanceof HTMLElement)) return;
    const stylesPanel = stylesHeader.closest('div.relative.w-full.overflow-hidden');
    if (!(stylesPanel instanceof HTMLElement)) return;

    const inputWrapper = input.closest('div.relative.h-auto.w-auto') || input.parentElement;
    if (!(inputWrapper instanceof HTMLElement)) return;

    // Content column of the panel where we want the input as the very last block (below all controls)
    const contentColumn = stylesPanel.querySelector('div.flex.h-auto.max-h-\\[8000px\\].flex-col');
    if (!(contentColumn instanceof HTMLElement)) return;

    // Place the input as the LAST child of content column, so it sits visually under the textarea card and its internal buttons
    if (contentColumn.lastElementChild !== inputWrapper) {
      contentColumn.appendChild(inputWrapper);
    }

    // Match side paddings with other controls
    inputWrapper.style.setProperty('margin-left', '8px', 'important');
    inputWrapper.style.setProperty('margin-right', '8px', 'important');
    inputWrapper.style.setProperty('margin-top', '8px', 'important');
    inputWrapper.style.setProperty('width', 'calc(100% - 16px)', 'important');
    inputWrapper.style.setProperty('position', 'relative', 'important');
    inputWrapper.style.setProperty('box-sizing', 'border-box', 'important');

    // Input visual parity with rounded-2xl and full width; transparent background to match above block
    input.classList.remove('rounded-[10px]');
    input.classList.add('rounded-2xl');
    input.classList.remove('bg-background-primary');
    input.style.setProperty('background-color', 'transparent', 'important');
    input.style.setProperty('width', '100%', 'important');
    input.style.setProperty('box-sizing', 'border-box', 'important');

    // Ensure the search icon stays positioned correctly inside the wrapper
    const icon = inputWrapper.querySelector('svg');
    if (icon instanceof HTMLElement) {
      icon.style.setProperty('left', '16px', 'important');
      icon.style.setProperty('top', '50%', 'important');
      icon.style.setProperty('transform', 'translateY(-50%)', 'important');
    }
  } catch (_) {
    // no-op
  }
} 