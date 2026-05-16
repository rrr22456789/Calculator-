# 🧮 Calc+

> A feature-rich, PWA-ready calculator built as a single HTML file — with multiple modes, custom themes, sound packs, and deep personalization.

<br>

## 📁 Project Files

| File | Description |
|---|---|
| `index.html` | Main app file — entire calculator lives here |
| `btn-images.js` | Button Image Customizer — connect to main file |
| `menifest.json` | PWA manifest for home screen install |
| `service-worker.js` | Offline caching service worker |
| `icon-192.png` | App icon (192×192) |
| `icon-512.png` | App icon (512×512) |
| `click.mp3` | Key sound — crisp click |
| `switch.mp3` | Key sound — toggle switch |

<br>

## 🚀 Getting Started

### Run locally
Just open `index.html` in any modern browser — no build step, no dependencies.

### Install as PWA
1. Host all files on **HTTPS** (GitHub Pages, Netlify, Vercel, etc.)
2. Open in Chrome or Safari on Android/iOS
3. Browser will show **"Add to Home Screen"** prompt automatically

> ⚠️ PWA install requires HTTPS. `localhost` also works for development.

<br>

## ✨ Features

### 7 Calculator Modes

| Mode | Icon | Description |
|---|---|---|
| **Standard** | 🔢 | Full 4-operator calculator with live expression preview |
| **Scientific** | 🔭 | sin, cos, tan, log, ln, factorial, square root, power |
| **Programmer** | 💻 | Binary, Octal, Decimal, Hex conversion with bitwise ops |
| **Unit Converter** | ⚖️ | 12 categories, 100+ units with custom dropdowns |
| **GST / Tax** | 🧾 | Calculate GST at any rate — inclusive & exclusive |
| **EMI Calculator** | 🏦 | Loan EMI, total payment, total interest |
| **Split Bill** | 🍕 | Split any bill across people with tip percentage |

### Unit Converter — 12 Categories

Length · Weight · Temperature · Area · Volume · Speed · Time · Data · Energy · Pressure · Angle · Fuel Efficiency

### Operator Buttons
Full four-function layout — **÷**, **×**, **−**, **+** — plus decimal point.

Keyboard shortcuts: `0–9`, `.`, `+`, `-`, `*`, `/`, `Enter`, `Backspace`, `Escape`

<br>

## 🎨 Themes

### Light / Dark / System
Toggle with the sun/moon switch. System mode follows device preference automatically.

### Color Themes

| Theme | Dark variant | Light variant |
|---|---|---|
| **Default** | Charcoal grey | Warm beige |
| **🍒 Cherry** | Deep crimson `#1a0508` | Soft blush `#fff0f1` |
| **Rose Gold** | Burgundy rose `#1e0e0c` | Blush cream `#f8eeea` |
| **💜 Violet** | Deep plum `#1a0b20` | Soft lavender `#f5ebfa` |

Each color theme automatically switches between its dark and light variants based on the current Light/Dark/System setting.

<br>

## 🔊 Sound Packs

| Pack | Icon | Character |
|---|---|---|
| **Pop** | 🫧 | Soft bubble pops (default) |
| **Click** | 👆 | Crisp key clicks |
| **Flip** | 🎴 | Card flip sounds |
| **Switch** | 🔘 | Toggle switch feel |
| **Silent** | 🔇 | No sound |

Sound files used: `click.mp3` and `switch.mp3`

<br>

## ⚙️ Settings

### Customise
| Option | Description |
|---|---|
| **Appearance** | Light / Dark / System toggle, color theme, font style |
| **Edit Layout** | Drag-and-drop button layout editor |
| **Button Images** | Add photos to any digit or operator button |

### Calculator
| Option | Description |
|---|---|
| **Operator Lock** | **ON** — operator stays after pressing (default) · **OFF** — press a different operator right away to swap it |

### Preferences
| Option | Description |
|---|---|
| **Sound & Haptics** | Sound pack selection, haptic feedback toggle |
| **Number Format** | 🇮🇳 Indian (1,23,456) · 🇺🇸 US (123,456) · 🇩🇪 EU (123.456) |
| **History & Tape** | Tape size (0–10 entries), clear history |

<br>

## 🖼️ Button Images (`btn-images.js`)

Add custom photos to any calculator button.

**Setup:** Place `btn-images.js` in the same folder as `index.html`. The main file links it automatically via:
```html
<script src="btn-images.js"></script>
```

**How it works:**

1. Go to **Settings → Button Images**
2. Tap any digit (`0–9`) or operator (`+`, `−`, `×`, `÷`, `.`)
3. Choose a photo from your gallery
4. Image appears on the button — label is hidden
5. Tap **×** on a thumbnail to remove it

**Technical details:**
- Images are resized to max 200×200px and stored as JPEG (quality 0.75) in `localStorage` under key `calcpx4_btnimg` — separate from the main config
- Reapplied automatically after every `render()` call via the `afterRender` hook
- "Clear All" button removes all images at once

**Eligible buttons:** `0 1 2 3 4 5 6 7 8 9 + − × ÷ .`

<br>

## 🔧 Layout Editor

Drag and drop to rearrange buttons. Available button palette includes:

- Digits: 0–9
- Operators: Add, Subtract, Multiply, Divide (individual)
- Functions: Clear, Delete, Equals, Decimal, Memory ops
- Legacy: Single configurable Operator button

Changes are saved to `localStorage` automatically. If the saved layout is from an older version (single-operator layout), it auto-migrates to the new 4-operator default.

<br>

## 💾 Data Storage

All data is stored in `localStorage` — no server, no account required.

| Key | Contents |
|---|---|
| `calcpx4` | Main config (theme, sound, layout, format, etc.) |
| `calcpx4_btnimg` | Button image overrides (base64 JPEG) |
| `calcpx4_hist` | Calculation history |

<br>

## 🗂️ Config Reference (`DEF_CFG`)

```js
{
  theme:       'light',     // 'light' | 'dark' | 'system'
  colorTheme:  'default',   // 'default' | 'cherry' | 'rosegold' | 'violet'
  sound:       true,        // key sounds on/off
  soundPack:   'pop',       // 'pop' | 'click' | 'flip' | 'switch' | 'silent'
  haptics:     true,        // vibration on/off
  opLock:      true,        // operator lock on/off
  numFormat:   'en-IN',     // 'en-IN' | 'en-US' | 'de-DE'
  tapeSize:    5,            // live tape rows (0–10)
  mainOp:      '+',         // last used operator
  memory:      0,           // memory register
  devMode:     false,       // developer debug overlay
  showCount:   false,       // show entry count
  font:        'rounded',   // font style
  calcMode:    'standard',  // active calculator mode
  layout:      null,        // custom button layout (null = default)
}
```

<br>

## 📱 PWA Checklist

| Requirement | Status |
|---|---|
| HTTPS hosting | Required (your deployment) |
| `menifest.json` | ✅ Included |
| `service-worker.js` | ✅ Included |
| Icons 192 + 512 | ✅ Included |
| `theme-color` meta tag | ✅ Updates with theme |
| Viewport meta | ✅ Mobile-optimized |
| `apple-mobile-web-app-capable` | ✅ iOS home screen ready |

<br>

## 🛠️ Architecture

```
index.html
│
├── <style>          CSS — themes, layout, animations (all inline)
├── <body>           UI — calculator, overlays, settings panels
└── <script>         JS — all logic inline
    ├── Config & storage    (DEF_CFG, loadCfg, saveCfg)
    ├── Sound engine        (_preload, beep, vibe)
    ├── Render engine       (render, buildGrid, applyTheme)
    ├── Calculator core     (doD, doOp, doAdd/Sub/Mul/Div, doEq, doCl)
    ├── Unit converter      (UNIT_CATS, unitCalc, unitBuildList)
    ├── Tool overlays       (initGst, initEmi, initSplit)
    ├── Layout editor       (leOv, ALLBTN, DEF_LAYOUT)
    ├── Settings            (initSettings, updateSettUI)
    └── afterRender hook    (called at end of every render())

btn-images.js (external)
    ├── load / save         (localStorage key: calcpx4_btnimg)
    ├── resizeAndStore      (canvas resize → JPEG base64)
    ├── applyToCalc         (overlays images on live buttons)
    ├── openEditor          (bottom-sheet overlay with grid)
    └── BtnImageMgr.init()  (chains into window.afterRender)
```

<br>

## 📄 License

MIT — use freely, attribution appreciated.

---

*Calc+ v2.1 · PWA / Web · Built with vanilla HTML, CSS & JS*
