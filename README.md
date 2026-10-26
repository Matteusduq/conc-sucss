# Adaptive Learning & Study Analytics Platform

A full-stack study management application built for Brazilian public-service exam preparation, combining adaptive prioritization, performance analytics, spaced repetition, and secure study-material management.

**Built with:** Next.js 16 · React 19 · TypeScript · Supabase/PostgreSQL · Tailwind CSS 4

> **Portfolio note:** This project demonstrates full-stack application development and AI-assisted development workflows. External LLM features are planned but **not enabled** in the public version.

## What the application does

- **Daily study cockpit** (`/hoje`): prioritized study queue, progress indicators, and exam countdown.
- **Study planning** (`/plano`): syllabus coverage, topic priorities, progress, and manual overrides.
- **Performance analytics** (`/performance`, `/analytics`): question-session tracking, accuracy, net-score calculations, charts, and risk indicators.
- **Spaced repetition** (`/memoria`): flashcards and review scheduling with the FSRS algorithm (`ts-fsrs`).
- **Document library and reader** (`/biblioteca`, `/estudar/[topicId]`): private PDFs, reading progress, notes, and bookmarks.
- **Error analysis** (`/erros`): categorize mistakes and convert them into flashcards.
- **Written exam practice** (`/discursiva`): track and evaluate practice based on exam-specific rules.

The application is tailored to a Brazilian examination (Câmara dos Deputados 2027). It is not a general-purpose question bank: practice questions are completed on an external platform and their results are recorded here.

## Screenshots and demo

Screenshots and a short walkthrough are being prepared. Planned views: daily cockpit, study plan, performance analytics, spaced repetition, and PDF reader.

> No screenshots or live demo are linked yet; the project should not be mistaken for a publicly hosted demo.

## Technology stack

| Area | Technology |
| --- | --- |
| Web application | Next.js 16 (App Router), React 19, TypeScript 5 |
| UI | Tailwind CSS 4, Lucide React |
| Backend/data | Supabase, PostgreSQL, Next.js server-side features |
| Authentication and access control | Supabase Auth, Row Level Security (RLS) |
| Storage | Supabase private bucket for study materials |
| Analytics visualization | Recharts |
| Learning algorithm | `ts-fsrs` |
| PDF interface | `react-pdf`, `pdfjs-dist` |
| Validation | Zod |
| Automated tests | Vitest |

## Architecture at a glance

```text
Next.js / React UI
       |
Next.js server-side application logic
       |
Supabase Auth + PostgreSQL (RLS) + private Storage
       |
Study planning · performance analysis · FSRS · PDF workflows
```

The database schema uses user-scoped access controls, and initial user data is created through an idempotent bootstrap process. See the technical documentation for exam-specific rules and schema details.

## Engineering highlights

- Data modeling and user-isolated persistence with PostgreSQL and RLS.
- Business-rule implementation for adaptive study priorities, exam scoring, and spaced repetition.
- Data-rich dashboards for tracking learning progress.
- Automated tests for critical application rules.
- A documented plan for future AI integrations, with human review requirements.

### AI development status

AI-assisted coding tools were used during development. The repository also contains a future-facing AI integration plan, but external LLM integration is currently disabled; this project is **not** presented as a deployed autonomous-agent system.

## Run locally

**Requirements:** Node.js 20+, npm 10+, and a configured Supabase project.

```bash
git clone https://github.com/Matteusduq/conc-sucss.git
cd conc-sucss
npm install
cp .env.example .env.local
npm run dev
```

Configure your own Supabase credentials in `.env.local`. Never commit real credentials. The app runs at `http://localhost:3000`; unauthenticated visitors are redirected to login.

```bash
npm test
npm run build
```

## Detailed documentation

The original Portuguese README has been preserved as [Technical README (Portuguese)](docs/README-technical-pt.md).

- [Exam structure](docs/exam-structure.md)
- [Syllabus mapping](docs/syllabus-map.md)
- [Business rules](docs/business-rules.md)
- [AI integration plan](docs/ai-integration-plan.md)
- [PDF import plan](docs/pdf-import-plan.md)

## Author

**Matheus Duque** — Performance Marketing · AI Automation · AI-Native Development

[GitHub profile](https://github.com/Matteusduq) · [LinkedIn](https://www.linkedin.com/in/matheus-duque-a22ba5268/)
