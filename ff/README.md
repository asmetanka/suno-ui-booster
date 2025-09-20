# Suno UI Booster - Firefox Version

A Firefox extension that enhances the Suno.ai music creation interface with cleaner UI elements, better controls, and improved usability.

## Features

- **Cleaner Interface**: Removes clutter and improves visual hierarchy
- **Enhanced Controls**: Larger player controls for better interaction
- **Square Album Covers**: Displays album art in square format
- **Quick Toggle**: Easy on/off toggle from the extension popup
- **Trash Button**: Direct delete functionality for songs
- **Download Support**: Enhanced download capabilities

## Installation

### Option 1: Firefox Add-ons Store (Recommended)

1. Visit the Firefox Add-ons store
2. Search for "Suno UI Booster"
3. Click "Add to Firefox"
4. Confirm the installation

### Option 2: Manual Installation (Developer Mode)

1. **Download the extension files**
   ```bash
   # Clone or download this repository
   # Navigate to the ff/ directory
   cd /path/to/suno-ui-booster/ff/
   ```

2. **Package the extension**
   ```bash
   # Create a ZIP file of all files in the ff/ directory
   zip -r suno-ui-booster-ff.xpi *
   ```

3. **Install in Firefox**
   - Open Firefox
   - Type `about:addons` in the address bar
   - Click the gear icon (⚙️) and select "Install Add-on From File..."
   - Select the `suno-ui-booster-ff.xpi` file you created
   - Click "Add" when prompted

## Usage

1. **Navigate to Suno.ai**
   - Visit [suno.ai](https://suno.ai) or any Suno-related page

2. **Enable the Extension**
   - Click the extension icon in your browser toolbar
   - Toggle "BOOST MUSIC" to enable enhancements
   - The interface will automatically apply the UI improvements

3. **Features Available**
   - Larger, more accessible player controls
   - Square album artwork display
   - Quick trash/delete buttons for songs
   - Cleaner workspace layout
   - Enhanced download options

## Permissions

The extension requires the following permissions:
- **Storage**: To save your preference settings
- **Active Tab**: To apply UI changes on Suno pages
- **Downloads**: To handle music file downloads
- **Host Permissions**: Access to *.suno.ai and *.suno.com domains

## Compatibility

- **Firefox**: Version 57+ (supports WebExtensions)
- **Firefox ESR**: Version 68+
- **Firefox Developer Edition**: Latest versions

## Troubleshooting

### Extension Not Working
1. Ensure you're on a Suno.ai domain
2. Check that the extension is enabled in the popup
3. Try refreshing the page
4. Check browser console for any error messages

### UI Changes Not Applying
1. Toggle the extension off and on again
2. Clear browser cache and reload the page
3. Check if other extensions might be conflicting

### Permission Issues
1. Go to `about:addons`
2. Find "Suno UI Booster"
3. Ensure all required permissions are granted

## Development

### Building from Source

1. **Prerequisites**
   ```bash
   # Node.js and npm (for any build tools if needed)
   # Firefox Developer Edition (recommended for testing)
   ```

2. **Setup**
   ```bash
   cd ff/
   # The extension is ready to load as-is
   ```

3. **Testing**
   - Open Firefox Developer Edition
   - Go to `about:debugging`
   - Click "This Firefox" → "Load Temporary Add-on"
   - Select the `manifest.json` file from the ff/ directory

### File Structure

```
ff/
├── manifest.json          # Extension manifest (Firefox MV2 format)
├── background.js          # Background service script
├── content.js            # Content script for page modifications
├── injected.js           # Injected script for page context access
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # UI enhancement styles
├── icon.png              # Extension icons
├── logo.png              # Logo image
└── README.md             # This file
```

## Differences from Chrome Version

- Uses Manifest V2 instead of V3 for broader Firefox compatibility
- `browser.*` APIs instead of `chrome.*` APIs
- `browser_action` instead of `action` in manifest
- Background script as persistent page instead of service worker
- Different CSP policies

## Support

For issues, feature requests, or questions:
- Check the troubleshooting section above
- Visit the GitHub repository issues page
- Ensure you're using a compatible Firefox version

## Privacy

This extension:
- Only operates on Suno.ai domains
- Does not collect or transmit personal data
- Stores only user preferences locally
- Does not modify any server communications

## License

See LICENSE file for details.