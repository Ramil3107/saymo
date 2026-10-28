# First version: what is included

The main scenario: **describe the video → pick one of three variants → fix it with words → download.**

Screens and the behavior of each element are described in detail in `design/screens.md`. Here are the product rules.

## Creating a video

- One field "What the video is about". You can add a link to a website or a product page: the service will take the text and images from there.
- Format and length: 9:16 and 15 seconds by default. The choices are 9:16, 1:1, 16:9 and 10, 15, 30 seconds.
- Six examples to start with: Product launch, Sale, Customer story, By the numbers, How it works, Podcast clip. An example puts a template into the field.
- The service makes **three variants** at once. The first one that is ready can be opened without waiting for the others.
- Generation runs in the background: you can leave the page, and the video will appear in My videos.
- If generation fails, there is a clear message and a retry, and the video is **not deducted** from the limit.

## Edits

- A click on an element in the frame selects it. Next to it are the "What should change?" field and quick edits: Bigger, Rewrite, Change font, Remove.
- Without a selection the field edits the whole video ("make it faster").
- Next step suggestions (What next): Add captions, Make a square version, Trim to 10 seconds, Three more versions.
- Changing the format 9:16, 1:1, 16:9: the service re-lays out the frame itself.
- **Cancellation** of every edit (Undo). It is not drawn in the design yet.
- Every edit is saved immediately, there is no "save" button.
- **Manual editor** (Editor) is hidden behind an inconspicuous link. It covers the order of scenes, their length, the text, how the text appears (Fade in, Slide up, Letter by letter) and the transition (Cut, Fade, Slide). There are no layers, keyframes or effects.

## From your own material

This is harder than the rest. If time is short, it can be released right after launch (open question).

- **Existing video.** The service transcribes the speech and suggests spots for graphics: a name plate, a big number, a key phrase, captions. The person accepts or skips each suggestion.
- **Podcast.** The service finds moments that work on their own and makes clips with captions from them. Settings: clip length (15, 30, 60 s), format, captions, speaker names.

## Download and review

- MP4 download. You can choose several formats at once. Quality is 1080p (Pro) or 720p.
- The file is rendered at download time, and rendering may not be instant. The render continues if the window is closed. An email arrives when it is ready.
- **Review link:** view only, no sign-in, the owner can turn it off. Comments on the link come later.
- The page behind the link shows "Made with [name]" and leads new people to the landing page.

## Account and sign-in

- Sign-in with Google and with a link by email. There are no passwords. The first sign-in creates an account.
- One account is one person. There are no teams or roles.
- Profile: name, email, plan, sign-out, account deletion.
- Free videos are tied to a verified email (protection against abuse).
- In the mockups, sign-in comes before Home. Open question: let the person onto Home before sign-in and ask them to sign in only when they press Make the video.

## Brand

- Set up once, then all videos are in this style.
- You can start from a website address: the service pulls out the logo, colors and font and shows them to be checked. Nothing is saved without confirmation.
- Manually: a logo (PNG or SVG), up to three colors, a font from a preset list.
- One brand per account. Several brands and custom fonts come later.
- Without a brand a video is made in a neutral style, and after the first video the service offers to set up a brand.

## Plans and limits

A plan is counted in videos per month, edits included. The numbers are a guideline, not finally decided.

| | Free | Pro |
| --- | --- | --- |
| Price per month | $0 | $[price], guideline $20–50 |
| Videos per month | 2 | 20 |
| Watermark | Yes | No |
| Quality | 720p | 1080p |
| Video storage | 30 days | As long as there is a subscription |

- **What counts as a video:** one press of Make the video, together with its three variants. Edits, format changes and downloads are not deducted.
- **Edit cap:** no more than 30 per video (proposal). Protects against one person burning through the whole budget.
- **Limit reached:** a window offering to switch to Pro or wait for the start of the month. The entered text is not lost.
- **Payment:** a card subscription through a ready-made payment service. We do not process cards ourselves.
- **Cancellation:** in one click from the profile, access until the end of the paid month.
- **Receipts** and payment history: available from the profile, kept by the payment service.
- **Failed payment:** an email and three days to fix it, then the account moves to Free.

## My videos

- All videos in one list: frame, title, format, length, date. Filter by format.
- A video can be opened, renamed, duplicated, deleted.
- Empty state for the first visit: the main button and three examples.

## Required for launch

Without this the product cannot be shown to paying people.

- **Landing page** with examples, price and a "try" button.
- **Emails:** sign-in link, receipt, failed payment, "video is ready" if rendering takes long.
- **Documents:** Terms of Service, Privacy Policy, cookie consent.
- **Rights:** videos belong to the user. Music and fonts only with a license for commercial use.
- **Content rules:** what is forbidden, and the ability to block an account.
- **Support:** email or chat and a short page with answers to frequently asked questions.
- **Analytics:** funnel from sign-up to payment, share of repeat videos, cost of a video including edits.
- **Reliability:** error tracking, rate limiting, data backups.
- **Security:** uploaded user files are processed in isolation and cannot harm the service or other users.
- **Admin panel:** users, videos, costs, manual granting of videos.

## Not in the first version

We postpone all of this until people start making videos regularly.

- Auto-posting to social networks.
- Teams, roles, comments on the review link.
- Several brands, uploading custom fonts.
- Generating footage, people and avatars with neural networks.
- Layers, keyframes and effects in the editor.
- A mobile app.
- An API for other services.
- Other interface languages.
- A mascot character.
