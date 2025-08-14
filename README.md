# Suno UI Booster

Enhances Suno’s UI with reliable tooling, clean styling, and small workflow conveniences. The extension works only on Suno domains and does not intercept network calls or modify server responses.

## What it does

- Square cover previews across views, including compact 41×41 thumbnails
- Play overlays sized and optically centered for small covers and row overlays; dark circular backdrop always appears on hover (Play and Pause)
- Action bar buttons with pill shape and static translucent background
- Contextual Trash button injected into song rows with native-menu integration
- Download WAV button injected into song rows: one click starts server-side conversion (if needed) and downloads the WAV automatically. While preparing it shows a blue wave animation; when complete, the button turns solid blue with a white checkmark for 3 seconds and then resets.
- Playbar: the same Download WAV and Trash buttons are added to the bottom player, in the same order as on rows.
- Workspace dropdown aligned to the button width and position
- Advanced Options panel always expanded with the header row hidden
- Consistent spacing and layout fixes for compact horizontal tiles (including `.css-1fls2yz` parity with `.css-1jkulof`)
- Cursor policy: pointer is reserved for text links; UI controls use the default cursor
- Playbar buttons use consistent icons (Heart/Cross) with correct contrast in active state
- Vocal Gender row: transparent background, fixed 8px right padding, pills with steady geometry
- Styles panel: “Exclude styles” input relocated below the textarea, with rounded-2xl and matching paddings
- Tabs Auto/Write Lyrics: soft backdrop, fixed widths (2×96px)
- Field spacing: controlled gap between “Song Title” and “Workspace”
- Update notifications: red dot on the extension icon when an update is available; popup shows a short banner with an UPDATE action. No indicators are shown once the latest version is installed.
- Row state colors: selected rows use `--rgb-dumbo-100`, playing rows use `--rgb-strawberry-100`, and selected+playing rows use brighter `--rgb-strawberry-200` for clear emphasis
- Action buttons (Edit/Publish): pill radius, translucent background `rgba(255,255,255,0.1)`, white text; Publish highlights in pink on hover/active with intensity matched to delete
- Like/Dislike spacing is stable (8px) across normal, selected and playing variants of the row

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
- Row backgrounds: selected `--rgb-dumbo-100`; playing `--rgb-strawberry-100`; selected+playing `--rgb-strawberry-200`.
- Edit/Publish buttons: pill (`border-radius: 9999px`), `background: rgba(255,255,255,0.1)`, white text, and shared hover/active ramps; for Publish specifically, hover/active are pink-tinted to mirror delete feedback.
- Button icon cluster: Like/Dislike gap fixed to 8px so layout doesn’t jump between row states.

### Background and popup

- `background.js`: Injects or removes the stylesheet based on the stored “enabled” flag and tab URL. Performs file downloads via the Chrome downloads API when requested by the content script, with a safe fallback if the service worker is restarting.
- `popup.js`: Toggles the “enabled” state and reloads the active Suno tab to apply CSS/logic. When an update is available, shows a small banner with an UPDATE button; after installing (or on latest), no banners are shown.

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
Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/hcocfjdjhiiolcmplgfkgkifnjeeodcl)

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
- `downloads`: used to save WAV files directly (no opening in a new tab)
- `host_permissions`: limited to Suno domains and Suno studio API

## Notes on reliability
- No CSP rewriting or declarativeNetRequest rules are used
- No overriding of native constructors (e.g., `document.createElement`)
- Mutation observers are scoped and compact; JS and CSS compete minimally

## Changelog (highlights)

- v2
  - Added Download WAV button to song rows and playbar. One-click converts (if necessary) and downloads WAV via Chrome downloads API; while preparing, shows blue wave animation; on success, shows a solid blue button with a white check for 3 seconds.
  - Added Trash button to the playbar with native-menu first and API fallback.
  - Robust insertion in dynamic DOM; safe messaging with service worker restarts.
  - Popup shows Version 2.

- v1.3
  - Unified small row layouts; ensured Play/Pause circular backdrop always shows on hover
  - Replaced Playbar Like/Dislike icons with Heart/Cross; fixed active-state contrast and centering
  - Vocal Gender: transparent row background, constant pill geometry, corrected spacing and active pink background
  - Moved “Exclude styles” input below the textarea with proper paddings and radius; aligned search icon
  - Tabs Auto/Write Lyrics: added backdrop and fixed widths (192px total)
  - Removed pointer cursor from More Options; tightened several paddings to 40px controls where applicable
  - Update notifications: red dot on toolbar icon when an update is available; popup banner with UPDATE action; no banner/dot when on latest
  - Advanced Options: panel is always expanded by removing collapse constraints; only the header/toggle row is hidden to keep content accessible without an extra click
  - Row state coloring: selected (`--rgb-dumbo-100`), playing (`--rgb-strawberry-100`), selected+playing (`--rgb-strawberry-200`)
  - Edit/Publish buttons: pill shape with translucent background and white text; Publish has pink hover/active
  - Like/Dislike icon spacing unified to 8px across row states

## Support
- Email: [hello@smetanka.me](mailto:hello@smetanka.me)
- GitHub: [asmetanka/suno-ui-booster](https://github.com/asmetanka/suno-ui-booster)

