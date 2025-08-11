// Popup: toggles the extension enabled state and reflects it in the UI.
// The switch updates chrome.storage then reloads the active Suno tab.

document.addEventListener('DOMContentLoaded', function() {
  const toggleContainer = document.getElementById('toggleContainer');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const toggleLabel = document.getElementById('toggleLabel');
  const whatsNew = document.getElementById('whatsNew');
  const ackUpdate = document.getElementById('ackUpdate');

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const isSunoPage = currentTab.url && (currentTab.url.includes('suno.ai') || currentTab.url.includes('suno.com'));

    if (isSunoPage) {
      chrome.storage.sync.get(['enabled'], function(result) {
        const isEnabled = result.enabled !== false; // default: enabled
        updateToggleState(isEnabled);
      });

      toggleContainer.addEventListener('click', function() {
        chrome.storage.sync.get(['enabled'], function(result) {
          const currentState = result.enabled !== false;
          const newState = !currentState;
          chrome.storage.sync.set({ enabled: newState }, function() {
            updateToggleState(newState);
            chrome.tabs.reload(currentTab.id);
          });
        });
      });
    } else {
      toggleLabel.textContent = 'NOT ON SUNO';
      toggleContainer.style.opacity = '0.5';
      toggleContainer.style.cursor = 'not-allowed';
    }
  });

  function updateToggleState(enabled) {
    if (enabled) {
      toggleContainer.classList.add('active');
      toggleSwitch.classList.add('active');
      toggleLabel.textContent = 'UI BOOSTED';
    } else {
      toggleContainer.classList.remove('active');
      toggleSwitch.classList.remove('active');
      toggleLabel.textContent = 'BOOST MUSIC';
    }
  }

  // Show NEW banner and clear badge only when acknowledged
  (async function initBadge() {
    try {
      const currentVersion = chrome.runtime.getManifest().version;
      const { updateAvailable, availableVersion } = await chrome.storage.sync.get(['updateAvailable', 'availableVersion']);
      if (updateAvailable && availableVersion) {
        if (whatsNew) {
          whatsNew.style.display = 'block';
          whatsNew.querySelector('span').textContent = `Update available: ${availableVersion}`;
        }
        if (ackUpdate) {
          ackUpdate.textContent = 'UPDATE';
          ackUpdate.addEventListener('click', async () => {
            try {
              // Apply update if ready (Chrome will load the new version), then reload extension
              await chrome.action.setBadgeText({ text: '' });
              await chrome.storage.sync.set({ updateAvailable: false });
              if (whatsNew) whatsNew.style.display = 'none';
              // Reload extension to apply update immediately
              chrome.runtime.reload();
            } catch (_) {}
          });
        }
        return;
      }
      // Already on latest or no info: ensure banner hidden and badge cleared
      if (whatsNew) whatsNew.style.display = 'none';
      await chrome.action.setBadgeText({ text: '' });
    } catch (_) {}
  })();
});

