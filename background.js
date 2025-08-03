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
        console.log('Suno UI Booster: Styles injected successfully');
      } else {
        // Remove injected CSS styles to restore original appearance
        await chrome.scripting.removeCSS(details);
        console.log('Suno UI Booster: Styles removed successfully');
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
        // Check if styles are enabled in storage
        const data = await chrome.storage.local.get('stylesEnabled');
        // Default to enabled if not explicitly set to false
        const isEnabled = data.stylesEnabled !== false;
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
      if (namespace === 'local' && changes.stylesEnabled) {
        const isEnabled = changes.stylesEnabled.newValue;
        // Find active Suno tab and update styles on it
        const tabs = await chrome.tabs.query({ 
          active: true, 
          url: ["*://*.suno.ai/*", "*://*.suno.com/*"] 
        });
        if (tabs.length > 0) {
          await updateStyles(tabs[0].id, isEnabled);
        }
      }
    } catch (error) {
      console.error('Suno UI Booster: Error updating styles on storage change:', error);
    }
  }); 