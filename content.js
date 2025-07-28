// Content script for Suno UI Booster extension
// Runs on Suno pages to provide visual feedback and debugging information

console.log('Suno UI Booster loaded!');

// Check if current page is a Suno domain
if (window.location.hostname.includes('suno.ai') || window.location.hostname.includes('suno.com')) {
    console.log('✅ Suno AI detected');
    
    // Check if styles are enabled before showing indicator
    chrome.storage.local.get('stylesEnabled', (data) => {
        const isEnabled = data.stylesEnabled !== false; // Default to true
        
        if (isEnabled) {
            // Create visual indicator to show extension is active
            // This helps users know the extension is working on the page
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: fixed; top: 10px; right: 10px; background: #4CAF50; color: white;
                padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;
                z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
            indicator.textContent = 'Suno UI Booster Active';
            document.body.appendChild(indicator);
            
            // Remove indicator after 3 seconds to avoid cluttering the UI
            setTimeout(() => {
                indicator.parentNode?.removeChild(indicator);
            }, 3000);
        }
    });
} 