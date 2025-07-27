// Initialize popup functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Get reference to the toggle switch element
    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleContainer = document.querySelector('.toggle-container');
  
    // Retrieve current state from Chrome storage
    // Default to true if not explicitly set to false
    const data = await chrome.storage.local.get('stylesEnabled');
    const isEnabled = data.stylesEnabled !== false; // Default to true
  
    // Set toggle switch position based on current state
    toggleSwitch.classList.toggle('active', isEnabled);
    toggleContainer.classList.toggle('active', isEnabled);
  
    // Handle toggle switch click events
    // Save new state to Chrome storage and update UI
    
    const toggleFunction = async () => {
      const currentState = toggleSwitch.classList.contains('active');
      const newState = !currentState;
      
      // Persist the new state to Chrome storage
      await chrome.storage.local.set({ stylesEnabled: newState });
      
      // Update toggle switch visual state
      toggleSwitch.classList.toggle('active', newState);
      toggleContainer.classList.toggle('active', newState);
    };
    
    // Add click event to container only (it will handle both)
    toggleContainer.addEventListener('click', toggleFunction);
  });