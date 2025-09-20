# Suno UI Booster Firefox Extension Project Structure

## 📁 Main Files

### 🔧 Configuration
- `manifest.json` - Firefox extension configuration (Manifest V2)
- `rules.json` - declarativeNetRequest rules (if needed)

### 🎨 Interface
- `popup.html` - extension popup window
- `popup.js` - popup logic
- `styles.css` - CSS styles for interface improvements

### ⚙️ Logic
- `content.js` - main script for working with pages
- `background.js` - background script
- `injected.js` - injected script for API access

### 🖼️ Resources
- `icon.png` - extension icon
- `logo.png` - logo for popup

### 📚 Documentation
- `README.md` - main project documentation
- `PRIVACY.md` - privacy policy
- `FIREFOX_STORE_DESCRIPTION.md` - Firefox Add-ons store description
- `LICENSE` - MIT license

### 🛠️ Build Tools
- `build.sh` - build script for creating .xpi package
- `package.json` - npm configuration for build scripts

## 🗂️ Folders

- `pages/` - saved pages for testing (if present)

## 📋 File Descriptions

### `manifest.json`
Firefox extension configuration with permissions and settings for Manifest V2.

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

- `activeTab` - working with active tab
- `storage` - saving settings
- `downloads` - handling file downloads
- `scripting` - CSS injection and script execution
- `host_permissions` - access to *.suno.ai and *.suno.com domains

## 📊 Statistics

- **Total files**: 16
- **Code**: 8 files
- **Documentation**: 5 files
- **Resources**: 3 files
- **Project size**: ~150KB

---

**Firefox extension structure optimized and ready for deployment! 🦊**
