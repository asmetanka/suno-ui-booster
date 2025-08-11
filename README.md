# Suno UI Booster

Enhances Suno’s UI with reliable tooling, clean styling, and small workflow conveniences. The extension works only on Suno domains and does not intercept network calls or modify server responses.

## What it does

- Square cover previews across views, including compact 41×41 thumbnails
- Play overlays sized and optically centered for small covers and row overlays; dark circular backdrop always appears on hover (Play and Pause)
- Action bar buttons with pill shape and static translucent background
- Contextual Trash button injected into song rows with native-menu integration
- Workspace dropdown aligned to the button width and position
- Advanced Options panel always expanded with the header row hidden
- Consistent spacing and layout fixes for compact horizontal tiles (including `.css-1fls2yz` parity with `.css-1jkulof`)
- Cursor policy: pointer is reserved for text links; UI controls use the default cursor
- Playbar buttons use consistent icons (Heart/Cross) with correct contrast in active state
- Vocal Gender row: transparent background, fixed 8px right padding, pills with steady geometry
- Styles panel: “Exclude styles” input relocated below the textarea, with rounded-2xl and matching paddings
- Tabs Auto/Write Lyrics: soft backdrop, fixed widths (2×96px)
- Field spacing: controlled gap between “Song Title” and “Workspace”

## How it works

### Content script behavior (`content.js`)

- DOM observation: A single MutationObserver watches the document to initialize new UI fragments as Suno renders them dynamically.
- Song rows: Each row is processed once to inject a small, isolated wrapper containing a Trash button. The button first attempts the native “Move to Trash” menu item (to preserve Suno’s Undo toast); if not available, it falls back to a direct API request via an injected script channel.
- Label control: Specific header labels with exact text “Song Title” and “Workspace” are hidden to simplify the panel.
- Vocal Gender row: Inline override to remove background and align paddings; restored on disable.
- Styles panel: Moves “Exclude styles” input to the panel bottom; keeps inner controls intact; restores on disable.
- Workspace dropdown alignment: Whenever the dropdown appears, its width is set to match the Workspace button and its left/top are aligned with the button. This avoids guesswork in CSS and follows the component rather than screen breakpoints.
- Create button spacing vs. Playbar: The Create row’s bottom margin is computed from the Playbar progress bar height increase over Tailwind’s `h-2` default (8px). Only the extra height is used, and the lift is capped at 80px to avoid excessive motion. The spacing recalculates on init, DOM mutations, resize, and scroll.
- Advanced Options: The panel is forced open by removing collapse constraints; only the header/toggle row is hidden so the content remains accessible without an extra click.

Key principles:
- Non-invasive: do not override platform logic; leverage native UI where possible
- Deterministic selectors: prefer test IDs and structural selectors over brittle class chains
- Defensive fallbacks: try native actions first, then degrade gracefully
- Minimal global state: small, readable functions with local scope and explicit responsibilities

### Styling (`styles.css`)

- Cover sizing: All cover variants are normalized with `aspect-ratio` and `object-fit: cover` to avoid letterboxing and overflow.
- Player overlays and controls: Play/Pause overlays are centered and sized for compact tiles; dark circular backdrop on hover universally. Visual centering nudges are applied where glyphs are optically off-center.
- Horizontal tiles: Compact items have clamped text width, fixed image sizes, and button containers that don’t shrink; tile wrappers define item basis to prevent overlap.
- Cursor policy: Only anchor tags display the pointer cursor; background-button UIs keep a non-pointer cursor for visual calm.
- Workspace button: Styled consistently with surrounding controls; popup positioning is handled in JS for accuracy. The “Boost Creativity” aura button renders as a text button in both active and disabled states.
- Playbar icons: Heart (Like) and Cross (Dislike) via masks with proper active-state contrast; optically centered.
- Tabs Auto/Write Lyrics: subtle glassy backdrop and fixed widths.
- Vocal Gender buttons: white text by default; active state shows pink backdrop; consistent pill width and no pointer cursor.

### Background and popup

- `background.js`: Injects or removes the stylesheet based on the stored “enabled” flag and tab URL. There is no network interception or header manipulation.
- `popup.js`: Toggles the “enabled” state and reloads the active Suno tab to apply CSS/logic.

## Installation

### Developer install
1. Clone the repository
   ```bash
   git clone https://github.com/asmetanka/suno-ui-booster.git
   cd suno-ui-booster
   ```
2. Open Chrome → `chrome://extensions/`
3. Enable Developer mode
4. Click “Load unpacked” and select the project folder

### Chrome Web Store
Install from the Chrome Web Store: `https://chromewebstore.google.com/detail/hcocfjdjhiiolcmplgfkgkifnjeeodcl`

## Project structure
```
suno-ui-booster/
├── manifest.json          # Extension config and permissions
├── content.js             # In-page logic and DOM integration
├── background.js          # CSS injection based on storage state and tabs
├── popup.html / popup.js  # Toggle UI and state handler
├── styles.css             # Deterministic UI overrides and components
├── PRIVACY.md             # Privacy policy
├── LICENSE                # MIT license
└── assets (icons)
```

## Permissions
- `scripting`: insert/remove styles on Suno pages
- `activeTab`: operate on the current tab
- `storage`: persist extension enabled state
- `host_permissions`: limited to Suno domains

## Notes on reliability
- No CSP rewriting or declarativeNetRequest rules are used
- No overriding of native constructors (e.g., `document.createElement`)
- Mutation observers are scoped and compact; JS and CSS compete minimally

## Changelog (highlights)

- v1.3
  - Unified small row layouts; ensured Play/Pause circular backdrop always shows on hover
  - Replaced Playbar Like/Dislike icons with Heart/Cross; fixed active-state contrast and centering
  - Vocal Gender: transparent row background, constant pill geometry, corrected spacing and active pink background
  - Moved “Exclude styles” input below the textarea with proper paddings and radius; aligned search icon
  - Tabs Auto/Write Lyrics: added backdrop and fixed widths (192px total)
  - Removed pointer cursor from More Options; tightened several paddings to 40px controls where applicable

## Support
- Email: `hello@smetanka.me`
- GitHub: `https://github.com/asmetanka/suno-ui-booster`

