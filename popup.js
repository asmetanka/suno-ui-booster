// Initialize popup functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Get reference to the toggle switch element
    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleContainer = document.getElementById('toggleContainer');
    const toggleLabel = document.getElementById('toggleLabel');
  
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
            toggleLabel.textContent = 'Suno UI Boosted';
        } else {
            toggleLabel.textContent = 'Boost Suno UI';
        }
    };
  
    // Set initial state
    updateToggleState(isEnabled);
  
    // Handle toggle switch click events
    // Save new state to Chrome storage and update UI
    
    const toggleFunction = async () => {
      const currentState = toggleSwitch.classList.contains('active');
      const newState = !currentState;
      
      // Persist the new state to Chrome storage
      await chrome.storage.local.set({ stylesEnabled: newState });
      
      // Update toggle switch visual state and text
      updateToggleState(newState);
    };
    
    // Add click event to container only (it will handle both)
    toggleContainer.addEventListener('click', toggleFunction);
  });