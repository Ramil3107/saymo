# Vocabulary

Summary of section 6 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

The vocabulary is a set of React components on Remotion that take their parameters from the video document. A scene is a composition of primitives, not a template with fields. The model picks words from the vocabulary and the engine assembles the frame.

## Minimum for the first version

| Category | Primitives |
| --- | --- |
| Footage | trimmed video clip, background footage, image, logo, shape, Lottie |
| Camera | push, punch-in, pan, parallax over an image or screenshot |
| Text | headline, subheading, big number with a counter, quote, lower third, chip (paper pill sized to its text, optional badge such as Fe or 01, pops in with a blur and floats), sticker, title-card (section label and a big title on a dark panel), list (title and numbered items on a dark side panel) |
| Captions | thirteen presets built from one caption look, see [Captions](#captions) |
| Enters and exits | fade, slide, mask, by word, by letter, typewriter |
| Accents | celebrate, frame, focus, stress: four intents the style draws around an element, see [Accents in the document](#accents-in-the-document) |
| Transitions | cut, fade, slide, wipe, push |
| Backgrounds | color, gradient, brand, blurred footage |
| Audio | music ducked under the voice, voice, loudness normalization |
| Layout | per beat: free (chips float beside the subject in slots with keep-out zones), panel-top (a title card over the top 46%, the footage zooms and slides so the face sits below), panel-side (a list over one side, the face moves to the other); over a document or screen card the top panel is a short title strip and a headline becomes that strip; safe zones per destination with a 4% gutter; a beat without footage names a composition, see [Compositions](#compositions) |

## Where primitives come from

- GSAP with all plugins: free since 2025, and its timeline can be seeked to a frame inside Remotion.
- Remotion packages: transitions, captions, shapes, paths, lottie, layout-utils, google-fonts.
- Remocn (MIT) and techniques from the author's `video-editing` project.
- Third-party code is ported into the vocabulary under our schema, never plugged in as is.

External assets come only with permissive licenses, and a license manifest lives in the repository: Lucide icons, open illustrations, Lottie under the Lottie Simple License. There is no stock footage in the first version, so backgrounds in text mode are built from the brand, gradients, shapes and images from the link.

## Motion system

`src/video/motion` holds the motion grammar the primitives move by, and the motion lab shows it.

- **Tempos** (`tempo.ts`): `snap`, measured on Higgsfield (a move in 133 ms, a letter per frame, stepped counters, a two-frame flash), and `glide`, measured on motionvid (360 ms moves, 90 ms letters, smooth counts, no flash). A tempo sets the move length, the stagger, the word and letter steps, the blink period and four curves: enter, exit, move and pop with overshoot.
- **Moves** (`moves.ts`): enters `cut`, `fade`, `pop`, `punch`, `rise`, `lift`, `drop`, `smear`, `reveal`; exits `cut`, `fade`, `collapse`, `sink`, `smear`, `tilt`. A move turns eased progress into a pose: opacity, offset, scale, stretch, a turn in perspective, blur, a horizontal smear, a clip and a mask. Opacity follows time, not the curve: it fades in over the first 40% of an enter and is gone by 80% of an exit, so nothing pops on or off between frames. `poseAt` combines an element's enter and exit and draws the last frame of an exit at its end state.
- **Timing** (`timeline.ts`): eased and linear progress, stagger, letters typed, stepped or smooth counts, blink, chase, and a float for elements that hover: it eases in after the enter and moves up and down, a little sideways and with a slight turn, each element on its own period.
- **Remotion side** (`remotion/motion`): positions are whole pixels and a resting element has no transform (`pixels.ts`), because renderer tabs, and Lambda's browsers, round fractional positions differently and a still element would jump a pixel between frames. `Move` wraps an element in its pose, with a mask for `rise` and `sink` that leaves room for ascenders and descenders, and an SVG blur along x for `smear`; `TypeOn` types text with a caret.
- **Motion lab**: `pnpm remotion:lab` renders `runs/lab/motion-lab.mp4`, ten demos with both tempos side by side: type on, rise, punch and count, pop with stagger and float, smear with chevrons, reveal with a color swap and a tilt out, a box that morphs into a name with a burst, a split that frames the subject, flips one by one, and a collage tile that grows into the frame.

The style of a video sets its tempo: `bold-pop` moves in `snap` and `clean-paper` in `glide`; a register without a style picks one (`driving-launch` and `playful-sale` take `bold-pop`, `serious-clinical` and `rich-premium` take `clean-paper`). The document primitives move through `ElementBox`: chips and stickers pop in, float and collapse, the other elements lift in and fade out, and every exit ends exactly at the element's `exitMs`.

## Kinetic type

`src/video/type/schedule.ts` times a title: when each line and word starts for an entrance, and when the whole entrance ends. `src/video/remotion/type` draws it:

- `KineticTitle`: lines with a size (`xl`, `l`, `m`, `s`, fitted to the width), a tone (`ink`, `accent`, `alt`) and an alignment. The title enters by `type` (letter by letter, a caret on the last line), `rise` or `pop` (word by word), `spread` (tracking in), `punch` or `reveal` (line by line). A `marked` line gets a marker sweep after the entrance. A color swap at `swapAtMs` flips ink and accent, with a two-frame flash in `snap`. The whole title leaves by any exit.
- `Counter`: a number punches in and counts to its value, stepped in `snap` and smooth in `glide`, with a prefix, a smaller suffix, a label typed when it lands and an optional giant outline ghost. The number keeps the width of its final value, so it does not jitter while counting.
- `CornerLabel`: a small label typed in a corner with chasing chevrons, the HUD of Higgsfield's cards.
- `Chevrons` (`remotion/accents`): three chevrons lit one after another.

`pnpm remotion:lab` also renders `runs/lab/type-lab.mp4`: a typed hook, a size and alignment hierarchy with rising words, tracking in, words popping one by one, a reveal with a marker, a punch with a color swap, a counter with a unit, a label and a ghost, and corner labels around a price count. Titles, counters and corner labels are document elements since step 7 (`title`, `counter`, `corner-label`): the build places them like other overlays, and over footage they are drawn white with the brand highlight as the accent and a soft shadow, on a soft dark shade that fades in and out with the text so it reads on a bright or busy shot. On the style's backdrop, with nothing filmed behind it, kinetic text is set 1.35 times larger. A counter counts and shows as many decimals as the plan writes, so a price of `$2.50` lands on 2.50. While a title is on screen the captions step aside (`src/video/captions/stepAside.ts`).

## Accents and textures

`src/video/remotion/accents` holds the shapes that carry rhythm and point at things. Each one reads the tempo, so `snap` flashes where `glide` wipes:

- `GrowFrame`: a frame grows from a point to the edges, thick at first, and the shot flashes the frame's color (Higgsfield).
- `FlashBlocks`: color blocks over a collage, two frames each in `snap`, wiped in and out in `glide`.
- `Burst` and `Sparkles`: rays that fly out from an ellipse around a rect and shrink as they go, four-point stars that pop in one by one and keep twinkling.
- `DrawnArrow`: a curved stroke drawn from tail to tip, its head opening when it arrives.
- `SelectionBox`: a design-tool selection drawn around a tag, corner handles popping in one by one (motionvid).
- `Scribble`: a hand-drawn circle that overshoots its start, or a wavy underline.
- `Cursor`: a pointer travels to a target and clicks, with a ring spreading from the tip.
- `CornerBrackets`: viewfinder brackets that close in on a subject.
- `Chevrons`: three chevrons lit one after another.
- Textures: `Grain` (film grain with a new seed every frame), `PaperGrid` (a faint grid with a vignette), `Halftone` (dots fading across the picture), `Blobs` (soft color fields drifting behind the content).

`pnpm remotion:lab` also renders `runs/lab/accent-lab.mp4`, nine demos over a still of `runs/face-v2` that `src/cli/labAssets.ts` prepares in `runs/lab/public`.

### Accents in the document

An overlay in the plan, and its element in the document, can carry an `accent`: what the mark says about it, not how it looks. The style draws it:

| Accent | Says | `bold-pop` | `clean-paper` |
| --- | --- | --- | --- |
| `celebrate` | a win, a result, something new | a burst | sparkles |
| `frame` | this one among several | a growing frame | a selection box |
| `focus` | the key phrase | viewfinder brackets | a hand-drawn circle |
| `stress` | the word or number the message turns on | flash blocks behind the text | a hand-drawn underline |

`Accented` in `src/video/remotion/accents/ElementAccent.tsx` wraps the element and measures the text it shows on the page: titles mark their rows, counters their number, unit and label, chips, stickers and lower thirds their label, each with `data-anchor`. The mark is drawn around those boxes every frame, so it follows wrapping, fitted sizes and a floating chip, and flash blocks go behind the text. It starts once the element has settled (a title's entrance has ended, a counter has landed, a label has popped in) and fades as the element starts to leave. Over footage it takes the highlight, on the backdrop the accent color. Quotes, title cards, lists and corner labels take no accent. The director puts at most one accent on a beat, two to six a minute.

## Media

`src/video/remotion/media` moves photos, clips, documents and screens:

- `Collage`: photos land one per frame along a staircase or scattered at small angles (Higgsfield).
- `Flicker`: a burst of shots, hard cuts two frames apart in `snap`, quick crossfades in `glide`.
- `ThumbToPlayer`: a tile grows into a player, and the player chrome appears when it lands: chevrons, a progress bar, a timecode.
- `PhoneFrame`: a phone swings in from a turn in perspective, its screen holding a clip or a picture.
- `NamedGrid`: a grid waits in grey, and each cell turns to color with a typed label when the speaker names it; the latest one is outlined (motionvid's talking-head reel).
- `FocusCard`: the camera moves into one detail of a document or a screen, the rest dims, and the camera pulls back.
- `Flip`: a card turns edge-on and comes back showing its other side.

Cut-out figures need background removal, a service decision that is still open. `pnpm remotion:lab` also renders `runs/lab/media-lab.mp4`, seven demos over frames and a clip of `runs/face-v2`.

## Transitions

A scene enters by its `transition` and the scene before it leaves by the same one, each over half the transition, so scenes never overlap and the timing stays on the speech (`src/video/motion/transitions.ts`, `src/video/remotion/motion/SceneTransition.tsx`):

- `cut`: nothing.
- `flash`: a white flash, two frames on each side of the cut in `snap`, a quick dip to white in `glide`.
- `wipe`: a dark panel grows from the left over the old scene and leaves past the right over the new one, an accent line on its moving edge (motionvid).
- `whip`: the old scene flies left with a horizontal smear, the new one arrives from the right, so the cut frame is a blur and never empty.
- `zoom`: the old scene zooms in and blurs, the new one settles from a closer zoom.
- `pixelate`: the old scene breaks into growing blocks and the new one resolves from them, through an SVG filter that needs no GPU.
- `dip`: a fade through the dark brand color.

The build writes the transition each beat names, `cut` by default. `pnpm remotion:lab` also renders `runs/lab/transition-lab.mp4`, a before and after shot of `runs/face-v2` through each transition.

## Styles

A style is the look of a whole video, kept as data in `src/video/styles.ts`: a name and a summary for the director, a tempo, the display face and its case, the tones (background, ink, surface, muted and a default highlight), the textures, and the caption presets, transitions and title entrances it draws from, how it draws each accent, and its flourishes (corner chevrons and ghost numbers in `bold-pop`, a cursor in `clean-paper`). The register keeps the pacing (scene length, holds, density); the style decides how it looks.

- `bold-pop`, after Higgsfield: Unbounded in capitals on off-white with drifting color fields and grain, `snap`; captions `bold-center`, `keyword-box`, `pop`, `outline`; transitions flash, whip, pixelate, zoom; titles typed, punched, tracked in or popped; accents as bursts, growing frames, brackets and flash blocks.
- `clean-paper`, after motionvid: Inter in sentence case on warm paper with a faint grid, `glide`; captions `keyword-box`, `karaoke-pill`, `marker`, `typewriter`, `minimal`; transitions wipe, dip, zoom; titles rising, typed or revealed; accents as sparkles, selection boxes, circles and underlines.

The brand gives the colors (`src/video/style/palette.ts`): the first brand color that is not near white becomes the accent, darkened until it reads at 3:1 on the background; a light brand color becomes the highlight, or the style's own; another dark brand color, or a deeper accent, becomes the second tone. `styleKit` in `src/video/remotion/style` folds the style, the brand palette, the display face and the brand's text face together, and `Backdrop` draws the background with the style's textures.

Every document element draws in the style. A style's surfaces decide the rest: `bold-pop` has dark panels and block labels (flat highlight slabs in the display face, capitals, a hard offset shadow), `clean-paper` has light panels and soft labels (white pills with a soft shadow and an accent badge). Chips, stickers and lower thirds are labels; title cards and lists sit on panels; quotes and kinetic text are white with a shadow over footage and ink on the backdrop; a headline is drawn as a kinetic title and a big number as a counter when it starts with a number; a document shown in a card sits on the style's backdrop; wipes and dips take their colors from the style. The layout sizes a chip for the style's face: `display.labelScale` sets its text size and `display.widthScale` how much wider the face runs than the layout's estimate, measured in the renderer (Unbounded capitals up to 1.55 times, drawn at 0.85 of the size since capitals read larger; Inter about 1). A chip wraps onto two lines at word boundaries and never breaks a word; a sticker is as wide as its text. A label still shrinks to fit its box if a line runs long. On a backdrop labels are set larger, like kinetic text, and gather around the middle of the frame in the order they arrive; a lower third there centers its lines.

`pnpm render:plan fixtures/plan.vocabulary.json --out runs/vocab-bold --style bold-pop` builds a text-mode plan that holds every element kind, checks it and renders it locally; `--style` moves any plan to another style. `pnpm remotion:styles` renders a 14-second spot in both styles side by side with the brand colors of `runs/face-v2`: a hook, a counter, a collage with a tag, the footage with the style's captions, a call to action, joined by the style's transitions. Since step 7 the plan and the document carry a `style`; the director picks it from the summaries above, and every beat names the transition it enters by.

## Compositions

A composition is how a beat without footage fills the frame. The director names one per beat (`composition` in the plan); `src/video/layout/compositions.ts` turns it into boxes for the lead text and the labels and into color fields that the scene draws under them (`fields` in the document).

| Composition | The frame | A second one in the same video |
| --- | --- | --- |
| `center` | the title in the middle, labels gathered around it; the default, so older plans render as before | the same |
| `fill` | the title's lines as wide as the text area and spread over its height, alternating edges | the frame turns dark |
| `split` | an accent field over the top half holds the title, the labels stack on the other half | the field moves to the bottom |
| `giant-number` | a counter as wide as the text area allows, whole in the frame, the label under it | it sits on an accent field |
| `column` | a dark band down the left edge, the title flush against it, labels under the title | the band takes the accent |
| `grid` | up to four chips or stickers become tiles in the palette's colors, each coming and going with its label, under a short title | the tile colors shift by one |

The lead is the beat's first title, headline, counter or big number; chips and stickers are its labels, stacked flush left in the order they arrive, and the ones that do not fit are left for a free spot; a corner label takes the top line of the text area. Anything else finds a free spot off the fields. Text that fills its box ignores the line sizes the director wrote and is set left; text on a field takes the colors that read on it, ink or white and the first palette color with a 3:1 contrast, and so do the accents drawn around it. A label on its own tile drops its background. A field sweeps in from an edge over two moves of the style's tempo; a tile that leaves before its scene ends sweeps on. Two beats in a row without footage never share a composition: the plan check rejects it, and the director's prompt asks for at least three in a video and `center` for at most one beat in three.

`pnpm render:plan fixtures/plan.compositions.json --out runs/composition-lab/bold-pop --style bold-pop` renders every family twice, the second time in its other form; `--style clean-paper` renders the same plan in the other style.

## Captions

A caption style is a preset of one caption look (`src/video/captions/looks.ts`), and one renderer draws every look (`src/video/remotion/captions`). The look sets:

- how many words a page holds: one or two, three, four, or a line;
- letter case, weight, size and place (the caption band at the bottom or a band in the middle);
- how a word enters when it is said: pop, rise, fade, typed letter by letter, thickening from light to heavy, or filling an outline;
- what an unsaid word does: not there yet, hidden in its place, dim or shown;
- the mark on the word being said: color, an accent pill or a scale;
- the mark on a keyword: color, an accent box that sweeps under the word and turns it dark where it has passed, a marker, or italics;
- the backing: a text shadow, a scrim at the bottom, or a dark or light pill under each line;
- the font: the brand font or a serif.

The size shrinks to fit the longest word into the band. Text on an accent box or pill takes a color picked for contrast.

| Preset | What it looks like |
| --- | --- |
| `rail` | a short phrase, words rise as they are said, unsaid words dim, keywords in the accent color, a scrim |
| `keyword-box` | three words in heavy capitals, each pops in as it is said, keywords in an accent box |
| `bold-center` | one or two huge words in the middle of the frame |
| `pop` | three words in capitals, the word being said grows |
| `karaoke` | a line, the word being said in the accent color |
| `karaoke-pill` | a line, an accent pill under the word being said |
| `box` | a line on a dark rounded pill |
| `minimal` | one lowercase line in a light weight |
| `weight-shift` | words thicken from light to heavy as they are said |
| `marker` | keywords get a marker sweep |
| `typewriter` | a line typed letter by letter on a white pill that grows with the text |
| `editorial` | a serif line with keywords in italics |
| `outline` | outlined capitals that fill as they are said |

`pnpm remotion:captions` cuts nine seconds of `runs/face-v2`, takes its transcript and keywords, and renders every preset over it to `runs/lab/caption-lab.mp4`, locally and without the API.

## Catalog

The catalog is an internal page where every primitive plays in every register and format. It is the map of the vocabulary, the base for visual tests and later a public showcase. A new primitive without a catalog card is not done. The catalog does not exist yet and arrives in stage 1.

The watermark for the Free plan is also a primitive. Its design is up to the owner.

## Next iteration: the vocabulary base

The reference is Higgsfield for motion (bold kinetic type, fast collage, shapes and counters, hard cuts) and motionvid for the use cases (business and product ads, launches, explainers, YouTube and talking-head reels). The hand-made Synevo reel in `video-editing/synevo` is no longer the bar. The work starts from motion: how elements appear, leave and transform.

### What the references do

A frame-by-frame breakdown of the owner's screen recordings of 2026-10-30, kept in `runs/references/`.

Higgsfield, the Kling 4.0 card:

- Moves take 2–4 frames at 30 fps and are followed by holds of 0.5–1.5 s; the contrast between snap and stillness is the energy.
- Text types on one letter per frame ("KL", "KLI", "KLIN", "KLING"), counters roll in three slots one after another (10, 20, 30), words slide up from under the frame edge.
- Text transforms instead of leaving: "4K" splits so the 4 and the K frame the face, a giant "10" shrinks into place, a three-line title collapses into one small line, colors swap from pink to blue for two frames.
- Shapes carry the rhythm: blinking chevrons, a pink frame that grows from the center to the frame edge, solid squares flashing over images, giant outline numerals in the background.
- Collage: small photos appear one per frame in a staircase or scattered, tinted pink or halftoned; a one- or two-frame flash insert of another image; a pixel mosaic that resolves into the shot.
- A thumbnail in the collage grows into a video player, and the player leaves skewed in perspective while the next word pushes in.
- Hot pink, black and neon lime on off-white with pastel blobs; a squared display face.

motionvid, a startup launch, a feature announcement and a talking-head reel:

- Moves take 200–400 ms, something is always in motion, and changes follow the voice.
- Shapes morph into content: an empty input box collapses into a pill that widens to reveal the product name, then a burst of lines and sparkles; a label smears in from the side with motion blur.
- Typing with a caret at about ten characters a second; as "Paid monthly." types, three calendar cards flip one by one from "1" to a green "Paid".
- The camera moves into a detail of a UI card while the rest fades; a dark panel wipes across to the next scene.
- Talking-head reel: the speaker in the lower half on paper, the upper half changes with each phrase: b-roll with stamped labels, a 2×2 grid where the cell for the word being said turns to color while the others stay grey, a cut-out figure with highlighted muscles and an arrow drawn toward them. Captions show two or three words with the keyword in a colored box.
- Every example names its style (Sticker Launch, Warm Paper, Floating Dark UI, Apple, Sketchbook, Vox, Bold Caption): thick outlines and paper grain, or clean UI on light grey.

### Order of work

Each step ends with a render the owner reviews.

1. Motion system: moves to enter, leave, transform and stay alive, timed by the style (fast like Higgsfield, smooth like motionvid), and choreography: stagger, sync to spoken words, sync to the music beat. A motion lab composition plays every move in both styles. Built on 2026-10-30, except the sync to words and to the beat.
2. Kinetic type: letter type-on, word by word, rolling counters, split, color swap, a punch from giant size, outline numerals, captions with boxed keywords. Built on 2026-10-30: titles, counters, corner labels and `keyword-box` captions.
3. Shapes and accents: chevrons, growing frames, flash squares, bursts and sparkles, drawn arrows, selection handles, grain, grid and halftone textures. Built on 2026-10-30, with scribbles, a cursor, viewfinder brackets and drifting color fields; the pixel mosaic is still to do.
4. Media: photo collage, a thumbnail that becomes a player, a grid that lights the cell being named, UI cards with a camera into a detail, flipping states, cut-out figures (background removal). Built on 2026-10-30 with a burst of shots and a phone frame, except the cut-out figures.
5. Transitions: cut, flash cut, panel wipe, perspective push, zoom into a detail, mosaic resolve, dissolve. Built on 2026-10-30 as cut, flash, wipe, whip, zoom, pixelate and dip; a dissolve would need scenes to overlap and is left out.
6. Styles: one like Higgsfield and one like motionvid first, each with its own cadence, curves and accent budget. Built on 2026-10-30 as `bold-pop` and `clean-paper`, with the palette taken from the brand.
7. The director and the build use them on `runs/face-v2` and on a text-mode ad, compared with the reference clips. Built on 2026-10-30 for styles, transitions, titles, counters and corner labels, checked on `runs/face-v2` with a hand-written plan; accents in the document built on 2026-10-31; media in the document is next. The final runs on 2026-10-31 used four free stock clips (a NASA explainer with a speaker and B-roll, a Mixkit donut, barista and smart-light app) and four text-only ads, with the director and the frame notes written in the session: they brought the shade behind text over footage, framing on the subject, wide products in a card, exact keyframes and a QA warning for overlays left out.
8. The sound-effect layer, synced to the moves.
9. The library keeps growing, with no fixed ceiling: more accents, marks, title entrances, transitions, media pieces, textures and styles. The owner brings references (a link or a screen recording); each one is kept in `runs/references/`, broken down frame by frame and built through the `vocab` skill, ending with a render the owner reviews. This track starts after the final runs on stock clips and text-only videos and runs alongside the later stages.

### Gaps noted after the design spike

Most of them fold into the steps above:

- Typography: a brand font with weights 600–900, a size scale per element, line spacing; fonts self-hosted.
- Icons and symbols: badge icons in chips, animated SVG symbols (a crossed wheat, a red cross) with stroke reveals and a shake.
- Accent cards: a pull-quote card with a marker highlight, a ring pulse and a shine.
- Status plate: a lower third with status pills ("strict · lifelong").
- Document camera: a camera that moves over a document in a card with highlighted rows.
- Intro title: two masked lines with the subject cut out in front, needs background removal.
- After the final runs: a list made for the backdrop (the list panel is a side sheet beside a filmed subject); a card cropped to the subject instead of the whole frame; music tracks and the sound-effect layer (the runs are silent); captions that keep clear of text burned into an edited source; QA warnings fed back to the director.
- B-roll inserts with a slow zoom, and music ducked under the voice.
- A catalog (Storybook-like) that shows every element in every register and format, with the director's prompt generated from it.
- Caption styles beyond the rail: a line-level box, and the owner's note that word-per-box looks odd.

Each step is checked on the same run: delete `video.json`, `qa.json`, `render.json` and `out.mp4` in `runs/face-v2`, then `pnpm spike runs/inputs/face.mp4 --run face-v2 --resume --render local`, and compare it with the reference clips.

### Variety across videos

The owner's verdict on the final runs of 2026-10-31: each video works, but they all look alike, and a user would see the template after about eleven of them. The library needs many more elements, animations and techniques. The NASA explainer held up best, because its footage brings the variety; the text-only ads, where the frame is only our graphics, show the sameness most.

A contact sheet of one frame per beat of the four text-only ads (`runs/final/text-contact-sheet.jpg`, 22 frames) shows where it comes from:

- Color: the same blue accent in every video, since none had a brand and the default palette applied.
- Composition: small type centered in the middle third, about two thirds of every frame empty.
- Background: two in all, one per style.
- Elements: titles and chips make 42 of the 58 overlays.
- Motion: plain cuts join 29 of the 47 beats, and the camera never moves on the backdrop.

The owner chose on 2026-10-31 to start with compositions and color; more complete styles come after them, and the owner's references are built alongside as they arrive (see the [decision log](/product/decisions)). Styles first was turned down because the centered type would stay inside each video and every new element would have to be drawn in every style; one reference at a time, because the sameness would stay for a long time.

A composition is how a beat on the backdrop fills the frame: where the type sits and how large it is, and which color fields cut the frame. The director names one per beat, and the build turns it into element boxes and fields. The plan:

1. The first five families: `fill` (the title fills the frame), `split` (a color field over half the frame, the title on it), `giant-number` (a counter as wide as the frame allows), `column` (a color band at the edge, the type flush against it) and `grid` (chips as colored tiles). `center` stays as today's layout and the default, so older plans render unchanged. Text on a field takes colors that read on it, and neighbouring beats never repeat a composition. Checked on a composition lab in both styles and on the four text-only ads planned again, as a contact sheet beside the old one. Built on 2026-10-31, see [Compositions](#compositions); the owner has not reviewed it yet. Building it turned up that every render measured text before its fonts had loaded, so `bold-pop` titles ran wider than their box; renders now wait for the fonts.
2. Five more families (bands, a diagonal cut, an inset card, a corner stack, a word repeated in outline) and palettes for videos without a brand.
3. Six to eight new backgrounds and a camera that moves over the backdrop.
4. No repeats across one user's videos: the director's brief lists the compositions and palettes of the user's recent videos. Checked on a contact sheet of twelve videos that must not read as one template.
5. New blocks: a price tag, a checklist, a rating, before and after, steps.
