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
| One video cut from several source videos (raised by the owner on 2026-10-31) | The first version takes one recording per video; edits in words, trimming and inserting are in. The document already lists assets, so scenes could point at several clips; upload, ingest and the director would need to take several | Upload limits, cost of a video |
| Placing elements around any object, not only faces (2026-10-31) | Elements take free spots around keep-out zones; faces and, since 2026-10-31, the one subject the frame notes mark (a product, a phone, a screen) are kept clear and framed. Several objects with boxes, or anchoring an element to an object, would come from frame analysis returning boxes | Vision cost, layout |
| A large background library, generated backgrounds (2026-10-31) | The first version builds backgrounds from the brand, gradients, shapes and the style's textures, and the vocabulary keeps adding them. Generated images or footage are outside the first version | Licenses, cost |
| A freer engine (raised by the owner on 2026-11-09) | The owner asked whether the engine could work more freely, the way a plan is written in a local Claude Code session, instead of picking from a fixed vocabulary. Today the director picks components and their parameters and the engine assembles them ("Graphics come from a large vocabulary, not per-video code", 2026-10-30); a hybrid where the model writes code for one or two special moments may come after the first version. Nothing is decided; the engine is paused while the application is built | Cost and time of a video, how reliable edits and format changes stay, what QA can vouch for |

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
