# MindSpark Learning

An AI-powered personalized learning tutor for Bangladeshi students (Grades 1–10), strictly aligned with the NCTB curriculum.

## Project Summary

MindSpark Learning is a study-only, curriculum-locked, multimodal AI tutor delivered as a Progressive Web App (PWA). It provides individualized learning plans, adaptive practice modules, and student progress tracking with a zero-hallucination policy.

### Key Features

- **Personalized Learning Plans** - AI-generated daily/weekly study plans based on student performance
- **Adaptive Practice** - Bloom's Taxonomy-based progression through learning levels
- **Multimodal Input** - Support for text, voice, and image/PDF uploads
- **PersonaShift Mode** - Adjustable teaching personas (Strict Teacher, Friendly Mentor, etc.)
- **Offline Support** - PWA with offline lesson packs for low-bandwidth users
- **Progress Tracking** - XP system, streaks, achievements, and leaderboards
- **Revision Scheduling** - Spaced repetition for optimal retention

### Supported Subjects

- Bangla 1st & 2nd Paper
- English 1st & 2nd Paper
- Mathematics / Higher Mathematics
- General Science / Physics / Chemistry / Biology
- ICT
- Bangladesh & Global Studies (BGS)

> ❌ Religion subject is explicitly excluded

## Setup and Run Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd mindspark-learning

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

The project uses Supabase for backend services. The following are configured:
- Supabase Project URL
- Supabase Anon Key

For AI features, ensure the following secrets are configured in Supabase Edge Functions:
- `OPENAI_API_KEY` - For GPT-based tutoring
- `GEMINI_API_KEY` - For multimodal understanding

## Tech Stack and Dependencies

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Framer Motion** | Animations |
| **React Router** | Client-side routing |
| **React Query** | Server state management |
| **Recharts** | Data visualization |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| **PostgreSQL** | Database |
| **Edge Functions** | Serverless API endpoints |
| **Auth** | User authentication |
| **Storage** | File uploads |
| **Realtime** | Live updates |

### Key Dependencies

```
react, react-dom, react-router-dom
@tanstack/react-query
@supabase/supabase-js
framer-motion
recharts
lucide-react
zod, react-hook-form
date-fns
canvas-confetti
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (PWA)                             │
├─────────────────────────────────────────────────────────────────┤
│  src/                                                           │
│  ├── pages/           # Route components                        │
│  │   ├── Index.tsx    # Landing page                            │
│  │   ├── Dashboard.tsx # Student dashboard                      │
│  │   ├── Tutor.tsx    # AI tutor interface                      │
│  │   ├── Practice.tsx # Practice sessions                       │
│  │   ├── Assessment.tsx # Assessments                           │
│  │   └── ...                                                    │
│  ├── components/      # Reusable UI components                  │
│  │   ├── ui/          # shadcn/ui components                    │
│  │   ├── dashboard/   # Dashboard-specific                      │
│  │   ├── tutor/       # AI tutor components                     │
│  │   └── landing/     # Landing page sections                   │
│  ├── hooks/           # Custom React hooks                      │
│  │   ├── useStudySession.ts                                     │
│  │   ├── useStreakTracker.ts                                    │
│  │   ├── useVoiceInput.ts                                       │
│  │   └── ...                                                    │
│  ├── contexts/        # React contexts                          │
│  │   └── AuthContext.tsx                                        │
│  └── integrations/    # External service clients                │
│      └── supabase/                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Backend                            │
├─────────────────────────────────────────────────────────────────┤
│  supabase/functions/  # Edge Functions                          │
│  ├── ai-tutor/        # AI tutoring logic                       │
│  ├── generate-practice/ # Practice question generation          │
│  ├── generate-quiz/   # Quiz generation                         │
│  ├── run-assessment/  # Assessment execution                    │
│  ├── generate-learning-plan/ # AI learning plans                │
│  ├── revision-scheduler/ # Spaced repetition                    │
│  ├── check-achievements/ # Achievement tracking                 │
│  ├── track-session/   # Study session tracking                  │
│  ├── voice-to-text/   # Voice input processing                  │
│  └── send-push-notification/ # Push notifications               │
├─────────────────────────────────────────────────────────────────┤
│  Database Tables                                                │
│  ├── profiles         # User profiles                           │
│  ├── subjects         # NCTB subjects                           │
│  ├── student_progress # Per-subject progress                    │
│  ├── student_stats    # XP, streaks, study time                 │
│  ├── topic_mastery    # Bloom level per topic                   │
│  ├── assessments      # Assessment results                      │
│  ├── study_sessions   # Session tracking                        │
│  ├── learning_plans   # Generated study plans                   │
│  ├── revision_schedule # Spaced repetition                      │
│  ├── achievements     # Available achievements                  │
│  ├── user_achievements # Earned achievements                    │
│  ├── chat_conversations # AI tutor conversations                │
│  ├── chat_messages    # Conversation messages                   │
│  ├── offline_lessons  # Downloadable lessons                    │
│  └── leaderboard_entries # Public leaderboard                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: Users sign up with email, password, school, class, and version (Bangla/English)
2. **Personalization**: System generates learning plans based on profile and performance
3. **Learning Loop**: Study → Practice → Assess → Track → Revise
4. **AI Integration**: Edge functions orchestrate LLM calls for tutoring, quiz generation, and feedback
5. **Progress Sync**: All activity syncs to Supabase with offline-first support

### Bloom's Taxonomy Enforcement

All content follows Bloom's levels in order:
1. Remember → 2. Understand → 3. Apply → 4. Analyze → 5. Evaluate → 6. Create

Students cannot skip levels unless mastery is proven through assessments.

---

## License

This project is proprietary. All rights reserved.
