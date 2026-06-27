# SamajConnect — Frontend Build Prompt (Desktop Website)
> Feed this entire file to your AI coding assistant (Antigravity, Cursor, Copilot, etc.)
> This is the complete frontend specification for the SamajConnect desktop web platform.
> Backend is already running at http://localhost:5000
> Stack: React + Vite + Tailwind CSS + Firebase Client SDK + Gemini API + Leaflet.js
> Design: Dark glassmorphism — inspired by HackByte 4.0 (hackbyte.in)
> Target: Desktop web only (min-width: 1024px) — no mobile layout needed

---

## DESIGN SYSTEM — READ ENTIRELY BEFORE WRITING A SINGLE LINE OF CODE

### Visual Identity
SamajConnect is a **dark, premium civic-tech platform** for Indian communities.
The aesthetic is: deep purple darkness, frosted glass panels, neon accent lights, bold data typography.
Think: a mission control center that a community actually wants to use.

Inspiration: HackByte 4.0 — dark purple base, glassy card surfaces, sharp neon accents, confident bold typography, subtle geometric background texture.

### Color Palette — use CSS variables, never hardcode hex in components
```css
:root {
  /* Backgrounds */
  --bg-root:        #08041A;   /* deepest background — nearly black violet */
  --bg-primary:     #0D0618;   /* main page background */
  --bg-secondary:   #130D24;   /* sidebar, panels */
  --bg-tertiary:    #1A1035;   /* cards, hover states */
  --bg-elevated:    #201545;   /* modals, dropdowns */

  /* Glass surfaces */
  --glass-1:        rgba(255, 255, 255, 0.04);   /* subtle card background */
  --glass-2:        rgba(255, 255, 255, 0.07);   /* elevated card */
  --glass-3:        rgba(255, 255, 255, 0.11);   /* modals, popovers */
  --glass-border:   rgba(255, 255, 255, 0.09);
  --glass-border-strong: rgba(255, 255, 255, 0.16);

  /* Primary accent — Purple */
  --purple-500:     #7C3AED;
  --purple-400:     #9333EA;
  --purple-300:     #A855F7;
  --purple-200:     #C084FC;
  --purple-glow:    rgba(124, 58, 237, 0.35);
  --purple-glow-strong: rgba(124, 58, 237, 0.6);

  /* Module accent colors */
  --teal:           #14B8A6;   /* infrastructure/issues */
  --blue:           #3B82F6;   /* AQI/weather/doctors */
  --pink:           #EC4899;   /* women's safety */
  --amber:          #F59E0B;   /* expertise hub */
  --emerald:        #10B981;   /* marketplace/success */
  --yellow:         #FCD34D;   /* CTA buttons — HackByte yellow */

  /* Semantic colors */
  --success:        #10B981;
  --warning:        #F59E0B;
  --danger:         #EF4444;
  --info:           #3B82F6;

  /* Text */
  --text-primary:   #EDE9FE;   /* main text — lavender white */
  --text-secondary: #A78BFA;   /* muted — light purple */
  --text-muted:     #6D5A8E;   /* very muted */
  --text-inverse:   #0D0618;   /* text on yellow/light backgrounds */
}
```

### Typography — install via Google Fonts in index.html
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap" rel="stylesheet">
```

```css
/* Roles */
--font-display:  'Syne', sans-serif;        /* hero headings, module titles, nav brand */
--font-body:     'Space Grotesk', sans-serif; /* all body text, labels, buttons */
--font-data:     'Space Mono', monospace;    /* AQI numbers, trust scores, distances, prices, stats */

/* Scale */
--text-xs:    11px / 1.4;
--text-sm:    13px / 1.5;
--text-base:  15px / 1.6;
--text-lg:    18px / 1.5;
--text-xl:    22px / 1.3;
--text-2xl:   28px / 1.2;
--text-3xl:   36px / 1.1;
--text-4xl:   48px / 1.05;
```

### The Glassmorphism Rules — apply to EVERY card, panel, sidebar, modal, dropdown
```css
/* Standard card */
.glass {
  background: var(--glass-1);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

/* Elevated card (modals, drawers) */
.glass-elevated {
  background: var(--glass-2);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid var(--glass-border-strong);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08);
}

/* Purple glow card (active states, featured items) */
.glass-glow {
  background: var(--glass-2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 16px;
  box-shadow: 0 0 24px var(--purple-glow), 0 8px 40px rgba(0,0,0,0.4);
}

/* Input fields */
.glass-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}
.glass-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.25);
}
.glass-input::placeholder { color: var(--text-muted); }
```

### Background — apply to `body`
```css
body {
  background-color: var(--bg-root);
  background-image:
    radial-gradient(ellipse 80% 60% at 10% 0%,   rgba(124,58,237,0.18) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%,  rgba(192,132,252,0.10) 0%, transparent 55%),
    radial-gradient(ellipse 40% 30% at 50% 50%,   rgba(59,130,246,0.05) 0%, transparent 50%);
  background-attachment: fixed;
  min-height: 100vh;
}
```

### Animations
```css
@keyframes fadeInUp   { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
@keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
@keyframes glowPulse  { 0%,100% { box-shadow: 0 0 16px rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 36px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.3); } }
@keyframes shimmer    { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes spinRing   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.animate-fade-in-up  { animation: fadeInUp 0.35s ease both; }
.animate-fade-in     { animation: fadeIn 0.25s ease both; }
.sos-pulse           { animation: glowPulse 1.5s ease-in-out infinite; }
.shimmer-block {
  background: linear-gradient(90deg, var(--glass-1) 25%, rgba(255,255,255,0.08) 50%, var(--glass-1) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
```

### Button System
```css
/* Primary — purple glow */
.btn-primary {
  background: var(--purple-500);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 0 18px var(--purple-glow);
}
.btn-primary:hover { background: var(--purple-400); box-shadow: 0 0 28px var(--purple-glow-strong); transform: translateY(-1px); }

/* Yellow CTA — HackByte style */
.btn-yellow {
  background: var(--yellow);
  color: var(--text-inverse);
  border: none;
  border-radius: 10px;
  padding: 10px 22px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-yellow:hover { background: #FBBF24; transform: translateY(-1px); box-shadow: 0 0 20px rgba(252,211,77,0.4); }

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 10px 22px;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover { background: var(--glass-1); border-color: var(--glass-border-strong); color: var(--text-primary); }

/* Danger */
.btn-danger {
  background: rgba(239,68,68,0.15);
  color: #FCA5A5;
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  padding: 10px 22px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger:hover { background: rgba(239,68,68,0.25); }
```

---

## PROJECT STRUCTURE

```
samajconnect-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx           # Fixed left sidebar navigation
│   │   │   ├── TopBar.jsx            # Top header with AQI pill + notifications + user menu
│   │   │   ├── PageLayout.jsx        # Wrapper: sidebar + topbar + main content area
│   │   │   └── NotificationPanel.jsx # Slide-in notification drawer from right
│   │   ├── ui/
│   │   │   ├── GlassCard.jsx         # Base glass card wrapper
│   │   │   ├── Button.jsx            # All button variants
│   │   │   ├── Input.jsx             # Glass input, textarea, select
│   │   │   ├── Badge.jsx             # Status, category, tier badges
│   │   │   ├── Avatar.jsx            # User avatar with tier color ring
│   │   │   ├── Modal.jsx             # Centered glass modal with backdrop
│   │   │   ├── Tooltip.jsx           # Hover tooltip
│   │   │   ├── Skeleton.jsx          # Shimmer loading placeholder
│   │   │   ├── EmptyState.jsx        # Empty screen with icon + CTA
│   │   │   ├── ProgressBar.jsx       # Horizontal progress bar
│   │   │   ├── StatCard.jsx          # Single metric display card
│   │   │   └── Divider.jsx           # Section divider line
│   │   ├── map/
│   │   │   ├── IssueMap.jsx          # Leaflet dark map with issue pins
│   │   │   └── RiskZoneMap.jsx       # Leaflet map with risk zone overlays
│   │   ├── issues/
│   │   │   ├── IssueCard.jsx
│   │   │   ├── IssueFilters.jsx
│   │   │   └── StatusTracker.jsx
│   │   ├── aqi/
│   │   │   ├── AqiGauge.jsx
│   │   │   ├── AqiAlertBanner.jsx
│   │   │   ├── DoctorCard.jsx
│   │   │   ├── SymptomSelector.jsx
│   │   │   └── AqiHistoryChart.jsx
│   │   ├── safety/
│   │   │   ├── SosButton.jsx
│   │   │   ├── TrustedCircleCard.jsx
│   │   │   └── JourneyTracker.jsx
│   │   ├── hub/
│   │   │   ├── QuestionCard.jsx
│   │   │   └── AnswerCard.jsx
│   │   ├── marketplace/
│   │   │   ├── ListingCard.jsx
│   │   │   └── PriceSuggestionChip.jsx
│   │   └── trust/
│   │       ├── TrustScoreRing.jsx
│   │       └── LeaderboardRow.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Home.jsx
│   │   ├── Issues.jsx
│   │   ├── ReportIssue.jsx
│   │   ├── IssueDetail.jsx
│   │   ├── AqiDashboard.jsx
│   │   ├── SafetyNetwork.jsx
│   │   ├── ExpertiseHub.jsx
│   │   ├── QuestionDetail.jsx
│   │   ├── Marketplace.jsx
│   │   ├── CreateListing.jsx
│   │   ├── Profile.jsx
│   │   ├── Leaderboard.jsx
│   │   └── ImpactDashboard.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useAqi.js
│   │   ├── useNotifications.js
│   │   └── useDebounce.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   └── storage.js
│   ├── services/
│   │   ├── api.js                    # Axios instance → backend
│   │   └── gemini.js                 # Direct Gemini calls from browser
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── aqiUtils.js
│   │   └── geo.js
│   ├── index.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## `package.json`

```json
{
  "name": "samajconnect-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "firebase": "^10.12.0",
    "@google/generative-ai": "^0.12.0",
    "axios": "^1.7.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.12.0",
    "framer-motion": "^11.2.0",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.383.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

---

## `.env.example`

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_WAQI_TOKEN=
VITE_DEFAULT_LAT=18.4088
VITE_DEFAULT_LNG=76.5604
VITE_DEFAULT_CITY=Latur
```

---

## `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SamajConnect — Community Super-App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

---

## `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          root:      "#08041A",
          primary:   "#0D0618",
          secondary: "#130D24",
          tertiary:  "#1A1035",
          elevated:  "#201545",
        },
        purple: {
          200: "#C084FC",
          300: "#A855F7",
          400: "#9333EA",
          500: "#7C3AED",
        },
        module: {
          teal:    "#14B8A6",
          blue:    "#3B82F6",
          pink:    "#EC4899",
          amber:   "#F59E0B",
          emerald: "#10B981",
          yellow:  "#FCD34D",
        }
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["Space Grotesk", "sans-serif"],
        data:    ["Space Mono", "monospace"],
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        DEFAULT: "16px",
        lg: "24px",
        xl: "32px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.35s ease both",
        "fade-in":    "fadeIn 0.25s ease both",
        "glow-pulse": "glowPulse 1.5s ease-in-out infinite",
        "shimmer":    "shimmer 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp:  { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 16px rgba(239,68,68,0.4)" }, "50%": { boxShadow: "0 0 36px rgba(239,68,68,0.8)" } },
        shimmer:   { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      borderRadius: { "2xl": "16px", "3xl": "20px", "4xl": "24px" },
      boxShadow: {
        glass:       "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset",
        "purple-glow": "0 0 24px rgba(124,58,237,0.35)",
        "purple-glow-lg": "0 0 48px rgba(124,58,237,0.5)",
      }
    }
  },
  plugins: [],
}
```

---

## `src/index.css` — COMPLETE GLOBAL STYLES

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Variables ──────────────────────────────────────────── */
:root {
  --bg-root:          #08041A;
  --bg-primary:       #0D0618;
  --bg-secondary:     #130D24;
  --bg-tertiary:      #1A1035;
  --bg-elevated:      #201545;
  --glass-1:          rgba(255,255,255,0.04);
  --glass-2:          rgba(255,255,255,0.07);
  --glass-3:          rgba(255,255,255,0.11);
  --glass-border:     rgba(255,255,255,0.09);
  --glass-border-strong: rgba(255,255,255,0.16);
  --purple-500:       #7C3AED;
  --purple-400:       #9333EA;
  --purple-300:       #A855F7;
  --purple-200:       #C084FC;
  --purple-glow:      rgba(124,58,237,0.35);
  --purple-glow-strong: rgba(124,58,237,0.6);
  --teal:             #14B8A6;
  --blue:             #3B82F6;
  --pink:             #EC4899;
  --amber:            #F59E0B;
  --emerald:          #10B981;
  --yellow:           #FCD34D;
  --danger:           #EF4444;
  --text-primary:     #EDE9FE;
  --text-secondary:   #A78BFA;
  --text-muted:       #6D5A8E;
  --text-inverse:     #0D0618;
  --font-display:     'Syne', sans-serif;
  --font-body:        'Space Grotesk', sans-serif;
  --font-data:        'Space Mono', monospace;
}

/* ── Reset ──────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }

/* ── Body ───────────────────────────────────────────────── */
body {
  background-color: var(--bg-root);
  background-image:
    radial-gradient(ellipse 80% 60% at 10% 0%,   rgba(124,58,237,0.18) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%,  rgba(192,132,252,0.10) 0%, transparent 55%),
    radial-gradient(ellipse 40% 30% at 50% 50%,   rgba(59,130,246,0.05) 0%, transparent 50%);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Glass utilities ────────────────────────────────────── */
.glass {
  background: var(--glass-1);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}
.glass-elevated {
  background: var(--glass-2);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid var(--glass-border-strong);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08);
}
.glass-glow {
  background: var(--glass-2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(124,58,237,0.3);
  border-radius: 16px;
  box-shadow: 0 0 24px var(--purple-glow), 0 8px 40px rgba(0,0,0,0.4);
}
.glass-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}
.glass-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.25);
}
.glass-input::placeholder { color: var(--text-muted); }

/* ── Button utilities ───────────────────────────────────── */
.btn { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); font-weight: 600; font-size: 14px; border: none; border-radius: 10px; padding: 10px 20px; white-space: nowrap; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
.btn-primary { background: var(--purple-500); color: white; box-shadow: 0 0 18px var(--purple-glow); }
.btn-primary:hover:not(:disabled) { background: var(--purple-400); box-shadow: 0 0 28px var(--purple-glow-strong); transform: translateY(-1px); }
.btn-yellow  { background: var(--yellow); color: var(--text-inverse); }
.btn-yellow:hover:not(:disabled)  { background: #FBBF24; box-shadow: 0 0 20px rgba(252,211,77,0.4); transform: translateY(-1px); }
.btn-ghost   { background: transparent; color: var(--text-secondary); border: 1px solid var(--glass-border); }
.btn-ghost:hover:not(:disabled)   { background: var(--glass-1); border-color: var(--glass-border-strong); color: var(--text-primary); }
.btn-danger  { background: rgba(239,68,68,0.15); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
.btn-danger:hover:not(:disabled)  { background: rgba(239,68,68,0.25); }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-lg { padding: 14px 28px; font-size: 16px; }

/* ── Typography utilities ───────────────────────────────── */
.font-display { font-family: var(--font-display); }
.font-data    { font-family: var(--font-data); }
.text-primary   { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted     { color: var(--text-muted); }
.neon-text { color: var(--purple-200); text-shadow: 0 0 20px rgba(192,132,252,0.5); }

/* ── Animations ─────────────────────────────────────────── */
@keyframes fadeInUp  { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
@keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
@keyframes glowPulse { 0%,100% { box-shadow: 0 0 16px rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 36px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.3); } }
@keyframes shimmer   { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.animate-fade-in-up { animation: fadeInUp 0.35s ease both; }
.animate-fade-in    { animation: fadeIn 0.25s ease both; }
.sos-pulse          { animation: glowPulse 1.5s ease-in-out infinite; }
.shimmer-block {
  background: linear-gradient(90deg, var(--glass-1) 25%, rgba(255,255,255,0.08) 50%, var(--glass-1) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}

/* ── Scrollbar ──────────────────────────────────────────── */
::-webkit-scrollbar         { width: 5px; height: 5px; }
::-webkit-scrollbar-track   { background: transparent; }
::-webkit-scrollbar-thumb   { background: rgba(124,58,237,0.4); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.65); }

/* ── Leaflet dark overrides ─────────────────────────────── */
.leaflet-container { background: var(--bg-tertiary) !important; }
.leaflet-popup-content-wrapper {
  background: var(--glass-2) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 12px !important;
  color: var(--text-primary) !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
}
.leaflet-popup-tip { background: var(--glass-2) !important; }

/* ── Recharts dark overrides ────────────────────────────── */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line { stroke: rgba(255,255,255,0.06) !important; }
.recharts-text { fill: var(--text-muted) !important; font-family: var(--font-data) !important; font-size: 11px !important; }
.recharts-tooltip-wrapper .recharts-default-tooltip {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 10px !important;
  color: var(--text-primary) !important;
}
```

---

## LAYOUT ARCHITECTURE — DESKTOP SHELL

The app uses a **fixed left sidebar + fixed top bar + scrollable main content** layout. This is the only layout — desktop only, no responsive breakpoints needed.

### Overall shell dimensions:
```
┌─────────────────────────────────────────────────────┐
│  TopBar — fixed, full width, height: 60px           │
├─────────┬───────────────────────────────────────────┤
│         │                                           │
│ Sidebar │         Main Content Area                 │
│ 240px   │   (calc(100vw - 240px), scrollable)       │
│ fixed   │                                           │
│         │                                           │
└─────────┴───────────────────────────────────────────┘
```

### `Sidebar.jsx` — specification

**Fixed left sidebar, full height, 240px wide, glass background.**

Top section — brand:
- App logo (stylized "SC" monogram) + "SamajConnect" in Syne font
- Tagline below: "Latur, Maharashtra" in muted small text

Navigation links — each link:
- Icon (lucide-react) + label
- Active state: purple-tinted glass background + left border `3px solid var(--purple-400)`
- Hover state: `var(--glass-1)` background
- Height: 44px per item, 8px vertical padding

Navigation items:
```
🏠  Home
🕳️  Issues                 (icon: AlertTriangle)
🌬️  AQI + Weather          (icon: Wind)
🛡️  Safety Network         (icon: Shield)
💡  Expertise Hub          (icon: Lightbulb)
📦  Marketplace            (icon: Package)
──────── (divider)
📊  Impact Dashboard       (icon: BarChart3)
🏆  Leaderboard            (icon: Trophy)
──────── (divider)
👤  My Profile             (icon: User)
```

Bottom of sidebar — Trust Score mini widget:
- User avatar (small, 32px) + name + tier badge
- Progress bar showing progress to next tier
- Score number in Space Mono

### `TopBar.jsx` — specification

**Fixed top bar, full width, 60px height, glass background.**

Left: Page title (changes based on current route)

Center: Global search bar (glass input, 380px wide)
- Placeholder: "Search issues, questions, listings..."
- Click opens a dropdown with recent searches and quick results

Right side (left to right):
- AQI pill — live reading, color coded, e.g. "AQI 142" in orange — clicking navigates to `/aqi`
- If AQI > 150: pill pulses subtly with a red glow
- Bell icon (lucide: Bell) — notification count badge — clicking opens NotificationPanel drawer
- User avatar — clicking opens a small dropdown: Profile / Settings / Logout

### `PageLayout.jsx`

```jsx
// Wraps every page
// Renders: <Sidebar /> + <TopBar /> + <main> (with left margin 240px, top margin 60px)
// Main content padding: 32px
// Max width for content: none (full width minus sidebar)
```

---

## `src/firebase/config.js`

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

---

## `src/services/api.js`

```javascript
import axios from "axios";
import { auth } from "../firebase/config";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired — sign out and redirect to login
      auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## `src/services/gemini.js` — FRONTEND AI SERVICE

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function parseJSON(text) {
  return JSON.parse(text.replace(/```json\n?|```\n?/g, "").trim());
}

// 1. Classify issue image in browser (base64 → category + severity)
export async function classifyIssueImage(base64, description = "") {
  try {
    const prompt = `You are an AI for a civic issue reporting platform in India. Analyze this image and description: "${description}". Return ONLY valid JSON: {"category":"pothole|water_leak|streetlight|waste|road_damage|other","severity":"low|medium|high|critical","confidence":0.0,"reason":"one sentence"}`;
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: base64 } }
    ]);
    return parseJSON(result.response.text());
  } catch {
    return { category: "other", severity: "medium", confidence: 0.5, reason: "Manual review needed" };
  }
}

// 2. Real-time question categorization as user types (debounced)
export async function categorizeQuestion(title, body) {
  try {
    const prompt = `Categorize this community question for routing to the right expert in an Indian town. Title: "${title}" Body: "${body}". Return ONLY valid JSON: {"category":"agriculture|legal|medical|plumbing|electrical|education|financial|other","suggestedExpertType":"descriptive role","tags":["tag1","tag2"],"priority":"low|medium|high"}`;
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch {
    return { category: "other", suggestedExpertType: "Community Expert", tags: [], priority: "medium" };
  }
}

// 3. AI price suggestion for marketplace listing
export async function suggestItemPrice(itemName, condition, category) {
  try {
    const prompt = `Suggest a fair second-hand price for a "${itemName}" in "${condition}" condition (category: "${category}") for a small Indian city (Latur, Maharashtra). Consider typical prices, not metro prices. Return ONLY valid JSON: {"minPrice":number,"maxPrice":number,"suggestedPrice":number,"currency":"INR"}`;
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch {
    return null;
  }
}

// 4. Health advice from AQI + symptoms (used on AQI dashboard)
export async function getAqiHealthAdvice(aqi, pollutant, symptoms = []) {
  try {
    const prompt = `Public health advice for Indian citizens. AQI: ${aqi}, Pollutant: ${pollutant}, Symptoms: ${symptoms.join(", ") || "none"}. Return ONLY valid JSON: {"riskLevel":"low|moderate|high|severe","immediateAdvice":"one sentence","specialistType":"specialist or none","urgency":"routine|soon|urgent","tips":["tip1","tip2","tip3"]}`;
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text());
  } catch {
    return { riskLevel: "moderate", immediateAdvice: "Limit outdoor activity and stay hydrated.", specialistType: "General Physician", urgency: "routine", tips: ["Close windows", "Wear a mask outdoors", "Avoid exercise outside"] };
  }
}
```

---

## PAGE SPECIFICATIONS — COMPLETE IMPLEMENTATION

---

### `Login.jsx` and `Register.jsx`

**Layout:** Full screen, no sidebar/topbar. Centered 480px card, vertically centered.

The card is `glass-elevated` with a soft purple border glow.

**Login.jsx:**
- SamajConnect logo + "Syne" display name top of card
- "Welcome back" heading
- Email + password glass inputs
- "Sign in" primary button (full width)
- "Or continue with" divider
- "Sign in with Google" ghost button (full width) with Google icon
- "New to SamajConnect? Create account →" link

**Register.jsx (4-step wizard, step dots at top):**
- Step 1: Email + password + confirm password
- Step 2: Full name + city (pre-filled: Latur) + ward + state
- Step 3: Languages spoken (Marathi / Hindi / English — multi-select pill chips, glass styled)
- Step 4: Optional roles — "Are you an expert?" (select categories) / "Are you a doctor?" (specialization, clinic name)
- "Create account" yellow CTA on final step
- On submit: Firebase `createUserWithEmailAndPassword` → POST `/api/auth/register` → redirect to `/`

---

### `Home.jsx`

**Layout:** 3-column grid desktop layout.

```
Left col (340px)        Center col (flex-1)        Right col (320px)
────────────────        ──────────────────          ─────────────────
Trust Score card        Module grid (2x3)           Live AQI panel
                        Recent activity feed        Active alert feed
Alert history
```

**Left column:**

Trust Score card (`glass-elevated`):
- TrustScoreRing component (large, 120px, centered)
- User name in Syne font below
- Tier badge (Bronze/Silver/Gold/Platinum with tier color)
- "X pts to next tier" in muted small text
- Progress bar: current score within tier range

Recent trust events (last 5):
- Small list below score card
- Each: colored dot + description + "+X pts" in green Space Mono + time ago

**Center column:**

Page header:
- "Good morning/afternoon/evening, [name]" — time-based, Syne font, 28px
- Subtitle: "Latur, Maharashtra · Ward 12"

Module grid (2 columns × 3 rows of glass cards):
```
[🕳️ Issues]           [🌬️ AQI + Weather]
[🛡️ Safety Network]   [💡 Expertise Hub]
[📦 Marketplace]      [📊 Impact Dashboard]
```

Each module tile:
- `glass` card, padding 24px, cursor pointer, hover: `glass-glow` + `translateY(-3px)`
- Top: icon in a colored circle (teal/blue/pink/amber/emerald/purple) + module title in Syne
- Middle: live stat (e.g. "3 open issues near you", "AQI 142 — Moderate", "2 friends active")
- Bottom: subtle colored bottom border stripe matching module color
- Click → navigate to module page

Recent issues feed (below module grid):
- Section header: "Issues near you" + "View all →" link
- 3 `IssueCard` components (compact variant)

**Right column:**

Live AQI panel (`glass-elevated`):
- "Live AQI" label + station name
- Large AQI number in Space Mono (48px, colored by level)
- Dominant pollutant chip
- Temperature + humidity row
- If spike expected: warning chip "Spike predicted at 8:30 PM"
- "View full dashboard →" link

Active alerts feed:
- Each alert: colored left border glass card
- Red: AQI alert, Pink: safety alert, Green: issue resolved, Amber: Q&A answer
- Time ago in right
- Max 5 alerts, "View all →" link

---

### `Issues.jsx`

**Layout:** Two-panel. Left: filter sidebar (280px). Right: main content with tab toggle (List / Map).

**Filter sidebar (glass, fixed within page scroll):**
- Search input (glass)
- Status filter: pill chips — All / Open / Verified / In Progress / Resolved
- Category filter: All / Pothole / Water / Streetlight / Waste / Road Damage
- Severity filter: All / Critical / High / Medium / Low
- "My Reports" toggle switch
- "Clear filters" link

**List view (right panel):**
- Issue count: "24 issues found"
- Sort by: dropdown — Newest / Most Upvoted / Severity
- Grid of `IssueCard` components (2-column grid)
- Pagination at bottom: Previous / 1 2 3 ... / Next (ghost buttons)

**Map view (right panel):**
- Full-height Leaflet map (IssueMap component)
- Dark tiles: CartoDB Dark Matter
- Color-coded pins by severity
- Click pin: glass popup with issue summary + "View details →" link
- Floating filter bar at top of map (compact pill chips)

**`IssueCard.jsx` design:**
- `glass` card, hover: slight lift + purple glow
- Top row: category emoji (in colored 32px circle) + title (bold, truncate) + severity badge
- Second row: 📍 address · time ago · upvote count
- Status progress bar (thin, 4px height) — color changes by status
- Bottom row: status badge (left) + "Verify ✓" button (right, only if open) OR "Verified ✓" (green, disabled if already voted)
- Resolved cards: green top border (2px)
- Critical cards: red left border (3px)

---

### `ReportIssue.jsx`

**Layout:** Centered single-column form, max-width 720px, on page background.

**Section 1 — Upload photo:**
- Large dashed glass upload zone (300px tall)
- "Drop an image here or click to upload" text + Upload icon
- `<input type="file" accept="image/*">` hidden, triggered by zone click
- On image selected: preview shown in zone with "Change photo" overlay
- Auto-triggers AI classification (calls `gemini.classifyIssueImage()`)

**Section 2 — AI result (shows after photo upload):**
- Glass card with purple left border
- "🤖 AI detected: Pothole — High Severity"
- Confidence bar (thin, colored)
- Muted text: "You can override this below"

**Section 3 — Category chips:**
- Row of clickable pill chips: 🕳️ Pothole / 💧 Water Leak / 💡 Streetlight / 🗑️ Waste / 🛣️ Road Damage / ❓ Other
- AI pre-selects one chip (highlighted in purple)
- User can click to override

**Section 4 — Severity chips:**
- Row: 🟢 Low / 🟡 Medium / 🔴 High / 🚨 Critical
- AI pre-selects

**Section 5 — Description:**
- Textarea (glass, 4 rows)
- Character count: "0 / 500" in muted right-aligned text

**Section 6 — Location:**
- Read-only glass input showing: "📍 MG Road, near HDFC Bank, Latur — auto-detected"
- Small "Edit location" link opens a Leaflet map modal where user can drag a pin

**Submit:**
- Full-width yellow CTA: "Submit Report 🚀"
- Loading state: spinner inside button + disabled
- On success: toast "Issue reported! +50 pts earned ⭐" + redirect to `/issues`

---

### `IssueDetail.jsx`

**Layout:** 2-column. Left (60%): issue details. Right (40%): map + actions.

**Left column:**
- Issue photo (full width, 280px tall, object-fit cover, rounded glass)
- Category + severity badges row
- Title (Syne, 24px)
- Address + time reported + reporter name + reporter tier badge
- Description
- Status tracker component: horizontal step row (Reported → Verified → Assigned → In Progress → Resolved)
- Upvote section: large upvote count + "Verify this issue" button (if open) with description: "Verifying tells the municipality this is a real problem"
- Verifiers list: small avatars of users who verified

**Right column:**
- Small Leaflet map centered on issue location (300px tall)
- Assigned department chip
- AI analysis card: category confidence + department routing reason
- Action buttons: "Share" / "Follow" / "Flag as invalid"

---

### `AqiDashboard.jsx`

**Layout:** 3 sections stacked. Wide layout, 2-3 columns within each section.

**Section 1 — Live reading (top full-width):**
- Left (40%): AqiGauge SVG component (see below)
- Right (60%): 
  - Large AQI number (Space Mono, 64px, colored)
  - Alert level label below ("Unhealthy for Sensitive Groups")
  - Dominant pollutant chip + PM2.5 / PM10 values row
  - Temperature + humidity + wind speed row
  - "Spike predicted at 8:30 PM (AQI ~178)" warning card if applicable
  - "Last updated X mins ago" muted text

**AqiGauge component:**
- SVG half-circle gauge (210° arc)
- Color zones painted as arc segments: green / yellow / orange / red / purple / maroon
- Needle rotates to current AQI (CSS transform, animated on mount)
- Center: current AQI in Space Mono + "AQI" label

**Section 2 — Alert banner (if AQI > 150):**
- Full-width red/orange glass card
- "⚠️ Air quality is unhealthy — health precautions recommended"
- Actions: "Get health advice" + "Find a doctor"

**Section 3 — Symptom checker + Health advice (if AQI > 150):**
- Left (50%):
  - "How are you feeling?" heading
  - Symptom chips grid: Breathlessness / Chest tightness / Eye irritation / Headache / Runny nose / Fatigue / No symptoms
  - Multi-select (purple highlight on selected)
  - On chip click: debounced call to `gemini.getAqiHealthAdvice()`
  - Loading: shimmer skeleton
  - Result card: risk level badge + immediate advice + specialist type + tips list
- Right (50%):
  - "Doctors available near you" heading
  - If AQI > 150: list of 4 DoctorCards
  - Below: "Community health volunteers" section (2 volunteer cards)

**DoctorCard component:**
- Glass card, horizontal layout
- Left: avatar circle with initials + specialization color ring
- Center: name (bold) + specialization + clinic name + distance chip
- Stats row: ⭐ rating + "X AQI consults" + avg response time
- Right: "Surge Mode" green pill badge (if active) + "Video" button + "Visit" button
- Unavailable doctors: opacity 0.6, "Available from 9 PM" + "Remind me" button

**Section 4 — AQI history chart:**
- Full-width recharts AreaChart
- Last 24 hours of AQI data
- Gradient fill: green (low) → yellow → red (high)
- Dark background, subtle grid lines
- Tooltip shows exact AQI + time + dominant pollutant

**Section 5 — Community sensors:**
- "Data from X community sensors" header
- Small table/grid showing sensor locations + readings + last updated

---

### `SafetyNetwork.jsx`

**Layout:** 3-column desktop layout.

**Left column (300px) — Trusted Circle:**
- Section header: "Your trusted circle"
- Each contact: glass card with avatar + name + relationship tag + online/offline dot
- "Add contact" button at bottom: opens modal with email input

**Center column (flex-1) — Journey + SOS:**

Active journey card (if journey active):
- `glass-elevated` card, green top border glow
- From → To with arrow, expected arrival countdown (live, ticking)
- Progress bar: filled based on time elapsed
- Large green "I'm safe ✅" button (full width)
- "Circle members tracking: [avatar][avatar]" row

SOS panel (always visible):
- `glass-elevated` card with red border glow
- Heading: "Emergency SOS" in Syne + brief description
- `SosButton` component (large, centered)
- Below button: "Last activated: Never" or date

"Start a Journey" section (if no active journey):
- Glass form card
- From input (pre-filled "Current location") + To input
- Expected time: number input + "minutes" label
- Circle members to notify: checkbox list
- "Analyze route" button (calls backend route-analysis)
- AI safety result card appears below after analysis
- "Start Journey" yellow CTA button

**Right column (300px) — Risk Zone Map:**
- "Risk zones near you" header
- `RiskZoneMap` component (Leaflet, 280px tall)
  - Red semi-transparent circles for risk zones
  - Hover: tooltip with incident count + high-risk time slots
- Below map: list of top 3 risk zones with incident count + time slots

---

### `ExpertiseHub.jsx`

**Layout:** 2-column. Left: question feed (flex-1). Right: experts panel (320px).

**Left column:**
- Search bar (glass, full width)
- Category filter chips: All / Agriculture / Legal / Medical / Plumbing / Electrical / Education / Financial
- Status filter: All / Open / Answered / Solved
- "Ask a Question" yellow CTA button (top right of feed)
- Question cards feed

**QuestionCard component:**
- Glass card, hover lift
- Top: category colored badge + AI tags row + time ago
- Title (bold, 2-line clamp)
- Body preview (muted, 2-line clamp)
- Bottom row: asker avatar + asker name + tier badge · X answers · X upvotes
- Solved: green "✓ Solved" badge top-right + green left border

**Right column — Experts panel (glass):**
- "Experts in your community" header
- Filter: category dropdown
- Each expert: small card — avatar + name + category badges + "X solved" count
- "Become an expert →" link at bottom

**Ask a Question modal (opens as centered glass modal, not separate page):**
- Title input (glass)
- Body textarea (glass, 6 rows)
- Photo upload (optional)
- Language selector: Marathi / Hindi / English
- As user types title (500ms debounce): calls `gemini.categorizeQuestion()`
- Shows: "🤖 Routing to: Agriculture Expert · Tags: crop disease, tomato" chip
- Shows similar solved questions (2 max): "Similar questions already answered:"
- "Post Question" primary button

---

### `QuestionDetail.jsx`

**Layout:** 2-column. Left (65%): question + answers. Right (35%): expert info + related.

**Left column:**
- Question card: full content + photo (if any) + category/tag chips + upvote count
- Asker info row: avatar + name + tier + "asked X ago"
- AI routing card: "Routed to Agriculture Expert · Confidence 94%"
- Answers section header + answer count
- Each `AnswerCard`:
  - Glass card, accepted answer: green border glow
  - Expert avatar + name + expert categories + tier badge
  - Answer body (full text)
  - Bottom: upvotes + time · "Accept this answer" button (only for question asker)
  - Accepted: green "✓ Accepted Answer" banner at top of card
- "Write an answer" form (glass card at bottom, textarea + "Post Answer" button)

**Right column:**
- Expert profile card: the top-voted answerer's full mini-profile
- Related questions: 3 similar Q cards

---

### `Marketplace.jsx`

**Layout:** Left sidebar filters (260px) + main content grid.

**Left filter sidebar:**
- Search input
- Listing type: All / Sell / Donate / Borrow
- Category chips: All / Books / Electronics / Furniture / Clothing / Appliances / Tools
- Condition: All / Like New / Good / Fair
- Price range: two inputs (min / max) — only shown when type is "Sell"
- My Listings toggle

**Main content:**
- Top row: "X listings found" + Sort by dropdown + "List an item" yellow CTA
- 3-column grid of `ListingCard` components

**ListingCard component:**
- Glass card, hover lift
- Top: photo (aspect 4/3, object-cover, rounded-t-xl) — if no photo: colored placeholder with category icon
- Photo overlays: condition badge (top-right) + listing type badge (top-left)
  - Sell: grey "🏷️ Sell" / Donate: green "🎁 Free" / Borrow: blue "📤 Borrow"
- Body: title (bold, 1-line clamp) + category chip + description (2-line clamp, muted)
- Price row: price in Space Mono (green for free, normal for sell) + distance chip
- Bottom: seller avatar + seller name + seller tier badge
- AI price chip: "AI: ₹60–120" in amber (sell listings only)

**"List an item" — opens as full-page `/marketplace/create`**

---

### `CreateListing.jsx`

**Layout:** Centered form, max-width 800px, two-column form layout.

**Left column (photo upload):**
- Up to 5 photo slots (grid of drag-drop upload zones)
- First slot large (primary photo), others smaller
- After upload: "🤖 AI Condition: Good — Light use visible on cover" card

**Right column (form fields):**
- Title input
- Category chips (single select)
- Condition chips: Like New / Good / Fair / Needs Repair (AI pre-selects after photo analysis)
- Description textarea
- Listing type toggle: "Sell" / "Donate" / "Borrow" — pill toggle, purple highlight
  - Sell: price input + "Get AI price suggestion" button (amber)
    - After click: "Suggested: ₹80–₹140 for this item in Latur" chip appears
    - One-tap to fill the price field with suggested price
  - Donate: recipient preference dropdown (Anyone / Students / Families / NGOs)
  - Borrow: duration (days) input + deposit amount input
- Location: auto-detected, editable glass input
- Ward selector

**Submit:**
- "List Item 🚀" yellow CTA (full width)
- Loading state with spinner
- On success: redirect to `/marketplace` with toast

---

### `Profile.jsx`

**Layout:** Top section full-width. Below: 3-column grid.

**Top section (hero):**
- User avatar (large, 80px, with tier color ring)
- Name in Syne font + tier badge + city, ward
- Row: Trust Score (Space Mono, large) + tier name + "X pts to Gold" label
- Trust progress bar (full width, colored by tier)
- Edit profile button (ghost, top-right)

**Column 1 — Stats:**
- 4 glass stat cards:
  - Issues reported (teal)
  - Issues verified (blue)
  - Questions answered (amber)
  - Items shared (emerald)
- Each: large number in Space Mono + label

**Column 2 — Badges:**
- "My badges" section header
- Badge grid (3 columns): each badge is a glass card with emoji + name + description
- Locked badges: grey opacity + lock icon overlay
- Progress toward next badge: "2 of 10 verified" text on locked badges

**Column 3 — Activity feed:**
- "Recent activity" header
- List of trust events (last 10)
- Each: colored dot + description + points (green +50 or red -20) + time ago
- Space Mono for point numbers

---

### `Leaderboard.jsx`

**Layout:** Full-width page, max 900px centered.

**Header:** "Community Champions · Ward 12" in Syne + week/all-time toggle (pill)

**Top 3 — Podium layout (3 cards, horizontally centered):**
- 🥇 1st: tallest card, gold ring avatar (60px), gold neon glow, large score
- 🥈 2nd: medium card, silver ring
- 🥉 3rd: medium card, bronze ring
- All: glass cards, name + tier badge + score in Space Mono

**Rank 4–10 — Table-style rows:**
- Each row: glass card (thinner)
- Rank number (Space Mono, muted) + avatar + name + ward + tier badge + score + points this week

**My rank sticky card (bottom of page, glass-elevated):**
- "Your rank: #14" + score + how many points to rank up

---

### `ImpactDashboard.jsx`

**Layout:** Full-width. Header + stat grid + 2-column chart section.

**Header:**
- "Community Impact · Latur" in Syne
- Date range picker: "Last 7 days / 30 days / All time" pill toggle
- "AI Insight" card: glass card with purple glow — AI-generated community observation (from `/api/dashboard/impact`)

**Stat grid (6 cards, 3 per row):**
- Issues reported (teal) / Issues resolved (green) / Resolution rate % (blue)
- Questions answered (amber) / Items shared (emerald) / AQI alerts sent (red)
- All numbers animate on mount: count-up animation from 0 to value
- Space Mono font for all numbers

**Charts section (2-column):**
- Left: Issues by category — recharts DonutChart, dark background, custom glass tooltip
- Right: Issue resolution trend — recharts LineChart, last 30 days

**Second charts row (2-column):**
- Left: AQI trend — recharts AreaChart, gradient fill, last 7 days
- Right: Active users by ward — recharts BarChart, horizontal bars, purple fill

**All charts:**
- Dark background (`var(--bg-tertiary)`)
- No white backgrounds anywhere on chart components
- Custom tooltip: glass card (`var(--bg-elevated)` + border)
- Legend text: `var(--text-muted)`, Space Mono font

---

## REUSABLE COMPONENTS — IMPLEMENT THESE EXACTLY

### `GlassCard.jsx`
```jsx
// Props: children, className, glow (bool), hover (bool), onClick
// glow=true: adds glass-glow class (purple border + shadow)
// hover=true: adds cursor-pointer + translateY(-2px) + purple glow on hover via Tailwind group
```

### `Badge.jsx`
```jsx
// Props: label, variant
// Variants and their styles:
// "open":       bg amber-500/15,  text amber-300,  border amber-500/30
// "verified":   bg blue-500/15,   text blue-300,   border blue-500/30
// "in_progress":bg purple-500/15, text purple-300, border purple-500/30
// "resolved":   bg emerald-500/15,text emerald-300,border emerald-500/30
// "critical":   bg red-500/15,    text red-300,    border red-500/30
// "high":       bg orange-500/15, text orange-300, border orange-500/30
// "medium":     bg yellow-500/15, text yellow-300, border yellow-500/30
// "low":        bg green-500/15,  text green-300,  border green-500/30
// "pothole":    teal background
// "water_leak": blue background
// "Bronze":  #CD7F32 colors
// "Silver":  #C0C0C0 colors
// "Gold":    #FFD700 colors
// "Platinum":var(--purple-200) colors with glow
```

### `TrustScoreRing.jsx`
```jsx
// SVG circular progress ring
// Props: score (number), tier (string), size ("sm"|"md"|"lg")
//   sm: 60px, md: 100px, lg: 140px
// Ring color:  Bronze=#CD7F32, Silver=#C0C0C0, Gold=#FFD700, Platinum=var(--purple-200)
// Center text: score in Space Mono + tier name below in small muted
// Ring progress: (score - tierMin) / (tierMax - tierMin)
// Animate ring stroke-dashoffset on mount with CSS transition
```

### `Skeleton.jsx`
```jsx
// Props: width, height, rounded ("sm"|"md"|"lg"|"full")
// Renders a shimmer-block div with specified dimensions
// Use inside every component during loading state
```

### `IssueMap.jsx`
```jsx
// MapContainer from react-leaflet
// Tile: CartoDB Dark Matter: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
// Props: issues (array), height (string), center ([lat, lng]), zoom
// Each issue: CircleMarker colored by severity
//   critical: #EF4444, high: #F59E0B, medium: #FCD34D, low: #10B981
// Click marker: Popup with glass-styled content (use leaflet-popup CSS overrides)
// If issues array is empty: show "No issues in this area" placeholder text on map
```

### `AqiGauge.jsx`
```jsx
// SVG component, 200x120px viewBox
// Half-circle arc (180°) divided into 6 color zones
// Needle: thin line from center, rotates based on AQI 0-500
//   0° = 0 AQI (left), 180° = 500 AQI (right)
//   needle angle = (aqi / 500) * 180
// Center: AQI value in Space Mono 28px + "AQI" label below 11px
// CSS transition on needle rotation: transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)
// Zone colors: #10B981 (0-50) #FCD34D (51-100) #F59E0B (101-150) #EF4444 (151-200) #9333EA (201-300) #7F1D1D (301-500)
```

### `SosButton.jsx`
```jsx
// Circular button, 96px diameter
// Red background: rgba(239,68,68,0.2), red border, sos-pulse animation
// Center: AlertTriangle icon (lucide) 36px, red
// "HOLD 3s" label below button
// State machine: idle → holding (progress ring fills) → activated
// Progress ring: SVG circle around button, stroke-dasharray animates over 3 seconds
// Countdown text inside: "3..." "2..." "1..." as seconds pass
// Use onPointerDown/onPointerUp (not onMouseDown — works in all desktop browsers)
// On 3s complete: call onActivate() prop
// If released before 3s: reset to idle
// Show countdown number inside button while holding
```

---

## `src/utils/formatters.js` — IMPLEMENT ALL

```javascript
// getAqiColor(aqi)         → hex color string based on AQI level
// getAqiLabel(aqi)         → "Good" | "Moderate" | "Unhealthy for Sensitive" | "Unhealthy" | "Very Unhealthy" | "Hazardous"
// getAqiTextColor(aqi)     → CSS color class for text
// getTierColor(tier)       → hex color for Bronze/Silver/Gold/Platinum
// getTierNext(tier)        → next tier name or null if Platinum
// formatDistance(meters)   → "0.3 km" | "1.2 km" | "850 m"
// timeAgo(timestamp)       → "just now" | "5 min ago" | "2 hours ago" | "3 days ago"
// formatPrice(amount)      → "₹80" | "₹1,200" | "Free"
// formatScore(score)       → "1,240 pts"
// getCategoryEmoji(cat)    → "🕳️" | "💧" | "💡" | "🗑️" | "🛣️" | "❓"
// getSeverityOrder(sev)    → 0-3 number for sorting (critical=3, high=2, medium=1, low=0)
```

---

## `src/App.jsx` — ROUTER

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { useAuth } from "./hooks/useAuth";
import PageLayout from "./components/layout/PageLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Issues from "./pages/Issues";
import ReportIssue from "./pages/ReportIssue";
import IssueDetail from "./pages/IssueDetail";
import AqiDashboard from "./pages/AqiDashboard";
import SafetyNetwork from "./pages/SafetyNetwork";
import ExpertiseHub from "./pages/ExpertiseHub";
import QuestionDetail from "./pages/QuestionDetail";
import Marketplace from "./pages/Marketplace";
import CreateListing from "./pages/CreateListing";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import ImpactDashboard from "./pages/ImpactDashboard";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <PageLayout>{children}</PageLayout>;
};

function AppLoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#08041A" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏘️</div>
        <div style={{ fontFamily: "Space Mono, monospace", color: "#C084FC", fontSize: "14px" }}>Loading SamajConnect...</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#201545",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#EDE9FE",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "14px",
                borderRadius: "12px",
              },
              success: { iconTheme: { primary: "#10B981", secondary: "#201545" } },
              error:   { iconTheme: { primary: "#EF4444", secondary: "#201545" } },
            }}
          />
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/"                  element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/issues"            element={<ProtectedRoute><Issues /></ProtectedRoute>} />
            <Route path="/issues/report"     element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
            <Route path="/issues/:id"        element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
            <Route path="/aqi"               element={<ProtectedRoute><AqiDashboard /></ProtectedRoute>} />
            <Route path="/safety"            element={<ProtectedRoute><SafetyNetwork /></ProtectedRoute>} />
            <Route path="/hub"               element={<ProtectedRoute><ExpertiseHub /></ProtectedRoute>} />
            <Route path="/hub/:id"           element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
            <Route path="/marketplace"       element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/marketplace/create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/leaderboard"       element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/impact"            element={<ProtectedRoute><ImpactDashboard /></ProtectedRoute>} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## BUILD ORDER — FOLLOW EXACTLY

```
Step 1:  npm create vite@latest samajconnect-frontend -- --template react
         cd samajconnect-frontend && npm install (all deps from package.json)
         npx tailwindcss init -p

Step 2:  Paste tailwind.config.js exactly as specified above

Step 3:  Paste index.html with Google Fonts + Leaflet CSS links

Step 4:  Paste src/index.css exactly as specified above
         → Run npm run dev, verify dark purple background renders

Step 5:  src/firebase/config.js — Firebase client init

Step 6:  src/services/api.js — Axios with Firebase token interceptor

Step 7:  src/services/gemini.js — all 4 Gemini functions

Step 8:  src/context/AuthContext.jsx — Firebase onAuthStateChanged hook

Step 9:  Login.jsx + Register.jsx — auth flows
         → Test: can register, log in, log out

Step 10: src/utils/formatters.js — all utility functions

Step 11: Reusable UI: GlassCard, Button, Badge, Input, Skeleton, Modal, Avatar, EmptyState

Step 12: Layout: Sidebar + TopBar + PageLayout
         → Test: sidebar renders, nav links work, page title updates

Step 13: Home.jsx — full 3-column layout with module grid
         → Wire to GET /api/aqi/current for AQI pill

Step 14: AqiGauge.jsx + AqiDashboard.jsx
         → Wire to GET /api/aqi/current + GET /api/aqi/doctors
         → Wire Gemini health advice on symptom selection

Step 15: IssueMap.jsx + Issues.jsx + IssueDetail.jsx
         → Wire to GET /api/issues + PATCH /api/issues/:id/upvote

Step 16: ReportIssue.jsx
         → Wire Gemini image classification + POST /api/issues

Step 17: SafetyNetwork.jsx + SosButton.jsx
         → Wire to GET/POST /api/safety/circle + /api/safety/journey/start

Step 18: ExpertiseHub.jsx + QuestionDetail.jsx
         → Wire Gemini real-time categorization + GET/POST /api/hub/questions

Step 19: Marketplace.jsx + CreateListing.jsx
         → Wire Gemini price suggestion + GET/POST /api/marketplace/listings

Step 20: TrustScoreRing.jsx + Profile.jsx + Leaderboard.jsx
         → Wire to GET /api/trust/score + /api/trust/leaderboard

Step 21: ImpactDashboard.jsx
         → Wire all recharts to GET /api/dashboard endpoints

Step 22: NotificationPanel.jsx (slide-in drawer from right)
         → Wire to GET /api/auth/notifications

Step 23: Seed Firestore with demo data: node seed/seedData.js (from backend)

Step 24: Final pass — verify all glass styling is consistent, no white backgrounds anywhere

Step 25: npm run build → firebase deploy
```

---

## CRITICAL RULES FOR THE AI CODING ASSISTANT

- **No white or light-colored backgrounds anywhere** — every surface must be dark glass. The only exception is text on the yellow `.btn-yellow` button.
- **All numbers use Space Mono font** — AQI values, trust scores, prices, distances, counts on stat cards. Never use Space Grotesk for numeric data.
- **All headings/titles use Syne font** — page headings, module tile titles, sidebar brand name. Never use Syne for body copy.
- **Leaflet map tiles must be CartoDB Dark Matter** — never the default OpenStreetMap light tiles. The URL is: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- **All recharts must have dark backgrounds** — override the default white chart background using the CSS variables specified in the recharts overrides section of index.css.
- **Every data fetch must show a shimmer skeleton while loading** — never show an empty white or transparent space.
- **Gemini calls must never crash the UI** — every call is wrapped in try/catch and returns a fallback object silently. Log warnings to console, never throw to the component.
- **The SOS button is a safety-critical component** — test the 3-second hold, progress ring, countdown, and activation flow completely. It must never accidentally trigger.
- **All glass cards must use `backdrop-filter: blur(16px)`** — this is what makes them look glassy. Without it they just look like semi-transparent boxes.
- **Framer Motion for page transitions** — wrap each `<Page />` in `<motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>`. Keep transitions fast (0.3s max).
- **Sidebar navigation active state** — active route gets: `background: rgba(124,58,237,0.15)`, `border-left: 3px solid var(--purple-400)`, `color: var(--purple-200)`.
- **Desktop only** — min-width for the app is 1024px. Add this to `body` or the root: `min-width: 1024px`. No responsive breakpoints, no `sm:` or `md:` Tailwind prefixes needed.
- **react-hot-toast styling** — use the dark glass style defined in App.jsx for ALL toasts. Never use default white toasts.
- **Image previews** — when a user uploads an image for issue reporting or listing creation, show it in a preview immediately using `URL.createObjectURL()` before any upload happens.
- **API error handling** — on every API call failure, show a `toast.error("Something went wrong. Please try again.")` — never just console.log and silently fail.
- **AQI pill in TopBar** — this must be live, fetching from WAQI on app load (via `useAqi` hook), not hardcoded. Color-code it dynamically using `getAqiColor()`.
- **Empty states** — every list/feed must have an `EmptyState` component shown when data is empty. Never show a blank area.

---

*SamajConnect Frontend — Desktop Web Platform*
*React · Vite · Tailwind CSS · Firebase · Gemini 1.5 Flash · Leaflet · Recharts · Framer Motion*
*Design: Dark Glassmorphism · Space Grotesk + Syne + Space Mono · HackByte-inspired*
*City: Latur, Maharashtra · min-width: 1024px · Desktop only*
```
