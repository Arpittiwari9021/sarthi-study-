# Sarthi — Final Fresh Command Center

A mobile-first personal command center for study, goals, tasks, scheduling, NIMCET preparation and local AI decision support.

## Fresh user start
- No dummy tasks, goals, schedules, NIMCET progress or study sessions are seeded.
- Persistence uses a fresh namespace: `sarthi-final-fresh`.
- First launch can create a local profile from the top-right Profile control.
- The profile is remembered on the same device/browser.

## Main experience
- Home dashboard with real task, goal, schedule and completion metrics.
- Tasks and goals.
- Focus timer that records completed sessions.
- Monthly calendar with class/study/focus blocks, completion tracking, editing and deletion.
- Analytics built only from real recorded data.
- Learning library for notes and uploaded material.
- NIMCET command center with topic-level mastery, practice accuracy, retention and readiness calculation.
- Secondary modules remain accessible from the floating Sarthi button without crowding the main navigation.

## NIMCET readiness
For each subject, Sarthi derives readiness from available real topic data using:
- 35% syllabus/topic coverage
- 30% mastery
- 20% question accuracy
- 15% revision/retention health

If no real topic data exists, the score stays at 0 rather than showing fake progress.

## Sarthi AI
- Runs locally in the browser through WebLLM + WebGPU.
- Uses current Sarthi context: tasks, goals, schedule, NIMCET topics, study sessions, weak topics and uploaded materials.
- PDF attachment, normal file attachment, gallery image and camera capture are available from the AI composer.
- PDF.js worker is explicitly configured.
- Text PDFs use PDF text extraction; scanned PDFs can fall back to local OCR.
- Images use local OCR before being stored as study material.
- AI can propose schedule changes, but **never mutates the schedule silently**.
- ADD / EDIT / DELETE schedule proposals require explicit user approval before execution.

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Deploy
The app is structured for a normal Next.js deployment such as Vercel. After deployment, open it on a phone and use the browser's **Add to Home Screen** option to install the PWA.

## Validation note
The packaging environment could not complete `npm install` because the package fetch timed out. Source-level brace/parenthesis checks were performed after the rebuild. Run `npm install` and `npm run build` in a normal networked development environment before production deployment.


## Fresh v2
This build uses a new IndexedDB persistence namespace and a versioned AI chat key, so data from earlier test builds is not carried into the fresh workspace.

## Attachment behavior
PDF/photo uploads never inject an automatic prompt into the composer. The extracted material is held as the current attachment and is sent with whatever instruction the user writes. Sending with an empty composer uses a small internal attachment-analysis instruction.
