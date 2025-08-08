# Suno UI Booster

Enhanced interface for Suno.ai with additional features and optimized design.

## ✨ Features

### 🎨 **Visual Improvements**
- **Square album previews** - cleaner appearance
- **Larger control buttons** - easier to click
- **Optimized spacing** - less visual clutter
- **Improved typography** - better readability

### 🗑️ **Smart "Move to Trash" Button**
- **Automatic placement** - appears in the expected actions group
- **Native Undo support** - tries Suno's menu action to show their toast with Undo; falls back to API if unavailable
- **Adaptive logic** - works across page variants
- **Visual feedback** - subtle fade-out on successful removal

### 🎯 **Performance & Robustness**
- **Adaptive initialization** - works on all types of Suno pages
- **Minimal logging** - console logs only on errors or critical actions

## 🚀 Installation

### For developers:
1. Clone the repository
   ```bash
   git clone https://github.com/asmetanka/suno-ui-booster.git
   cd suno-ui-booster
   ```
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked extension"
5. Select the extension folder

### For users:
Install from the Chrome Web Store
https://chromewebstore.google.com/detail/hcocfjdjhiiolcmplgfkgkifnjeeodcl?utm_source=item-share-cb

## 🔧 Configuration

### Enable/disable:
- **Via popup**: Click the extension icon
- **Via Chrome settings**: `chrome://extensions/` → "Suno UI Booster"

### Debugging:
Only errors are logged by default. If you need more diagnostics, please open an issue.

## 🔍 Troubleshooting

### Extension not working:
1. **Check installation** - make sure extension is enabled
2. **Check page** - make sure you're on suno.ai
3. **Refresh page** (F5) - sometimes reload is needed

### Trash button not appearing:
1. Ensure extension is enabled in popup
2. Refresh the page to re-initialize

### Visual improvements not applied:
1. Check that styles are enabled in popup
2. Reload the Suno tab

## 📞 Support

If something doesn't work:
1. **Check GitHub Issues** - problem might be already known
2. **Contact developer**:
   - Email: hello@smetanka.me
   - GitHub: https://github.com/asmetanka/suno-ui-booster
3. **Provide information**:
   - Browser version
   - Extension version
   - Console logs
   - Screenshot of the problem

## 📁 Project Structure

```
suno-ui-booster/
├── manifest.json          # Extension configuration
├── content.js            # Main logic
├── background.js         # Background processes
├── popup.html           # Popup window
├── popup.js             # Popup logic
├── styles.css           # CSS styles
├── rules.json           # Network request rules
├── icon.png             # Extension icon
├── logo.png             # Logo
├── PRIVACY.md           # Privacy policy
└── LICENSE              # MIT license
```

## 🔧 Technical Details

### **Smart button placement system:**
- **Strategy 1**: After "Dislike" button
- **Strategy 2**: After "Like" button  
- **Strategy 3**: At the end of button container
- **Strategy 3.5**: In flex containers with multiple buttons
- **Strategy 4**: Fallback - after "More Options" button

### **Loading wait system:**
- Check `document.readyState === 'complete'`
- Wait 3-8 seconds for complete resource loading
- Search for loading elements (`loading`, `spinner`, `skeleton`)
- Multiple initialization strategies

### **Debug information:**
- DOM structure logging
- Track all buttons on page
- Information about chosen placement strategy
- Detailed error diagnostics

## 🎨 CSS Improvements

### **Main styles:**
```css
/* Square album previews */
img[alt*="Song Image"] {
    border-radius: 8px !important;
    aspect-ratio: 1 !important;
}

/* Larger buttons */
button[aria-label*="More Options"] {
    min-width: 40px !important;
    min-height: 40px !important;
}

/* Trash button */
.trash-button-custom {
    position: relative !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    background: rgba(255, 255, 255, 0.1) !important;
    transition: all 0.2s ease !important;
}
```

## 🔍 Debugging

<!-- Debug message examples removed to keep console clean policy -->

## 📋 Permissions

### **Required permissions:**
- `scripting` - apply/remove styles
- `activeTab` - detect and reload the current tab after toggle
- `storage` - save enabled/disabled state
- `host_permissions` - access only to suno.ai / suno.com

### **Permission justification:**
All permissions are used strictly for improving Suno.ai interface and do not collect any user data.

## 🤝 Contributing

1. Fork the repository
2. Create a branch for new feature
3. Make changes
4. Create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Suno.ai](https://suno.ai) - main service
- [Chrome Web Store](https://chrome.google.com/webstore) - for publishing
- [GitHub Issues](https://github.com/asmetanka/suno-ui-booster/issues) - for bugs and suggestions

---

**Created with ❤️ to improve Suno.ai experience**
