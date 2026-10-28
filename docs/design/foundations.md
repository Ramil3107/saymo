# Foundations

The values that the screens use. The same values are in `tokens.css` and `tokens.json`, and the picture is `foundations.png`.

In short: a dark stage, one loud accent, a large dense font. The video comes first, and the interface steps back.

## Color

One theme, a dark one.

### Surface scale, from dark to light

| Token | Hex | Where used |
| --- | --- | --- |
| `ink` | `#08080B` | Page background. Text on accent and white buttons |
| `stage` | `#0F0F13` | The stage behind the video, input fields |
| `surface` | `#141418` | Cards, panels, bars, modals |
| `raised` | `#1D1D22` | Secondary buttons, chips, list rows, clips on the timeline |
| `selected` | `#26262C` | The selected clip on the timeline |

### Lines

| Token | Hex | Where used |
| --- | --- | --- |
| `line` | `#2C2C33` | Borders of cards, bars and buttons, the progress track |
| `line-strong` | `#3A3A44` | Outline chips, the dashed line of empty states |
| `line-input` | `#4A4A55` | Borders of input fields and dropdown lists |

The stage (`stage`) is outlined with `#1D1D22`, which is the `raised` color.

### Text

| Token | Hex | Where used | Contrast |
| --- | --- | --- | --- |
| `text` | `#FFFFFF` | Main text, white buttons, the Play button | 20.0:1 on `ink` |
| `text-muted` | `#A3A3AD` | Subheadings, field labels, hints, time codes | 8.0:1 on `ink`, 6.7:1 on `raised` |
| `text-faint` | `#8A8A94` | Placeholders and footnotes only | 5.9:1 on `ink`, 5.4:1 on `surface` |

All combinations pass 4.5:1 for normal text.

### Accent

| Token | Hex | Text on it |
| --- | --- | --- |
| `accent` (default) | `#FF4A1C` | `ink`, 6.0:1 |
| variant, purple | `#7C5CFF` | `ink`, 4.6:1 |
| variant, blue | `#4C7DFF` | `ink`, 5.4:1 |

Accent rules:
- One loud element per screen: the main action, the selection outline, progress, the playhead, a switch that is turned on.
- Text on the accent is always `ink`, never white.
- The variants let you try on a different character. Choose one, the same on every screen.

### Scrim and shadows

- The scrim under a modal: `ink` at 76% opacity, `rgba(8, 8, 11, 0.76)`.
- The float shadow, for things that float: `0 24px 60px rgba(0, 0, 0, 0.6)`. Only modals and tilted video frames.
- Everything else is flat: a 1 px border in `line` on `surface`.

### Colors inside videos

`#2D4BFF`, `#FFD23F`, `#F3F1EC`, `#0E3B2E`, `#B8F35A`, `#5B34D6`, `#FF8A5B`: the demo brand that colors the examples in the mockups. In real videos the colors come from the user's brand settings. The interface does not use these colors.

## Fonts

- **Onest**: the whole interface and headings. Weights 400, 500, 600, 700, 800.
- **JetBrains Mono**: time, durations, formats, hex, technical strings. Weights 400 and 500.
- Both are on Google Fonts.

### Scale

Format: size in px / weight / letter spacing / line height. Where a range is given, the size is fluid and depends on the window width.

| Role | Values | Example | Where used |
| --- | --- | --- | --- |
| Hero | 44–96 / 800 / −4% / 0.98 | Say it. Get a motion video. | Only the first screen of the landing page |
| Display | 36–68 / 800 / −3.5% / 1.02 | What are we making today? | Home, big moments like Welcome to Pro |
| Title | 32–52 / 800 / −3.5% / 1.04 | Your brand | Page heading, one per page |
| Section | 32–44 / 800 / −3% / 1.05 | Launches, sales, stories, numbers. | Landing page sections, large statuses |
| Heading | 26 / 700 / −2% / 1.2 | Or start from an example | Sections inside the app, modal headings |
| Card title | 20–22 / 700 / −2% / 1.2 | Scene 2. Headline | Cards and side panels |
| Bar title | 18 / 700 / −1% / 1.3 | Launch: reports in PDF | Top bar of a task screen |
| Lead | 17–18 / 400 / 0 / 1.45, `text-muted` | Describe it, drop a link… | The line under a heading |
| Body | 15–16 / 400–700 / 0 / 1.45 | Click anything in the video… | Text, buttons (700 on filled ones), fields |
| Small | 13–14 / 400 / 0 / 1.45 | Drag a scene to reorder it. | Hints, secondary lines |
| Label | 13 / 500 / 0 / 1.4, `text-muted` | What the video is about | Above every field and group |
| Sticker | 13 / 800 / +4% / uppercase | NO TIMELINE. NO LAYERS. | At most one per screen |
| Mono | 12–13 / 400, JetBrains Mono | 0:06 / 0:15 · 9:16 · 1080p | Time, formats, hex |

Fluid sizes in the mockups are set like this: Hero `clamp(44px, 7.5vw, 96px)`, Display `clamp(36px, 5.4vw, 68px)`, Title `clamp(32px, 4.4vw, 52px)`, Section `clamp(32px, 4vw, 44px)`.

The big numbers inside example videos (such as "30%" and "3×") are not part of the interface scale: they are video content.

## Spacing

A short scale. 14 stands out on purpose: it is the gap between cards and tiles, a bit tighter than 16, so that the grid reads as one piece.

| Value | Where used |
| --- | --- |
| 4 | Inside a segmented control; between the bars of a waveform |
| 8 | Between buttons and chips in a row; from a label to its field |
| 12 | Between fields stacked one under another and between list items; from an icon to the text in large buttons |
| 14 | Between cards, tiles and panels in a grid |
| 16 | Between groups inside a card; between elements of a top bar |
| 20–24 | Padding inside cards and side panels |
| 28 | Padding inside modals and plan cards; the space under a page heading |
| 32 | Page side padding on desktop. 16 on a phone |
| 44 | Between page sections |

### Content width

| Width | Where used |
| --- | --- |
| 880 | One task on a page: the prompt field, plans, account, Welcome to Pro |
| 1216 | Grids and two-column layouts: examples, My videos, brand, landing page |
| 500 | Modals |

Pages are fluid up to these widths.

### Top bars

- App bar (with the logo and navigation): 20 px padding on top and bottom, 32 px on the sides.
- Task bar (back arrow and title): 16 px on top and bottom, 32 px on the sides.

## Shape and size

### Radii

| Radius | Where used |
| --- | --- |
| pill (999) | Buttons, chips, switches, the edit composer |
| 28 | Panels, cards, modals, bars |
| 24 | Video frames and example tiles |
| 18 | Rows inside cards: files, switches |
| 16 | Input fields and dropdown lists |
| 12–14 | Clips on the timeline, mini previews |

### Sizes

| Size | What |
| --- | --- |
| at least 44 | Any touch target, including icons and chips |
| 52 and 44 | Height of a large and a regular button |
| 52 and 48 | Height of an input field; 48 in dense side panels |
| 44–48 | Round icon buttons: back, close, play, send |
| 9:16, 1:1, 16:9 | Frame formats. 9:16 by default |

## Icons

- Outlined, on a 24 grid, with a 1.8 stroke and rounded caps and corners.
- In buttons 17–18 px, on their own 22–24 px.
- Only Play is filled.
- The mockups use: back, arrow, link, video, podcast (microphone), upload, download, play, check, close, add, editor (sliders), split (scissors), copy, delete, account. They are drawn by hand as inline SVG, and no specific icon set has been chosen.

## Tone of voice

Short, plain English, with a little film-set humor in the big lines.

| Rule | Examples |
| --- | --- |
| A button names the action | Make the video · Download · Send for review · Go Pro |
| A heading can wink | Rolling. Three takes coming up. · Keep the camera rolling. · Cut. Something broke on set. |
| Field labels never joke | What should change? · Work email · Clip length |
| We say what will happen | Edits never count. · Cancel any time in one click. · It doesn't count toward your limit. |
