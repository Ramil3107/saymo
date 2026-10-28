# Screens

Twenty screens in six flows. For each one: why it exists, what is on it, what each element does and what matters when building it. The pictures are in `screens/png/`, the markup is in `screens/html/`, and the files are named by screen number.

The texts on the screens are working texts and can be edited. Anything in square brackets is a placeholder.

---

## 1. Sign-in and setup

### 1.1 Landing

**Purpose.** The first page for a new person: what this is, how it works, how much it costs.

**What is on the screen, top to bottom:**
1. Header: the logo; the links Examples and Pricing (scroll to the sections), Sign in; the Start free button.
2. First screen: the sticker "No timeline. No layers.", the Hero heading "Say it. Get a motion video.", a subheading, the buttons Start free and See examples, the line "2 free videos every month."
3. A fan of five example frames (decorative).
4. "Three steps, no editing skills." Three cards: Describe it, Pick a take, Point and fix.
5. "Launches, sales, stories, numbers." A grid of six examples with labels.
6. "Start free. Go Pro when it sticks." The Free and Pro plan cards.
7. The final call to action "What are we making today?" and Start free.
8. Footer: "© 2026 [name]", Terms, Privacy, Contact.

**Actions.** Start free, Sign in, any example and the plan buttons go to 1.2. See examples and Examples scroll to the examples, and Pricing scrolls to the plans.

**Notes.** The example frames are drawn with shapes. In the live product, real videos should play in their place: this is the main argument of the page.

### 1.2 Sign in

**Purpose.** Sign-in and sign-up on one screen, with no password.

**What is on the screen.** Left: the sticker "No password needed", the heading "Sign in and start making.", the Continue with Google button, the divider "or", the Work email field, the Email me a link button, a line about Terms and Privacy Policy. Right: three tilted example frames.

**Actions.** Continue with Google signs in and goes to 2.1. Email me a link sends an email and goes to 1.3.

**Notes.** There is no separate sign-up: the first sign-in creates the account. Error states (invalid email, Google canceled) are not drawn.

### 1.3 Check your email

**Purpose.** To say that the email has been sent, and what to do next.

**What is on the screen.** A mockup of the email (a white card "Your sign-in link" with a Sign in button, tilted, a picture only), the heading "Check your inbox.", text with the address in bold, the Resend link button, the Use a different email link, a hint about spam.

**Actions.** Resend link sends the email again. Use a different email goes back to 1.2. The link in the email opens 2.1.

**Notes.** Not drawn: the confirmation that the email was sent again, and a restriction on frequent resends.

### 1.4 Brand setup

**Purpose.** To set the logo, colors and font once, so that all videos come out in the style of the brand.

**What is on the screen.** The heading "Your brand" and "Set it once. Every video comes out in this style." On the left, a form:
- Start from your website: an address field and the Fetch brand button, the note "Nothing is saved until you confirm".
- Logo: an empty square and the Upload PNG or SVG button.
- Colours, up to three: three color buttons with hex.
- Font: a dropdown list (Onest, Manrope, Unbounded as examples).
- Save brand and the line "One brand per account for now."

On the right, Preview: a video frame in the chosen style and the label "This is how your videos will look."

**Actions.** Fetch brand fills the form from the website. Pressing a color opens a color picker (not drawn). Save brand saves and goes to 2.1.

**Notes.** The preview updates at once on any change. Not drawn: the Fetch brand result with a check of what was found, the error "could not read the website", the logo upload. A brand is not required: without it, videos are made in a neutral style.

---

## 2. Make a video

### 2.1 Home

**Purpose.** The main screen: say what video is needed, or pick an example.

**What is on the screen.**
1. App bar.
2. The sticker "No timeline. No layers.", the Display heading "What are we making today?", a subheading.
3. Prompt card: the label "What the video is about", a two-line field with an example in the placeholder, the chips Link, Existing video, Podcast, the picker "9:16, 15 sec", the Make the video button.
4. "Or start from an example" and six examples: Product launch, Sale, Customer story, By the numbers, How it works, Podcast clip.
5. The counter "14 of 20 videos left this month. Edits are included."

**Actions.**

| Element | What happens |
| --- | --- |
| Make the video | Starts generation and goes to 2.2. If no videos are left: the 6.1 modal |
| Link | Add a link to a website or a product page (how exactly is not drawn) |
| Existing video | Upload your own video, goes to 3.1 after the upload |
| Podcast | Upload a recording, goes to 3.2 after the analysis |
| 9:16, 15 sec | Choice of format (9:16, 1:1, 16:9) and length (10, 15, 30 s), the menu is not drawn |
| Example | Puts a template for this scenario into the field |

**Notes.** An empty field with a placeholder is the normal initial state. With no text in the field, the button must either be disabled or ask the user to fill it in; not decided.

### 2.2 Generating

**Purpose.** To show that the video is being put together, and not to keep the person on the screen.

**What is on the screen.** The Task bar with the title of the video and the line "Saving to My videos". On the stage there are three variant slots: Version 1 ready (a frame, the label Ready), Version 2 in progress (a skeleton, "Laying out scenes"), Version 3 queued (an empty dashed frame, "Up next"). Below, the heading "Rolling. Three takes coming up.", progress, step chips (Script written, Scenes laid out: done; Checking that text fits: now; Preview: upcoming) and the line "You can leave this page. The video will be waiting in My videos."

**Actions.** A ready variant is clickable and opens 2.4 without waiting for the others. The back arrow goes to 2.1, and generation continues.

**Notes.** The step names are an example. If generation fails, we show 2.3.

### 2.3 Generation failed

**Purpose.** To say honestly that it did not work, and to offer a way out.

**What is on the screen.** A hatched frame with a warning icon, the heading "Cut. Something broke on set.", the text "It doesn't count toward your limit, so trying again is free.", the buttons Try again and Change the description, the line "ref [error id] · still stuck? [support email]".

**Actions.** Try again starts generation again and goes to 2.2. Change the description goes to 2.1 with the text kept.

**Notes.** A failed generation does not count toward the limit. This is a product rule, and the logic has to follow it.

### 2.4 Video and edits

**Purpose.** The main working screen: pick a variant, adjust it in words, download.

**What is on the screen.**
1. Task bar: back, the title of the video; on the right Send for review and Download.
2. The stage, left to right:
   - Versions: three mini frames, the selected one is outlined in the accent color.
   - The 9:16 video frame. The selected element (the headline in the mockup) is outlined in the accent color.
   - Edit panel: the name of the selected element ("Headline") and a button to clear the selection; the field "What should change?" with a send button; the quick edits Bigger, Rewrite, Change font, Remove; the hint "Click anything in the video and say what to do with it."
3. Player bar: Play, a slider, the time "0:06 / 0:15", the formats 9:16, 1:1, 16:9, the Editor link.
4. What next: Add captions, Make a square version, Trim to 10 seconds, Three more versions.

**Actions.**

| Element | What happens |
| --- | --- |
| A mini frame in Versions | Switches the variant |
| Click on an element in the frame | Selects it, and the Edit panel shows this element |
| Edit composer + send | Edits the selected element in words; with no selection, edits the whole video |
| Quick edit | The same as writing it in words |
| Format 9:16, 1:1, 16:9 | The service reflows the frame to the format by itself |
| What next | Ready-made next steps. They work like an edit in words |
| Editor | The manual editor, 2.5 |
| Download | The 4.1 modal |
| Send for review | The 4.2 modal |

**Notes.**
- This is the main gesture of the product: "point at the frame and say what to change". It has to work fast and predictably.
- Edits do not count toward the video limit, but a video has an edit cap (see the project handoff).
- Not drawn: Undo after an edit, the "edit is being applied" state, the state with no selection, selection of the logo, the background, the button, the music.

### 2.5 Manual editor

**Purpose.** For those who find edits in words not enough: to reorder, shorten and rewrite scenes by hand.

**What is on the screen.** The Task bar with the title "Editor" and the Done button. On the left, a preview of the frame. On the right, the properties of the selected scene "Scene 2. Headline": Text, Duration seconds, Text entrance (Fade in, Slide up, Letter by letter), Transition to the next scene (Cut, Fade, Slide) and the hint "Only scene order, length and text live here…". At the bottom, a panel: Play, the time, Split, Duplicate, Delete, + Scene, a hint about dragging; the timeline with a ruler, the tracks Scenes (Intro 2.0 s, Headline 4.0 s: selected, How it works 5.0 s, Call to action 4.0 s), Voice and Music, and the playhead.

**Actions.** Drag a scene to change the order. Pull an edge to change the length. Click a scene to select it, and its properties show on the right. Done and the back arrow go to 2.4 with the changes saved.

**Notes.** There are no layers, keyframes or effects here, on purpose. Everything else is done in words on 2.4.

---

## 3. From your own material

### 3.1 Add graphics to a video

**Purpose.** The person has uploaded a finished video. The service itself suggests where to add graphics, and the person accepts or not.

**What is on the screen.** The Task bar: "Add graphics", the file name "interview.mp4"; on the right Skip all and Apply 3 graphics. On the left, a 16:9 frame "Your video" with a suggested name plate (`[speaker name]`, `[role, company]`), which is selected. Under it, the player with marker dots on the slider and the time "0:02 / 0:48". On the right, the list "4 places for graphics" with a description and four rows: Name title (0:02), Big number (0:09), Key phrase (0:17), Captions (All). At the bottom, Suggest more.

**Actions.** Each row has "accept" and "skip". Clicking a row selects it and moves the video to that place. Apply N graphics applies the accepted ones and goes to 2.4. Skip all declines all of them. Suggest more asks for more suggestions.

**Notes.** In the mockup three suggestions are accepted and captions are not, so the button says "Apply 3 graphics": the number on the button equals the number of accepted ones. The upload and the analysis of the video before this screen are not drawn.

### 3.2 Podcast clips

**Purpose.** To make short clips with captions from a long recording of a conversation.

**What is on the screen.** The Task bar: "Podcast clips", "episode-12.mp3 · 42:18", on the right Make 3 clips. On the left: "5 moments worth clipping", the waveform of the whole recording with five numbered markers, the time ruler; below, five clip cards (01–05) with a mini preview, a quote, the time and the Keep or Skip tag. On the right, Clip settings: Clip length (15 s, 30 s, 60 s), Format (9:16, 1:1), Captions (a switch), Speaker names (a field), the hint "Tap a clip to keep or skip it."

**Actions.** Pressing a card toggles Keep/Skip, and the number on the main button changes. Make N clips starts generation (2.2).

**Notes.** How many videos from the limit a batch of clips costs is not decided. The upload and the analysis of the recording are not drawn.

---

## 4. Download and send

### 4.1 Download (modal over 2.4)

**Purpose.** To choose formats and get the files.

**What is in the modal.** The heading "Download" and a description; Formats: the chips 9:16, 1:1 (selected), 16:9; Quality: 1080p or 720p; Files: the rows of ready files, "9:16 · 1080p · MP4" with the Save button and "1:1 · 1080p · MP4 · rendering" with a percentage and progress; the line "Rendering keeps going if you close this. We'll email you when it's done."

**Actions.** Choosing a format adds a file row, and the file starts rendering. Save downloads the MP4. Closing returns to 2.4, and rendering continues.

**Notes.** 1080p is Pro only. How choosing 1080p looks on Free (locked, does it go to the plans?) is not drawn.

### 4.2 Send for review (modal over 2.4)

**Purpose.** To let a colleague or a client watch the video without signing in.

**What is in the modal.** The heading and "Anyone with the link can watch. Nobody can edit."; the row "Link is on" with a switch; a field with the link and the Copy link button; Open the review page; the line "Comments come later."

**Actions.** The switch turns the link on and off. Copy link copies it (the notification is not drawn). Open the review page opens 4.3.

### 4.3 Review link

**Purpose.** The public page of the video, for whoever received the link.

**What is on the screen.** The logo and the "View only" tag; the title of the video, the line "9:16 · 0:15 · shared by [sender name]"; the frame; the player; "Made with [name]" and the Make your own button.

**Actions.** Make your own goes to 1.1. People without an account see this page, so it also brings in new users.

**Notes.** Not drawn: a link that is turned off or does not exist.

---

## 5. Library and account

### 5.1 My videos

**Purpose.** All videos in one place.

**What is on the screen.** The App bar, the heading "My videos", the filters All, 9:16, 1:1, 16:9; a grid: the New video tile and video cards (a frame, a title, "format · length · date"); the line "14 of 20 videos left this month. See plans".

**Actions.** New video goes to 2.1. A video card goes to 2.4. See plans goes to 6.2. The filters leave only the videos of the needed format.

**Notes.** Not drawn: rename, duplicate, delete, loading skeletons, a video that is being generated.

### 5.2 My videos, empty

**Purpose.** The first visit, there are no videos yet.

**What is on the screen.** A dashed frame, the sticker "Nothing here yet", the heading "Your first video is one sentence away.", the Make a video button, "or start from an example" and three examples; the line "2 free videos this month. See plans".

**Actions.** Make a video and the examples go to 2.1. See plans goes to 6.2.

### 5.3 Account

**Purpose.** Profile, plan, brand, account deletion.

**What is on the screen.** Four cards:
- Profile: an avatar, a name, an email, "Signed in with Google", Sign out.
- Plan: "Pro", "Renews on [date]", the progress "6 of 20 videos used this month", Change plan, Billing and receipts.
- Brand: the colors and the font of the brand, Edit brand.
- Delete account: a description and a button.

**Actions.** Sign out goes to 1.2. Change plan goes to 6.2. Billing and receipts shows the payment history at the payment service. Edit brand goes to 1.4. Delete account asks for confirmation (not drawn).

---

## 6. Plans and payment

### 6.1 Limit reached (modal over 2.1)

**Purpose.** The person pressed Make the video, but no videos are left this month.

**What is in the modal.** The sticker "That's a wrap", the heading "You've used both free videos this month.", text about Pro and the renewal date, progress 2 / 2, the buttons Go Pro and Not now, a close button.

**Actions.** Go Pro goes to 6.2. Not now and closing go back to 2.1, and the text that was entered is not lost.

**Notes.** The text in the mockup is for the Free plan. For Pro, when the 20 videos have run out, a different text is needed, and it is not drawn.

### 6.2 Plans

**Purpose.** To compare the plans and move to Pro.

**What is on the screen.** The tag "2 of 2 free videos used this month", the heading "Keep the camera rolling.", the line "One video is one press of Make the video. Edits never count." Two cards: Free ($0; 2 videos a month; Watermark on export; 720p; Videos kept for 30 days; the disabled button Your current plan) and Pro ($[price] a month; 20 videos a month; No watermark; 1080p; Videos kept while you subscribe; the Go Pro button). The line "Cancel any time in one click. Access stays until the end of the paid month."

**Actions.** Go Pro goes to payment at the payment service (its page is not drawn), and after a successful payment to 6.3.

### 6.3 Welcome to Pro

**Purpose.** To confirm the payment and get the person back to work.

**What is on the screen.** A large sticker "PRO", the heading "You're Pro now.", "Receipt sent to you@company.com. Here's what changed.", three cards (20 videos a month, No watermark, 1080p), the buttons Make a video and Manage billing.

**Actions.** Make a video goes to 2.1. Manage billing goes to 5.3.

---

## Foundations

A separate board with all the design values: `foundations.png`, `screens/html/foundations.html`; as text, `foundations.md`.
