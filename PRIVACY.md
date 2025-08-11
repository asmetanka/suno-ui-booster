# Privacy Policy

Suno UI Booster is a Chrome extension that enhances the Suno web interface. It operates entirely in the browser and is designed with privacy as a first-class concern.

## Data collection

We do not collect, transmit, or store any personal data. The extension performs only client-side DOM/CSS adjustments and does not communicate with external servers.

## Permissions used

- `scripting`
  - Purpose: Insert or remove the stylesheet for UI improvements
  - Usage: Applies CSS via `chrome.scripting.insertCSS()` when the extension is enabled

- `activeTab`
  - Purpose: Operate on the current Suno tab
  - Usage: Detects when a Suno page finishes loading to apply or remove styles

- `storage`
  - Purpose: Persist the enabled/disabled state
  - Usage: Saves a boolean flag toggled from the popup UI

- `host_permissions`
  - Purpose: Limit action to Suno sites
  - Usage: Restricts style injection to `suno.ai` and `suno.com` domains only

Notes:
- There is no use of `declarativeNetRequest`.
- The extension does not alter network requests or server responses.

## Security

- No external requests or telemetry
- Settings are stored locally in the browser
- Open-source code for transparency

## Contact

- Email: hello@smetanka.me
- GitHub: https://github.com/asmetanka/suno-ui-booster
- Website: https://smetanka.me

## Updates

This policy may be updated from time to time. Last update: August 11, 2025.

— Built with respect for your privacy.