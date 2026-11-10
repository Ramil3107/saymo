# User flow

The overall map of the first version. Nodes are screens (numbers follow `design/screens.md`), arrows are actions, emails are separate nodes with conditions. The diagram changes in the same commit as the flow.

```mermaid
flowchart TD
  L[1.1 Landing] --> S[1.2 Sign in]
  S -->|Google| H[2.1 Home]
  S -->|Google canceled or failed| S
  S -->|Email me a link| CE[1.3 Check your email]
  S -->|too many tries| S
  M1([Email: sign-in link, valid 10 minutes, works once]) -.-> CE
  CE -->|Resend the link| CE
  CE -->|link from the email| OC["One click left."]
  OC -->|Sign in to Saymo| H
  OC -->|link expired or used| S

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
  B -.->|error, the video is refunded| F[2.3 Generation failed]
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
  AC -->|Sign out| S
  AC -->|Delete account| DEL{Fresh session?}
  DEL -->|yes, confirmed: account deleted| S
  DEL -->|no: Sign in again| S
  AC --> BR[1.4 Brand setup] --> H
  AC --> P
  M5([Email from the merchant: payment failed, 3 days, then Free]) -.-> AC
```

Sign-in states, built in the first slice of the application:

- **Link sent.** The Check your inbox screen shows the address and a Resend button.
- **Resend.** Sends a new link to the same address.
- **The link's page.** The link opens "One click left." with a Sign in to Saymo button, and only the button signs in: mail filters and link previewers open links before the person does, and a link that signed in on opening would be used up by them. A person who is already signed in goes straight to Home.
- **Expired or used link.** Back on Sign in with a notice that the link has expired. A link without a token, or with a broken one, lands there too.
- **Too many tries.** Requests for a link are limited to 5 per minute; the person sees a notice and tries again later.
- **Google canceled or failed.** Back on Sign in with a notice.

Deleting an account asks for confirmation. If the session is older than a day, a notice asks the person to sign in again first, and then the account can be deleted. After the deletion the person lands on Sign in with a goodbye notice.
