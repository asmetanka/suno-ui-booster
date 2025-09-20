# Suno UI Booster Project Structure

## 📁 Main Files

### 🔧 Configuration
- `manifest.json` - Chrome extension configuration
- `rules.json` - declarativeNetRequest rules

### 🎨 Interface
- `popup.html` - extension popup window
- `popup.js` - popup logic
- `styles.css` - CSS styles for interface improvements

### ⚙️ Logic
- `content.js` - main script for working with pages
- `background.js` - background script
- `injected.js` - injected script

### 🖼️ Resources
- `icon.png` - extension icon
- `logo.png` - logo for popup

### 📚 Documentation
- `README.md` - main project documentation
- `PRIVACY.md` - privacy policy
- `CHROME_STORE_DESCRIPTION.md` - Chrome Web Store description
- `LICENSE` - MIT license

## 🗂️ Folders

- `pages/` - saved pages for testing
- `.git/` - Git repository

## 📋 File Descriptions

### `manifest.json`
Chrome extension configuration with permissions and settings.

### `content.js`
Main extension logic:
- Inserts the custom trash button and hides share buttons
- Tries Suno’s native “Move to Trash” for Undo toast; falls back to API
- Replaces Like/Dislike icons (heart/cross) and default Pin icon (outline)
- Observes DOM for dynamic content and re-applies enhancements

### `styles.css`
CSS styles for interface improvements:
- Square album previews
- Larger control buttons
- Optimized spacing
- Trash button styles

### `popup.html` + `popup.js`
Extension popup window:
- Enable/disable toggle
- Work status
- Feature information

### `background.js`
Background script for:
- CSS style injection
- Extension event handling

### `injected.js`
Page-context script that deletes songs via Suno API when native flow isn’t available.

## 🔧 Permissions

- `scripting` - CSS injection
- `activeTab` - working with active tab
- `declarativeNetRequest` - CSP modification
- `storage` - saving settings
- `host_permissions` - access to suno.ai

## 📊 Statistics

- **Total files**: 15
- **Code**: 8 files
- **Documentation**: 4 files
- **Resources**: 3 files
- **Project size**: ~100KB

---

**Structure optimized and cleaned from duplicates! 🎵**
