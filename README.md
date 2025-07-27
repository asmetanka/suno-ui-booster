# Suno UI Booster

Chrome extension for improving Suno AI user interface.

## Description

Suno UI Booster is a Chrome extension that enhances the appearance and functionality of the Suno AI web application. The extension adds custom styles and improvements for a more comfortable user experience.

## Features

- **Enhanced Interface**: Custom styles for a more modern look
- **Optimized Elements**: Improved buttons, cards, and navigation
- **Responsive Design**: Better adaptation to different screen sizes
- **Improved Typography**: Optimized fonts and spacing

## Installation

1. Download the `suno-ui-booster.crx` file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Drag and drop the `.crx` file into the browser window
5. Confirm installation

## Development

### Project Structure

```
suno-ui-booster/
├── manifest.json      # Extension manifest
├── popup.html         # HTML for popup window
├── popup.js           # JavaScript for popup
├── content.js         # Script for page injection
├── background.js      # Background script
├── styles.css         # Main styles
├── icon.png           # Extension icon
└── README.md          # This file
```

### Building

To create a `.crx` file:

1. Package all files into a ZIP archive
2. Rename the extension to `.crx`
3. Or use Chrome Web Store for distribution

## License

MIT License

## Author

Created to improve the Suno AI user experience. 