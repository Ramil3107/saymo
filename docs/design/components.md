# Components

What the screens are built from. Sizes are in px, colors are tokens from `foundations.md`. Where a component has a state that the mockups do not show, this is said directly.

General rules:
- Any touch target is at least 44 × 44.
- Icon buttons without text are labeled for screen readers (`aria-label`).
- Hover and focus are not drawn. Proposal: on hover, the background goes one step lighter on the surface scale; focus is a 2 px accent outline with a 2 px offset.

## Top bars

**App bar.** The app header (Home, Brand setup, My videos, Account, Plans, Welcome to Pro).
- Padding 20 on top and bottom, 32 on the sides. The logo on the left, the navigation on the right with a gap of 8.
- Logo: a 22 circle in the accent color and the name in 17 / 700, goes to Home.
- Your brand: a 44 pill, `line` border, `surface` background, three 12 dots in the brand colors and a 15 label. Goes to Brand setup.
- My videos: a text link in 15, 44 high. Goes to My videos.
- Profile: a 44 round button, `line` border, `surface` background, an 18 icon. Goes to Account.

**Task bar.** The bar of a task screen (Generating, Video and edits, Editor, Add graphics, Podcast clips, Generation failed).
- Padding 16 on top and bottom, 32 on the sides.
- Left: a 44 round "back" button (`line` border, `surface` background), the title in 18 / 700, sometimes a second line in 15 `text-muted` (file name, duration).
- Right: the actions of the screen, with a gap of 8.

**Public bar.** The header of public pages (Landing, Sign in, Check your email, Review link): only the logo and, where needed, links or the View only tag.

## Buttons

| Variant | Height | Padding | Look | Where used |
| --- | --- | --- | --- | --- |
| Primary, large | 52 | 0 26 | `accent` background, `ink` text 16 / 700, an 18 icon on the right | The main action of the screen: Make the video, Start free, Go Pro |
| Primary | 44 | 0 20 | The same, text 15 / 700 | The main action in a bar: Download, Done, Make 3 clips |
| White | 52 | 0 26 | White background, `ink` text 16 / 700 | An important action when the screen already has a different main action: Continue with Google, Fetch brand |
| Secondary | 44 (sometimes 52) | 0 18 | `raised` background, `line` border, text 15 / 400, a 17 icon on the left | Link, Existing video, Resend link, Manage billing |
| Outline | 44 | 0 16 | Transparent background, `line-strong` border, text 14 | Quick edits: Bigger, Rewrite, Change font, Remove |
| Suggestion | 44 | 0 16 | `surface` background, `line` border, text 14 | The "What next" suggestions |
| Icon | 44 | — | A circle, `line` border, `surface` or `raised` background, an 18 icon | Back, close, profile |
| Play | 48 (44 in the editor) | — | A white circle, a filled `ink` icon 18 | Players |
| Send | 48 | — | An `accent` circle, an `ink` up arrow | Edit composer |
| Disabled | 52 | 0 22 | Transparent background, `line` border, `text-muted` text 16 / 600 | Your current plan |

- All buttons are pills (radius pill).
- The gap from the icon to the text is 8, and 10 in large buttons.
- A link that looks like a button stays a link, not a button inside a link.

## Input fields

**Input.** Height 52, padding 0 18, radius 16, `line-input` border, `stage` background, text 16. In dense panels (editor, clip settings) height 48, padding 0 16, text 15. The label above the field is Label (13 / 500 `text-muted`), gap 8. Placeholder `text-faint`.

**Select.** Like Input, padding 0 12–14. Used for the brand font, the text entrance and the transition between scenes.

**Prompt card** (Home). A `surface` card, `line` border, radius 28, padding 22. Inside: a label, a borderless 2-line field (text 20), a row of source chips (Link, Existing video, Podcast) and the format picker "9:16, 15 sec", and on the right a large Primary button.

**Edit composer** (Video and edits). A pill field 48 high (`stage` background, `line-input` border, text 15) and a round Send button 48 next to it, gap 8.

**Read-only link field** (Send for review). An Input with monospace text 14 and a Copy link button next to it.

## Choice

**Toggle chip.** Multi-select (download formats, clip format). Height 44, padding 0 18, a pill, text 14. On: white background, `ink` text 600, a 16 check mark on the left. Off: transparent, `line-strong` border.

**Filter chip.** One of several (the filter in My videos). Like Toggle chip without the check mark; when off it has a `line` border.

**Segmented control.** One of 2–4 (the format in the player, quality, clip length). A pill container: `ink` background, `line` border, padding 4, gap 4. Items 36 high, at least 54–64 wide. Selected: white background, `ink` text 14 / 600. Others: transparent, text 14 / 500.

**Switch.** On/off (the review link, captions). Track 52 × 30, knob 22. On: `accent` track, `ink` knob on the right. Off: `line-strong` track, `text-muted` knob on the left. Touch area 60 × 44. Usually sits on the right in a card row (`raised` background, radius 18) with a name 15 / 600 and a description 13 `text-muted`.

**Brand colour** (Brand setup). A button 52 high, radius 16, `raised` background, `line` border: a 30 dot in the color and the hex in monospace 14.

## Feedback

**Progress bar.** Height 8, radius 4, `line` track, `accent` fill. The label next to it or under it, in monospace 12–13 `text-muted`.

**Step chips** (Generating). Pills 40 high, `line` border, `surface` background, text 14. Done: a white check mark. Now: a 9 dot in the accent color. Upcoming: an empty circle, `text-muted` text.

**Sticker.** A white pill, `ink` text 13 / 800 in uppercase with +4% letter spacing, padding 6 14, a double outline (3 px `ink` inside, 3 px white outside), tilted from −3° to −5°. At most one per screen. The large variant on Welcome to Pro: text 32, outlines of 4.

**Empty state.** A 1.5 px dashed border in `line-strong`, radius 28, everything centered: a sticker, a heading, the main button, examples.

**Error state** (Generation failed). A 9:16 frame with diagonal hatching in `surface` and `stage`, and in the center a white 60 circle with a warning icon.

## Containers

**Card.** `surface` background, `line` border, radius 28, padding 24 (22–28).

**Stage.** The area where the video is shown: `stage` background, `raised` border, radius 28.

**Modal.** Width up to 500, `surface` background, `line` border, radius 28, padding 28, float shadow, gap between blocks 22. The scrim (`scrim`) goes over the screen the modal is opened from. At the top: a Heading (26 / 700) with a description in 15 `text-muted`, and a 44 close button on the right.

**Plan card.** Free is a regular Card with padding 28. Pro is a white card with `ink` text, radius 28, padding 28 and a black No watermark sticker in the corner. The price is 60 / 800, letter spacing −4.5%. A list with 18 check marks, text 16, gap 12.

## Videos

**Example tile.** A 9:16 frame, radius 24, with a video mockup inside. In the bottom left corner, a Play 34 button (an `ink` circle, a white icon) inset 16. Under the frame, a name 15 / 600 and a description 13 `text-muted`, gap 12. The tile grid: tiles from 170 wide, gap 14.

**Video frame.** The frame of a video on the stage: 9:16, radius 24 (smaller in the editor and the preview, radius 18).

**Versions.** A column of mini frames 58 × 102, radius 13, gap 12, with a Versions label on top. The selected one has a 2 px accent outline with an offset of 3.

**Selection.** The selected element in the frame has a 2 px accent outline with an offset of 8.

**Edit panel** (Video and edits). Next to the frame: `raised` background, `line` border, radius 24, padding 18, gap 14. At the top, a 9 dot in the accent color and the element name in 16 / 700, and on the right a button that clears the selection. Then the Edit composer, a row of Outline buttons for quick edits and a hint 13 `text-muted`.

**Player bar.** A strip under the stage: `surface` background, `line` border, radius 28, padding 10 18 10 10. Play 48, a slider, the time in monospace 13 `text-muted`, a Segmented control for formats, an Editor link 14 `text-muted` with the sliders icon.

**Timeline** (Manual editor).
- Time ruler: monospace 12, 1 px `line-input` ticks.
- Track labels on the left, width 84, 13 / 500 `text-muted`.
- Scenes: clips 60 high, radius 14, `raised` background, width proportional to the duration. The name 14 / 600, the duration in monospace 12. The selected clip: a 2 px `accent` border, `selected` background, trim handles 4 × 24 in the accent color on the edges.
- Voice and Music tracks: height 40, radius 12, `raised` background, and the music track has a striped "wave".
- Playhead: a 2 px line and a 12 dot in the accent color.

**Suggestion row** (Add graphics). A row: radius 18, `raised` background, padding 12 12 12 14. The time in monospace 13, the type in 12 / 700 uppercase `text-muted`, the text 15 / 600. On the right two 44 round buttons: accept (accepted: a white circle with an `ink` check mark; not accepted: a `line-input` outline) and skip. The selected row has a 2 px accent outline. The places of the suggestions are marked with accent-colored dots on the player slider.

**Clip card** (Podcast clips). A card that is a button: radius 22, `surface` background, 2 px border (kept: `accent`, skipped: `line`), padding 12. On the left a mini preview 72 × 128, radius 12. On the right the number in monospace, the Keep tag (an `accent` pill 26 high) or Skip (an outline), the quote 15 / 600, the time and duration in monospace 12. A press toggles Keep/Skip.

**Waveform** (Podcast clips). Bars each 1/160 wide, with a gap of 2. The moments found are highlighted (kept: accent, skipped: white), with a number in a 24 circle above each.

**File row** (Download). A row, radius 18, `raised` background. An icon of the frame's aspect ratio, the name 15 / 600, the format line in monospace 12. On the right a white Save button or the render percentage; while rendering, a Progress bar under the row.
