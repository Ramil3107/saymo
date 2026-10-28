# Open questions

## Product

Resolve before development starts or along the way. When a question is resolved, move it to `decisions.md`.

| Question | Options or what is known | What it depends on |
| --- | --- | --- |
| Name and domain | Not chosen, `[name]` everywhere | Landing page, emails, review links |
| Pro price | Guideline $20–50 a month | Cost of a video |
| Videos in Pro | Currently 20 | Cost of a video |
| Edit cap per video | Proposal: 30 | Cost of an edit |
| Own material (video, podcast) in the first version? | In the first version or right after launch | Timing, complexity |
| How many videos from the limit podcast clips use up | One video per batch or one per clip | Economics |
| Let people onto Home before sign-in? | In the mockups sign-in comes first. The alternative: ask to sign in when Make the video is pressed | Landing page conversion |
| Upload limits | Maximum length and size of video and audio | Costs, speed |
| Video languages | English only or others right away (Cyrillic, etc.) | Fonts, markets |
| First market | English-speaking or non-English-speaking | Promotion, payment |
| Accent color | Red-orange by default, violet and blue are available | Design only |
| Where music and voiceover come from | A license for commercial use is needed | Costs, rights |
| Company registration country | Affects the choice of payment service and taxes | Payment |
| What the watermark looks like | Not drawn | Design |

## Technical, to decide later

Only questions here. Nothing is chosen. Claude Code does not choose by itself: it proposes options with pros and cons, and the decision is the author's.

1. **How to describe a video inside the product** so that edits in words are reliable, fast and cheap.
2. **What to render the video file with and where** to do it. Check engine licenses separately: some have special terms for services that render videos for customers.
3. **Which models and services** are needed to understand the request, for text, voiceover and speech transcription.
4. **How to build "click the frame, say it, it changes"**: how to identify the element and how to show the result quickly.
5. **How to do quick edits** (Bigger, Change font), perhaps without calling the model.
6. **How the service re-lays out the frame** for another format.
7. **How to store templates and examples** and how to add new ones.
8. **The application stack**: interface, server, database, file storage.
9. **Sign-in, payment (including EU taxes), emails, analytics, error tracking.**
10. **Security of uploaded files** and of everything the service generates.
11. **How to calculate the cost of a video** including edits and rendering the file.
12. **How to check the quality** of a video before showing it: the text fits, is readable, the length is right.
