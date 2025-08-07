// Popup logic: show enable/disable state and toggle extension
document.addEventListener('DOMContentLoaded', function() {
    const toggleContainer = document.getElementById('toggleContainer');
    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleLabel = document.getElementById('toggleLabel');

    // Check if we're on a Suno page
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const isSunoPage = currentTab.url && (currentTab.url.includes('suno.ai') || currentTab.url.includes('suno.com'));
        
        if (isSunoPage) {
            // Get extension status from storage
            chrome.storage.sync.get(['enabled'], function(result) {
                const isEnabled = result.enabled !== false; // Default to enabled
                updateToggleState(isEnabled);
            });
            
            // Add toggle functionality for enabling/disabling extension
            toggleContainer.addEventListener('click', function() {
                chrome.storage.sync.get(['enabled'], function(result) {
                    const currentState = result.enabled !== false;
                    const newState = !currentState;
                    
                    chrome.storage.sync.set({enabled: newState}, function() {
                        updateToggleState(newState);
                        
                        // Reload the current tab to apply changes
                        chrome.tabs.reload(currentTab.id);
                    });
                });
            });
        } else {
            // Not on a Suno page - show appropriate message
            toggleLabel.textContent = 'NOT ON SUNO';
            toggleContainer.style.opacity = '0.5';
            toggleContainer.style.cursor = 'not-allowed';
        }
    });

    // Update the visual state of the toggle switch
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
});

