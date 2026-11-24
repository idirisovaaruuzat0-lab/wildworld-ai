# Technical notes

## Architecture
- Front end: semantic HTML, CSS variables, vanilla JavaScript.
- Back end: Node.js + Express.
- AI: Google Gemini SDK, called only from the server.
- Persistence: browser LocalStorage.

## API
- `GET /api/status` — reports whether a server-side Gemini key is configured.
- `POST /api/plan` — accepts tasks, date, time window, language, preferences and sort preference; returns a structured JSON plan.

## Data flow
1. The user selects active tasks and a time window.
2. The browser sends the selected data to `/api/plan`.
3. The Express server validates required input and calls Gemini.
4. Gemini returns JSON containing schedule blocks, fit status and recommendations.
5. The browser renders the plan and allows copy, TXT export and history save.

If the API key is missing or the request fails, a separate local demonstration algorithm can produce a clearly labelled DEMO MODE result. This fallback is not an AI response.

## Privacy and security
Do not store the Gemini API key in `public/` or commit `.env`. For public use, add authentication, rate limiting, stricter input validation, privacy disclosures and server-side storage policies.
