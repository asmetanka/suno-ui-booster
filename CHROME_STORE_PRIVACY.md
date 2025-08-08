### **Single purpose description**

This extension enhances the Suno.ai user experience with two key improvements. First, it applies custom CSS to improve visual aesthetics by creating a cleaner, more consistent layout with squared album art and better spacing. Second, it adds a much-needed "quick delete" button directly to each song row. This button allows users to remove tracks from their library by sending a direct, secure API request, mirroring the site's own functionality but making it more accessible and efficient. The extension's sole purpose is to improve the site's UI and streamline user workflow.

### **Permission justification**

#### **`scripting` justification**

The "scripting" permission is essential for two core functions. Firstly, we use `chrome.scripting.insertCSS()` to apply our custom stylesheet (`styles.css`), which is the modern, secure method for visual modifications. Secondly, and critically, this permission is required to inject a small script (`injected.js`) into the page's context. This injected script is necessary to securely handle API requests for the "quick delete" feature, bypassing CORS limitations imposed by the website. This is the standard, Google-recommended architecture for such functionality.

#### **`activeTab` justification**

While the extension primarily operates on suno.ai domains via host permissions, the "activeTab" permission is included as a user-privacy-focused fallback. It ensures that if future changes require interaction via the popup, the extension will only ever request access to the currently active tab, and only in response to a direct user click on the extension's icon. This follows the principle of least privilege, guaranteeing the extension does not have persistent access to tab information.

#### **`storage` justification**

The "storage" permission is used to save a single boolean value (`isEnabled`) via the popup menu. This allows the user's choice to enable or disable the extension's custom styles and features to persist across browser sessions. This provides a consistent user experience and respects the user's preference without storing any personal or sensitive data.

#### **Host permission justification**

Host permissions for "*://*.suno.ai/*" and "*://*[.suno.com/](https://www.google.com/search?q=https://.suno.com/)*" are fundamental to the extension's purpose. They are required for three specific actions:

1.  Injecting the main content script (`content.js`) to modify the page DOM and add the "quick delete" button.
2.  Injecting the sandboxed agent script (`injected.js`) to handle API calls securely.
3.  Applying the custom stylesheet (`styles.css`) to improve the user interface.
    Access is strictly limited to these domains and is essential for all core features of the extension. No data is collected.

#### **✅ Authentication information**

The extension handles the user's temporary session token to perform an API request on their behalf. When the user clicks the delete button, the script programmatically retrieves the current session token (from window.Clerk or cookies) and includes it in the Authorization header of the API call to Suno's own server. This is essential for the "quick delete" feature to function. The token is used exclusively for this single API call and is not stored, logged, or sent to any third-party server.

#### **✅ User activity**

The extension's core functionality is initiated by user activity. It listens for a click event specifically on the "delete" button that it adds to the page. This interaction is the sole trigger for the song deletion process. The extension does not monitor any other clicks, mouse movements, or user activities on the page.

#### **✅ Website content**

To perform the delete action, the extension needs to identify which song to remove. It does this by reading the page's HTML content to find the song row clicked by the user and extracts the unique song ID from a link's href attribute within that row. This data is used solely for the API request and is not stored or used for any other purpose.