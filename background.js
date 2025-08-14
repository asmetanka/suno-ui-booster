// Background script: injects/removes stylesheet on Suno tabs based on user preference.
// No network interception or page code modification is performed here.

/**
 * Insert or remove CSS on a specific tab according to the enabled state.
 */
async function updateStyles(tabId, isEnabled) {
  const details = { target: { tabId }, files: ['styles.css'] };
  try {
    if (isEnabled) {
      await chrome.scripting.insertCSS(details);
    } else {
      await chrome.scripting.removeCSS(details);
    }
  } catch (error) {
    // Ignore non-actionable errors (chrome://, missing tab, etc.)
    const msg = String(error?.message || '');
    if (
      !msg.includes('Cannot access a chrome://') &&
      !msg.includes('No tab with id') &&
      !msg.includes('Cannot access a chrome-extension://')
    ) {
      console.error('Suno UI Booster: Error updating styles:', error);
    }
  }
}

/** Compose an action icon with a red dot in the top-right corner (48/128px). */
async function setActionIconRedDot() {
  try {
    const baseUrl = chrome.runtime.getURL('icon.png');
    const blob = await (await fetch(baseUrl)).blob();
    const bitmap = await createImageBitmap(blob);
    const sizes = [48, 128];
    const imageDataMap = {};
    for (const size of sizes) {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, size, size);
      // Red dot
      const r = Math.max(4, Math.round(size * 0.14));
      const cx = size - r - 2;
      const cy = r + 2;
      ctx.fillStyle = '#ff4d4f';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      imageDataMap[size] = ctx.getImageData(0, 0, size, size);
    }
    await chrome.action.setIcon({ imageData: imageDataMap });
  } catch (error) {
    console.warn('Suno UI Booster: setActionIconRedDot failed, falling back to badge.', error);
    // Fallback: small badge dot (single period)
    try {
      await chrome.action.setBadgeText({ text: '•' });
      await chrome.action.setBadgeBackgroundColor({ color: '#ff4d4f' });
    } catch (_) {}
  }
}

/** Restore default action icon from packaged icons. */
async function resetActionIconDefault() {
  try {
    await chrome.action.setIcon({ path: { '48': 'icon.png', '128': 'icon.png' } });
  } catch (_) {}
}

/**
 * When the extension finishes installing/updating to the latest version,
 * ensure no badges/dots are shown (user is already on latest).
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    const currentVersion = chrome.runtime.getManifest().version;
    // Clear any pending update indicators since we're on latest now
    await chrome.action.setBadgeText({ text: '' });
    await resetActionIconDefault();
    await chrome.storage.sync.set({ updateAvailable: false, availableVersion: '', lastSeenVersion: currentVersion });
  } catch (error) {
    console.error('Suno UI Booster: onInstalled cleanup error:', error);
  }
});

// Detect updates available but not yet applied
chrome.runtime.onUpdateAvailable.addListener(async (details) => {
  try {
    await chrome.storage.sync.set({ updateAvailable: true, availableVersion: details.version });
    await setActionIconRedDot();
  } catch (error) {
    console.error('Suno UI Booster: onUpdateAvailable error:', error);
  }
});

// On service worker start, check for updates once (non-throttled if allowed)
async function checkForUpdateOnce() {
  try {
    chrome.runtime.requestUpdateCheck((status, details) => {
      if (status === 'update_available') {
        chrome.storage.sync.set({ updateAvailable: true, availableVersion: details.version });
        setActionIconRedDot();
      }
    });
  } catch (_) {}
}

checkForUpdateOnce();

/**
 * On tab load completion for Suno domains, apply CSS if enabled in storage.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('suno.ai') || tab.url.includes('suno.com'))) {
      const data = await chrome.storage.sync.get(['enabled']);
      const isEnabled = data.enabled !== false; // default: enabled
      await updateStyles(tabId, isEnabled);
    }
  } catch (error) {
    console.error('Suno UI Booster: Error in tab update listener:', error);
  }
});

// Listen for download requests from content script and perform via downloads API
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'suno_download' && message.url) {
    try {
      chrome.downloads.download({ url: message.url, filename: message.filename || '', saveAs: !!message.saveAs }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      });
      // Keep the message channel open for async response
      return true;
    } catch (e) {
      sendResponse({ success: false, error: String(e) });
    }
  }
});

/**
 * When the user toggles the enabled state, update all open Suno tabs.
 */
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  try {
    if (namespace === 'sync' && changes.enabled) {
      const isEnabled = changes.enabled.newValue;
      const tabs = await chrome.tabs.query({ url: ['*://*.suno.ai/*', '*://*.suno.com/*'] });
      for (const tab of tabs) {
        await updateStyles(tab.id, isEnabled);
      }
    }
  } catch (error) {
    console.error('Suno UI Booster: Error updating styles on storage change:', error);
  }
}); 