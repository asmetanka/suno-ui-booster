# Privacy Policy

**Suno UI Booster** - Chrome browser extension that improves the Suno.ai website interface.

## 📊 Data Collection

**We do NOT collect any user data.**

The extension works entirely on the client side and does not send any information to external servers.

## 🔧 Used Permissions

### `scripting`
- **Purpose**: CSS injection for interface improvement
- **Usage**: Applying visual improvements to Suno.ai pages
- **Justification**: Required for programmatic CSS injection. We use the `chrome.scripting.insertCSS()` function, which is a modern and secure method recommended by Google for applying visual styles to pages.

### `activeTab`
- **Purpose**: Access to active tab
- **Usage**: Working with open Suno.ai pages
- **Justification**: Used in conjunction with `chrome.tabs` API to monitor tab updates on suno.ai and suno.com domains. This allows the extension to apply or remove its custom styles consistently when navigating between pages.

### `declarativeNetRequest`
- **Purpose**: CSP (Content Security Policy) modification
- **Usage**: Allowing injection of own CSS files
- **Justification**: Critically important for extension functionality on suno.ai. The website has a strict Content Security Policy (CSP). We use `declarativeNetRequest` with rules defined in `rules.json` to modify these CSP headers.

### `storage`
- **Purpose**: Saving user settings
- **Usage**: Remembering enabled/disabled state of extension
- **Justification**: Used to save a single boolean value indicating whether the extension is currently enabled or disabled by the user via the popup menu.

### `host_permissions`
- **Purpose**: Access to Suno domains
- **Usage**: Working only with suno.ai and suno.com sites
- **Justification**: Required to access Suno website pages, allowing the extension to inject its custom CSS file (`styles.css`) to modify the site's appearance.

## 🛡️ Security

All permissions are used exclusively for improving Suno.ai interface:

- ✅ **No external requests** - extension does not contact external servers
- ✅ **Local storage** - all settings saved only in browser
- ✅ **Open source** - all source code available on GitHub
- ✅ **No tracking** - no analytics or monitoring

## 🔧 Technical Necessity

Each permission has a specific technical necessity:

1. **`scripting`** - for CSS injection
2. **`activeTab`** - for working with active tab
3. **`declarativeNetRequest`** - for CSP modification
4. **`storage`** - for saving settings
5. **`host_permissions`** - for access to suno.ai

## 📞 Contacts

If you have questions about privacy:

- **Email**: hello@smetanka.me
- **GitHub**: https://github.com/asmetanka/suno-ui-booster
- **Website**: https://smetanka.me

## 📅 Updates

This privacy policy may be updated. Last update: **July 29, 2025**.

---

**Suno UI Booster** is created with respect for your privacy.