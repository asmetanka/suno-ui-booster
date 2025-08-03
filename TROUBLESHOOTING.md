# Suno UI Booster - Troubleshooting Guide

## Common Issues and Solutions

### 1. Extension Not Loading

**Symptoms:**
- Extension doesn't appear in the list
- Errors in chrome://extensions/

**Solution:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension folder
4. Check console for errors

### 2. CSS Styles Not Applying

**Symptoms:**
- Suno interface doesn't change
- No UI improvements visible

**Check:**
- `manifest.json` contains `"scripting"` permission
- `background.js` is properly registered in manifest
- `styles.css` exists in the root folder

### 3. Popup Not Working

**Symptoms:**
- Clicking extension icon does nothing
- Errors in popup console

**Check:**
- `popup.html` and `popup.js` exist
- `manifest.json` has correct `"default_popup"` path
- No JavaScript errors in popup

### 4. Trash Button Not Appearing

**Symptoms:**
- No trash button next to songs
- Errors in browser console

**Check:**
- `content.js` is loading (check console)
- `injected.js` is properly injected
- No CORS errors

### 5. Console Errors

**Common errors:**

```
Error: Cannot access a chrome:// URL
```
**Solution:** This is normal for chrome:// pages

```
Error: No tab with id
```
**Solution:** This is normal when closing tabs

```
Error: Cannot access a chrome-extension:// URL
```
**Solution:** This is normal for extension pages

## File Verification

Ensure all these files are present:

- ✅ `manifest.json` - extension configuration
- ✅ `background.js` - background script
- ✅ `content.js` - content script
- ✅ `injected.js` - injected script
- ✅ `popup.html` - popup interface
- ✅ `popup.js` - popup logic
- ✅ `styles.css` - CSS styles
- ✅ `icon.png` - extension icon
- ✅ `logo.png` - popup logo

## Testing

1. Load the extension in Chrome
2. Visit suno.ai
3. Check if UI improvements are applied
4. Test trash button functionality
5. Verify popup toggle works

## Logging and Debugging

### Enable detailed logs:

1. Open DevTools (F12)
2. Go to Console tab
3. Look for messages with "Suno UI Booster" prefix

### Check functionality:

1. **Background script:** Check in chrome://extensions/ → Details → Service Worker
2. **Content script:** Check console on suno.ai page
3. **Popup:** Check popup console (right-click → Inspect)

## Updates

After making changes:

1. Go to `chrome://extensions/`
2. Click the refresh button (🔄) next to the extension
3. Or reload the extension completely

## Support

If issues persist:

1. Check browser console for errors
2. Ensure all files are in place
3. Verify JSON syntax in manifest.json
4. Try reinstalling the extension 