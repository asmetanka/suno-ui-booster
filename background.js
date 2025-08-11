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