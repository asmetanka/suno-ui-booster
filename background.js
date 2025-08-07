// Background script for Suno UI Booster extension
// Handles CSS injection and removal based on user preferences

/**
 * Applies or removes custom styles to Suno pages based on user settings
 * @param {number} tabId - The ID of the tab to modify
 * @param {boolean} isEnabled - Whether styles should be applied or removed
 */
async function updateStyles(tabId, isEnabled) {
    const details = {
      target: { tabId: tabId },
      files: ['styles.css'],
    };
    try {
      if (isEnabled) {
        // Inject custom CSS styles to enhance Suno UI
        await chrome.scripting.insertCSS(details);
        // Styles injected
      } else {
        // Remove injected CSS styles to restore original appearance
        await chrome.scripting.removeCSS(details);
        // Styles removed
      }
    } catch (error) {
      // Ignore errors that occur when trying to inject styles on restricted pages
      // (like chrome:// pages or non-existent tabs)
      if (!error.message.includes("Cannot access a chrome://") && 
          !error.message.includes("No tab with id") &&
          !error.message.includes("Cannot access a chrome-extension://")) {
        console.error('Suno UI Booster: Error updating styles:', error);
      }
    }
  }
  
  /**
   * Listens for tab updates and applies styles to Suno pages when they load
   * Automatically applies or removes styles based on user preferences
   */
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
      if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('suno.ai') || tab.url.includes('suno.com'))) {
        // Check if extension is enabled in storage
        const data = await chrome.storage.sync.get(['enabled']);
        // Default to enabled if not explicitly set to false
        const isEnabled = data.enabled !== false;
        await updateStyles(tabId, isEnabled);
      }
    } catch (error) {
      console.error('Suno UI Booster: Error in tab update listener:', error);
    }
  });
  
  /**
   * Responds to toggle switch changes in popup
   * Updates styles on active Suno tabs when user toggles the extension
   */
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    try {
      if (namespace === 'sync' && changes.enabled) {
        const isEnabled = changes.enabled.newValue;
        // Find all Suno tabs and update styles on them
        const tabs = await chrome.tabs.query({ 
          url: ["*://*.suno.ai/*", "*://*.suno.com/*"] 
        });
        for (const tab of tabs) {
          await updateStyles(tab.id, isEnabled);
        }
        // Updated styles on all Suno tabs
      }
    } catch (error) {
      console.error('Suno UI Booster: Error updating styles on storage change:', error);
    }
  }); 