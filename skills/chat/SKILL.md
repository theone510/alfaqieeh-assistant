---
name: chat
description: The complete chat design and architecture guide for the Alfaqieeh Assistant (مساعد الفقيه) project. Use this skill whenever you need to understand, modify, debug, or extend the chat interface, message flow, session management, RAG pipeline, sidebar, landing page, input area, loading states, feedback system, voice input, caching, or any UI/UX component of the chat experience. Covers the full stack from the React frontend to the Firebase/Supabase backend integration.
---

# Chat Design — Alfaqieeh Assistant (مساعد الفقيه)

This skill documents the complete chat system architecture, UI design patterns, data flow, and conventions used in the project.

## Project Overview

The app is an **Islamic jurisprudence (fiqh) AI assistant** specialized in the rulings of Grand Ayatollah Sistani. It uses a **RAG (Retrieval-Augmented Generation)** pipeline to search a Supabase vector database of fatwas and generate answers via the **Gemini API**.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript (single-file SPA in `index.tsx`)
- **Styling:** Tailwind CSS (CDN) + custom CSS in `index.html`
- **AI:** Google Gemini API (`gemini-3.1-flash-lite-preview`)
- **Database:** Firebase Firestore (sessions, feedback, cache, token logs)
- **Vector Search:** Supabase with `match_fatwas` RPC function
- **Build:** Vite with custom API middleware in `vite.config.ts`
- **PWA:** Service worker (`sw.js`) + manifest

---

## File Structure

```
alfaqieeh-assistant/
├── index.html          # Entry HTML, fonts, Tailwind config, custom CSS
├── index.tsx           # Entire React app (1669 lines — single component)
├── firebase.ts         # Firebase app initialization
├── firebaseService.ts  # All Firebase CRUD operations
├── api/search.js       # Serverless search endpoint (Vercel)
├── vite.config.ts      # Dev server + API search middleware
├── sw.js               # Service worker for PWA
├── manifest.json       # PWA manifest
└── icon-512.png        # App icon
```

---

## Application Flow

The app has two main views controlled by the `hasStarted` state:

### 1. Landing Page (`hasStarted === false`)

Rendered when the user first opens the app or clicks the logo/app name to go home.

**Components:**
- **Language selector** (top-right, dropdown with Globe icon)
- **Header** — App icon (Scroll in teal circle with gold border), title, description
- **Mode selection cards** — Two cards side by side:
  - **Literal Mode (`MODE_LITERAL`)** — Returns verbatim fatwa text
  - **Understanding Mode (`MODE_UNDERSTANDING`)** — Returns analyzed/inferred rulings
- **Quick prompt buttons** — Three pre-set questions that start a chat immediately
- **Previous sessions** — Shows up to 3 recent sessions from Firebase
- **Footer** — Organization credit text

**Key functions:**
- `handleStart(mode)` — Sets mode, flags `hasStarted`, creates new session
- `handleQuickPrompt(text, mode)` — Same as start but also sends the prompt immediately
- `goToHome()` — Resets to landing page

### 2. Chat Interface (`hasStarted === true`)

The main chat layout is a **sidebar + main area** split.

---

## Sidebar Design

**Location:** Fixed left (LTR) / right (RTL), width `w-80`, deep teal gradient background.

**Sections (top to bottom):**
1. **Header** — Clickable logo + app name (navigates home), mobile close button
2. **New Chat button** — Gold background, calls `goToHome()`
3. **Session history** — Grouped by time period (Today, Yesterday, Last 7 Days, Older)
   - Each session shows: icon, title (truncated), date
   - Delete button appears on hover (red, icon `Trash2`)
   - Active session highlighted with `bg-white/10` and gold icon
4. **Language selector** — Full-width dropdown
5. **Mode toggle** — Radio buttons for Literal/Understanding mode with `CheckCircle2` indicator
6. **Install App button** — Shown only when PWA prompt is available
7. **Footer** — Organization credit

**Responsive behavior:**
- **Desktop:** Sidebar always visible (`md:relative md:translate-x-0`)
- **Mobile:** Slide-in overlay with backdrop blur, toggled by hamburger menu

---

## Chat Messages Area

**Layout:** `flex-1 overflow-y-auto` with padding and spacing

### Message Bubbles

Each message is a flex row with avatar + bubble:

| Property | User Message | AI Message |
|---|---|---|
| **Flex direction** | `flex-row-reverse` | `flex-row` |
| **Avatar** | Teal circle, `User` icon | White circle, gold border, `Scroll` icon |
| **Bubble bg** | `bg-[#004D40]` (dark teal) | `bg-white` |
| **Bubble border** | None, rounded corner removed on top-right (RTL) | Gold left border (`border-l-4 border-[#C5A059]`), rounded corner removed on top-left (RTL) |
| **Text color** | White | `text-slate-800` |
| **Max width** | 85% mobile, 75% desktop | Same |

**Content rendering:** All messages use `<ReactMarkdown>` inside a `markdown-body` div.

### AI Message Actions (below each AI bubble)

Three action buttons separated by a `border-t border-slate-100`:
1. **Copy** — Copies text to clipboard, shows "Copied" with green check for 2 seconds
2. **Like (ThumbsUp)** — Toggles green, saves feedback to Firebase
3. **Dislike (ThumbsDown)** — Toggles red, saves feedback to Firebase

### Loading Indicator

Shown when `isLoading === true`:
- Bot avatar with glowing gold shadow
- Bouncing gold dots (3 dots with staggered `delay-75`, `delay-150`)
- Rotating loading step text (5 steps, cycles every 2 seconds):
  - Step 0: "Searching religious sources..."
  - Step 1: "Extracting relevant texts..."
  - Step 2: "Analyzing and matching fatwas..."
  - Step 3: "Formulating the precise ruling..."
  - Step 4: "Final review of the answer..."

---

## Input Area

**Structure:** Sticky bottom bar with white background, top shadow, and top border.

**Components:**
1. **Mode indicator tag** — Floats above the input, shows current mode (hidden on mobile)
2. **Textarea** — Auto-resizing, max 4 lines, submit on Enter (Shift+Enter for newline)
3. **Voice button** — Microphone icon, turns red with glow animation when recording
4. **Send button** — Gold gradient, shows spinner when loading, disabled when empty/loading
5. **Footer text** — Below input

---

## Message Processing Pipeline (`handleSend`)

This is the core logic flow when a user sends a message:

```
1. User sends message
2. Create/update session in state and Firebase
3. Detect language (Arabic regex check OR UI language)
4. If non-Arabic → Translate question to Arabic via Gemini
5. Check answer cache (Firebase `answerCache` collection)
   ├── Cache HIT → Return cached answer, log cache hit, update hit count
   └── Cache MISS → Continue pipeline:
       6. Normalize question to fiqh keywords (Gemini JSON response)
       7. Search Supabase vector DB via /api/search endpoint
       8. Build prompt with RAG context + mode instructions
       9. Call Gemini with conversation history + prompt
       10. Save answer to cache
11. If original was non-Arabic → Translate answer back
12. Update messages in state + Firebase session
```

---

## Session Management

**Types:**
```typescript
type ChatSession = {
    id: string;        // crypto.randomUUID()
    title: string;     // First 40 chars of first message
    messages: Message[];
    mode: Mode;
    date: number;      // Date.now() timestamp
    userId?: string;
};
```

**Storage:** Firebase Firestore `sessions` collection + localStorage tracking (`faqih_local_sessions` stores array of session IDs for this device).

**Lifecycle:**
- **New session** — Created on first message send (not on mode selection)
- **Session load** — `loadSession(session)` restores messages, mode, and session ID
- **Session delete** — Removes from Firebase + state, resets to landing if active
- **Ordering** — Active session moved to top of list on each message

---

## Answer Cache System

**Purpose:** Avoid redundant Gemini API calls for repeated questions.

**Key generation:** `${mode}::${normalizedQuestion}` where normalization removes Arabic diacritics, punctuation, and extra whitespace.

**Cache storage:** Firebase `answerCache` collection, keyed by URL-encoded cache key.

**TTL:** 30 days (`CACHE_MAX_AGE`).

**Fields stored:** answer, question (first 100 chars), mode, cachedAt, inputTokens, outputTokens, hitCount.

---

## Multi-Language System

**Supported languages (7):** Arabic (ar), English (en), Persian (fa), Urdu (ur), Turkish (tr), French (fr), Hindi (hi)

**RTL languages:** `ar`, `fa`, `ur` — Controlled by `isRTL` flag, affects `dir` attribute, flex directions, border sides, rounded corners, and text alignment.

**Translation mechanism:** `translations` object maps `Language → key → string`. The `t(key)` helper returns the current language string.

**Language-specific fonts:**
- Arabic: `Tajawal`, `Cairo`, `Amiri`, `Noto Naskh Arabic`, `Aref Ruqaa`
- Urdu: `Noto Nastaliq Urdu` (with extra line-height 2.2)
- Persian: `Vazirmatn` (with line-height 2)

---

## Design System & Color Palette

**Primary colors:**
```
Deep Shrine Teal:  #004D40 → #00695C (gradient)
Shrine Gold:       #C5A059 → #D4AF37 (gradient)
Background Cream:  #FDFBF7
Text Dark:         #004D40
```

**COLORS constant** provides reusable Tailwind class strings:
- `COLORS.primary` — Teal gradient for sidebar, headers, avatars
- `COLORS.accent` — Gold gradient for buttons, active indicators
- `COLORS.bgLight` — Cream background
- `COLORS.accentText` — Gold text for logo and highlights

**Typography hierarchy:**
- Headings: `Cairo`, `Tajawal` (weight 700)
- Body: `Tajawal`, `Cairo` (weight 500)
- Fatwa/blockquote text: `Noto Naskh Arabic`, `Amiri` (serif, line-height 2)
- Decorative: `Aref Ruqaa`

**Key design patterns:**
- Islamic geometric dot pattern overlay (`bg-pattern` at 3% opacity)
- Gold scrollbar styling
- Glassmorphism on input area (`backdrop-blur-md`)
- `fadeInUp` animation for page transitions
- Gold border-left on AI message bubbles
- Gold glow shadow on loading avatar

---

## Voice Input

Uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).

**Configuration:** `continuous: false`, `interimResults: false`, `lang: 'ar-SA'`

**Flow:**
1. User clicks mic button → `recognition.start()`
2. Button turns red with pulsing glow animation
3. `onresult` appends transcript to input textarea
4. `onend` fires → If auto-send flag is set, sends message automatically

---

## Firebase Collections

| Collection | Document ID | Purpose |
|---|---|---|
| `sessions` | `session.id` (UUID) | Chat sessions with messages |
| `feedback` | `entry.id` (UUID) | Like/dislike feedback per answer |
| `tokenLogs` | `entry.id` (UUID) | Token usage tracking per API call |
| `answerCache` | URL-encoded cache key | Answer cache for repeated questions |

All CRUD operations are in `firebaseService.ts`.

---

## API Search Endpoint

**Development:** Handled by Vite middleware in `vite.config.ts` (same logic inline).

**Production:** `api/search.js` — Vercel serverless function.

**Flow:**
1. Receive POST with `{ query }` body
2. Generate embedding via `gemini-embedding-001`
3. Slice embedding to 768 dimensions (Matryoshka)
4. Call Supabase `match_fatwas` RPC (threshold: 0.5 dev / 0.7 prod, top 5)
5. Return `{ results }` array

---

## System Prompt (DSE)

The `SYSTEM_INSTRUCTION` constant (lines 14–122 in `index.tsx`) defines the AI's behavior:

- **Role:** Specialized fiqh assistant for Sistani's rulings only
- **Two modes:** Literal (verbatim text) and Understanding (inference with reasoning chain)
- **Strict constraints:** No politics, sports, economics, entertainment, medical, or non-fiqh topics
- **Output templates:** Structured format with ruling summary, text, source citation
- **Forbidden:** Fabricating masalah numbers, using non-Sistani sources, premature "no source found"

---

## Key Conventions for Modifications

1. **All UI is in `index.tsx`** — The entire app is a single `App` component. Any UI change goes here.
2. **RTL-aware** — Always handle both `isRTL` and LTR directions when adding UI elements (border sides, flex order, rounded corners, margins).
3. **Translation required** — Every user-facing string must have entries in all 7 languages in the `translations` object.
4. **Color consistency** — Use `COLORS` constant values, never hardcode colors outside the palette.
5. **Firebase-first persistence** — Sessions, feedback, and cache all persist to Firestore. Local storage is only used for tracking which sessions belong to this device.
6. **Mobile-first responsive** — Test all changes on mobile widths. Sidebar is overlay on mobile.
7. **PWA support** — Changes to HTML structure should preserve `manifest.json` and `sw.js` compatibility.
