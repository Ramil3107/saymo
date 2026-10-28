# User flow

The overall map of the first version. Nodes are screens (numbers follow `design/screens.md`), arrows are actions, emails are separate nodes with conditions. The diagram changes in the same commit as the flow.

```mermaid
flowchart TD
  L[1.1 Landing] --> S[1.2 Sign in]
  S -->|Google| H[2.1 Home]
  S -->|Email me a link| CE[1.3 Check your email]
  M1([Email: sign-in link]) -.-> CE
  CE -->|link from the email| H

  H -->|Make the video| LIM{Videos left?}
  LIM -->|no| LR[6.1 Limit reached] --> P[6.2 Plans]
  P -->|payment with the merchant of record| W[6.3 Welcome to Pro] --> H
  LIM -->|yes| G[2.2 Generating: Watching the video]
  G -->|1–2 minutes, text 30–60 s| PC[Plan card]
  PC -->|no questions| B[Building]
  PC -->|has questions| Q[Waiting for answers]
  Q -->|Continue| B
  M2([Email: the video waits for answers, if the user left for over 10 minutes]) -.-> Q
  B --> R[2.4 Video and edits]
  M3([Email: the video is ready, if the user left]) -.-> R
  B -.->|error, the video is returned| F[2.3 Generation failed]
  F -->|Try again| G
  F -->|Change the description| H

  R -->|edit by click or in words, Undo| R
  R <-->|Editor / Done| ED[2.5 Manual editor]
  R --> DL[4.1 Download] -->|render on Lambda| MP4[(MP4)]
  M4([Email: the file is ready, if the render takes over 2 minutes and the user left]) -.-> DL
  R --> SR[4.2 Send for review] --> RV[4.3 Review link, no sign-in, from a phone]
  RV -->|Make your own| L

  H --> MV[5.1 My videos] --> R
  H --> AC[5.3 Account]
  AC --> BR[1.4 Brand setup] --> H
  AC --> P
  M5([Email from the merchant: payment failed, 3 days, then Free]) -.-> AC
```
