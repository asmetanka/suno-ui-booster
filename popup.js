// Initialize popup functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get reference to the toggle switch element
        const toggleSwitch = document.getElementById('toggleSwitch');
        const toggleContainer = document.getElementById('toggleContainer');
        const toggleLabel = document.getElementById('toggleLabel');
      
        if (!toggleSwitch || !toggleContainer || !toggleLabel) {
            console.error('Required elements not found in popup');
            return;
        }
      
        // Retrieve current state from Chrome storage
        // Default to true if not explicitly set to false
        const data = await chrome.storage.local.get('stylesEnabled');
        const isEnabled = data.stylesEnabled !== false; // Default to true
      
        // Function to update toggle state and text
        const updateToggleState = (isActive) => {
            toggleSwitch.classList.toggle('active', isActive);
            toggleContainer.classList.toggle('active', isActive);
            
            // Update text based on state
            if (isActive) {
                toggleLabel.textContent = 'UI BOOSTED';
            } else {
                toggleLabel.textContent = 'BOOST MUSIC';
            }
        };
      
        // Set initial state
        updateToggleState(isEnabled);
      
        // Handle toggle switch click events
        // Save new state to Chrome storage and update UI
        
        const toggleFunction = async () => {
          const currentState = toggleSwitch.classList.contains('active');
          const newState = !currentState;
          
          try {
            // Persist the new state to Chrome storage
            await chrome.storage.local.set({ stylesEnabled: newState });
            
            // Update toggle switch visual state and text
            updateToggleState(newState);
          } catch (error) {
            console.error('Error saving toggle state:', error);
          }
        };
        
        // Add click event to container with fade effect
        toggleContainer.addEventListener('click', async () => {
            // Fade out
            toggleLabel.style.opacity = '0';
            
            // Wait for fade out, then update state and text
            setTimeout(async () => {
                await toggleFunction();
                toggleLabel.style.opacity = '1';
            }, 100);
        });
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
});