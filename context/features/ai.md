# AI (Phase 3)

## Purpose
Two small helpers that run only when the user taps: break a task into steps, and turn a note or the scratchpad into tasks. Only the chosen task or text is sent.

## Status
Built 2026-09-30. Verified with the model call mocked (Vitest) and the responses mocked in Playwright. Needs a real key on Vercel to verify live. UI is built from DS parts (Chip, Button, Skeleton, Alert); screenshots need Emmanuel's approval.

## How it works now
- Provider (D25): `src/server/ai.ts`. Groq (`GROQ_API_KEY`, default model `openai/gpt-oss-20b`), then Gemini (`GOOGLE_GENERATIVE_AI_API_KEY`, `gemini-flash-latest`), then xAI (`XAI_API_KEY`, `grok-4.20-non-reasoning`). Only providers with a key are tried, in that order; an error falls to the next. Override models with `GROQ_MODEL`, `GOOGLE_MODEL`, `XAI_MODEL`. Uses `generateText` with `Output.object` (Zod schema), temperature 0.3, one retry, 20 s timeout.
- Privacy: provider errors are swallowed (they can carry the prompt); logs only say which provider failed. Prompts treat user text as data.
- Limit: 20 calls per user per UTC day, table `ai_usage (user_id, day, count)` (DDL in `schema.ts`). Counted up front with an atomic upsert, refunded if the model call fails. Over the limit: 429 "That's all 20 AI helps for today. They come back tomorrow."
- Endpoints (all in `route()`, strict Zod in `validation.ts`, handlers appended to `handlers.ts`, routes `src/routes/api/ai/*`):
  - `GET /api/ai/status` → `{ enabled, limit, remaining }`.
  - `POST /api/ai/breakdown { taskId }` → `{ subtasks: string[], remaining }`. 404 for another user's task (checked before counting). Sends the title, existing subtasks (so they aren't repeated) and up to 2 linked notes (2000 chars). Output cleaned: numbering stripped, duplicates dropped, max 7, 200 chars each.
  - `POST /api/ai/extract { text (1 to 4000), today? (YYYY-MM-DD, the browser's date) }` → `{ tasks: [{ title, date?, priority? }], remaining }`. Max 20 tasks; bad dates dropped.
  - No key: status says `enabled: false`; the POSTs return 404.
- Client: `src/lib/ai.ts` (`useAiStatus`, calls). Everything hides while `enabled` is false.
  - `src/components/AiBreakdown.tsx` under Subtasks in `TaskDetail` (hidden for done tasks): "Break it down" (sparkles + words) → 3 skeleton lines → chips, all picked (check icon), tap to unpick (plus icon) → "Add all" / "Add selected (N)" adds them in order → toast "Added N subtasks". Cancel. Errors show a warning Alert with Try again.
  - `src/components/AiExtract.tsx` in `NoteEditor` (sends title plus body) and `Scratchpad` (body): "Turn into tasks" → skeletons → "Found N tasks. Check them before adding." rows with a checkbox, editable title, date and High/Low → "Add N tasks" creates them (date goes to Start date) → toast "Added N tasks" with the logo badge.
  - Footnote on both: "Only this task/text is sent to the AI. N AI helps left today."

## Known issues
- Needs design approval (backlog says design yes).
- Extracted tasks don't pick a folder yet (PRD mentions categories).
- The limit day is UTC, so it resets at 01:00 WAT.

## How to test
1. Vitest: `npx vitest run tests/api.test.ts -t "^ai "` (401, 400, 404 other user, 429, success, provider fallback and refund, off without a key).
2. Playwright (mock `**/api/ai/*` with `page.route`): open a task, click `Break it down`, expect `role=status[aria-busy]` skeletons, then group "Suggested subtasks"; click a chip to unpick; click `Add selected (4)`; toast "Added 4 subtasks"; `GET /api/tasks/:id` has the 4 in order.
3. Note: open `/notes/:id`, click `Turn into tasks`, group "Tasks found"; `getByLabel('Task title 3').fill(...)`; untick `checkbox "Add \"Pay rent\""`; click `Add 2 tasks`; toast "Added 2 tasks".
4. With no keys set the buttons are absent.
