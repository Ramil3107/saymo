# Overview

Summary of sections 1 and 3 of the [design spec](/superpowers/specs/2026-10-28-saymo-v1-design).

## What we build

Saymo turns a user's video or text into a social video: cuts, zooms, captions and motion graphics in the brand's style. The user uploads a recording or writes what they need and presses one button. A minute later they see a plan, a few minutes later a finished video, and then they edit it with words and by clicking the frame.

The pitch is "Claude Code, but for videos". You say what you need and edit with words, not sliders.

Who it is for: marketers and social media managers in small companies, freelancers and small agencies. They need 5–20 videos a month, do not know After Effects, and a motion designer is expensive.

## Three entry modes

One pipeline serves all three. The mode is never chosen explicitly: the director, a Claude model that writes the plan, infers it from what the user provided and where the video is going.

1. Own video plus graphics. The main mode.
2. Text only, a video made entirely of graphics.
3. Minimal graphics: captions, cuts, zooms.

## The main gesture

Click any element in the frame, say what to change, see the result right away.

## What is out of scope

- Right after launch: music generation and a custom audio file.
- After launch: 40-minute podcasts, a critic model.
- Not in the first version: an editor on the phone, a mobile app, an API, teams and roles, several brands, custom fonts, comments on the review link, auto-posting, other interface languages, AI-generated footage.

Goals and anti-goals, meaning what would make the product a failure even if everything works, are in section 3 of the spec.
