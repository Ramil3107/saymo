# Путь пользователя

Общая карта первой версии. Узлы это экраны (номера по `design/screens.md`), стрелки это действия, письма отдельными узлами с условиями. Схема меняется в том же коммите, что и поток.

```mermaid
flowchart TD
  L[1.1 Landing] --> S[1.2 Sign in]
  S -->|Google| H[2.1 Home]
  S -->|Email me a link| CE[1.3 Check your email]
  M1([Письмо: ссылка для входа]) -.-> CE
  CE -->|ссылка из письма| H

  H -->|Make the video| LIM{Ролики остались?}
  LIM -->|нет| LR[6.1 Limit reached] --> P[6.2 Plans]
  P -->|оплата у мерчанта оф рекорд| W[6.3 Welcome to Pro] --> H
  LIM -->|да| G[2.2 Generating: Watching the video]
  G -->|1–2 минуты, текст 30–60 с| PC[План-карточка]
  PC -->|вопросов нет| B[Building]
  PC -->|есть вопросы| Q[Ждём ответов]
  Q -->|Continue| B
  M2([Письмо: ролик ждёт ответов, если ушёл дольше 10 минут]) -.-> Q
  B --> R[2.4 Video and edits]
  M3([Письмо: ролик готов, если ушёл]) -.-> R
  B -.->|ошибка, ролик возвращается| F[2.3 Generation failed]
  F -->|Try again| G
  F -->|Change the description| H

  R -->|правка кликом или словами, Undo| R
  R <-->|Editor / Done| ED[2.5 Manual editor]
  R --> DL[4.1 Download] -->|рендер на Lambda| MP4[(MP4)]
  M4([Письмо: файл готов, если рендер дольше 2 минут и ушёл]) -.-> DL
  R --> SR[4.2 Send for review] --> RV[4.3 Review link, без входа, с телефона]
  RV -->|Make your own| L

  H --> MV[5.1 My videos] --> R
  H --> AC[5.3 Account]
  AC --> BR[1.4 Brand setup] --> H
  AC --> P
  M5([Письмо от мерчанта: платёж не прошёл, 3 дня, потом Free]) -.-> AC
```
