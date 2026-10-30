# Vocabulary

Summary of section 6 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

The vocabulary is a set of React components on Remotion that take their parameters from the video document. A scene is a composition of primitives, not a template with fields. The model picks words from the vocabulary and the engine assembles the frame.

## Minimum for the first version

| Category | Primitives |
| --- | --- |
| Footage | trimmed video clip, background footage, image, logo, shape, Lottie |
| Camera | push, punch-in, pan, parallax over an image or screenshot |
| Text | headline, subheading, big number with a counter, quote, lower third, chip (paper pill sized to its text, optional badge such as Fe or 01, pops in with a blur and floats), sticker, title-card (section label and a big title on a dark panel), list (title and numbered items on a dark side panel) |
| Captions | rail (a short phrase whose words appear as they are said, keywords in the accent color, a scrim below), keyword-box (three words at a time in heavy capitals, each word pops in as it is said, a keyword gets an accent box that sweeps under it and turns its text dark only where the box has passed, text color picked for contrast with the box), karaoke, box and pop styles |
| Enters and exits | fade, slide, mask, by word, by letter, typewriter |
| Accents | marker, underline, ring, pulse, shake, flash |
| Transitions | cut, fade, slide, wipe, push |
| Backgrounds | color, gradient, brand, blurred footage |
| Audio | music ducked under the voice, voice, loudness normalization |
| Layout | per beat: free (chips float beside the subject in slots with keep-out zones), panel-top (a title card over the top 46%, the footage zooms and slides so the face sits below), panel-side (a list over one side, the face moves to the other); over a document or screen card the top panel is a short title strip and a headline becomes that strip; safe zones per destination with a 4% gutter |

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
- **Remotion side** (`remotion/motion`): `Move` wraps an element in its pose, with a mask for `rise` and `sink` that leaves room for ascenders and descenders, and an SVG blur along x for `smear`; `TypeOn` types text with a caret.
- **Motion lab**: `pnpm remotion:lab` renders `runs/lab/motion-lab.mp4`, ten demos with both tempos side by side: type on, rise, punch and count, pop with stagger and float, smear with chevrons, reveal with a color swap and a tilt out, a box that morphs into a name with a burst, a split that frames the subject, flips one by one, and a collage tile that grows into the frame.

The register of a video picks its tempo: `driving-launch` and `playful-sale` move in `snap`, `serious-clinical` and `rich-premium` in `glide`. The document primitives move through `ElementBox`: chips and stickers pop in, float and collapse, the other elements lift in and fade out, and every exit ends exactly at the element's `exitMs`.

## Kinetic type

`src/video/type/schedule.ts` times a title: when each line and word starts for an entrance, and when the whole entrance ends. `src/video/remotion/type` draws it:

- `KineticTitle`: lines with a size (`xl`, `l`, `m`, `s`, fitted to the width), a tone (`ink`, `accent`, `alt`) and an alignment. The title enters by `type` (letter by letter, a caret on the last line), `rise` or `pop` (word by word), `spread` (tracking in), `punch` or `reveal` (line by line). A `marked` line gets a marker sweep after the entrance. A color swap at `swapAtMs` flips ink and accent, with a two-frame flash in `snap`. The whole title leaves by any exit.
- `Counter`: a number punches in and counts to its value, stepped in `snap` and smooth in `glide`, with a prefix, a smaller suffix, a label typed when it lands and an optional giant outline ghost. The number keeps the width of its final value, so it does not jitter while counting.
- `CornerLabel`: a small label typed in a corner with chasing chevrons, the HUD of Higgsfield's cards.
- `Chevrons` (`remotion/accents`): three chevrons lit one after another.

`pnpm remotion:lab` also renders `runs/lab/type-lab.mp4`: a typed hook, a size and alignment hierarchy with rising words, tracking in, words popping one by one, a reveal with a marker, a punch with a color swap, a counter with a unit, a label and a ghost, and corner labels around a price count. These components join the video document in step 7, when the director learns them.

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
3. Shapes and accents: chevrons, growing frames, flash squares, bursts and sparkles, drawn arrows, selection handles, grain, grid and halftone textures.
4. Media: photo collage, a thumbnail that becomes a player, a grid that lights the cell being named, UI cards with a camera into a detail, flipping states, cut-out figures (background removal).
5. Transitions: cut, flash cut, panel wipe, perspective push, zoom into a detail, mosaic resolve, dissolve.
6. Styles: one like Higgsfield and one like motionvid first, each with its own cadence, curves and accent budget.
7. The director and the build use them on `runs/face-v2` and on a text-mode ad, compared with the reference clips.
8. The sound-effect layer, synced to the moves.

### Gaps noted after the design spike

Most of them fold into the steps above:

- Typography: a brand font with weights 600–900, a size scale per element, line spacing; fonts self-hosted.
- Icons and symbols: badge icons in chips, animated SVG symbols (a crossed wheat, a red cross) with stroke reveals and a shake.
- Accent cards: a pull-quote card with a marker highlight, a ring pulse and a shine.
- Status plate: a lower third with status pills ("strict · lifelong").
- Document camera: a camera that moves over a document in a card with highlighted rows.
- Intro title: two masked lines with the subject cut out in front, needs background removal.
- B-roll inserts with a slow zoom, and music ducked under the voice.
- A catalog (Storybook-like) that shows every element in every register and format, with the director's prompt generated from it.
- Caption styles beyond the rail: a line-level box, and the owner's note that word-per-box looks odd.

Each step is checked on the same run: delete `video.json`, `qa.json`, `render.json` and `out.mp4` in `runs/face-v2`, then `pnpm spike runs/inputs/face.mp4 --run face-v2 --resume --render local`, and compare it with the reference clips.
