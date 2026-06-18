This file provides guidance to Claude Code when working with this repository.

Project

CafeOps is an Expo React Native + TypeScript + Supabase application for cafe operations management.

Core features:

* Employee management
* Multi-location support
* Role-based permissions
* 14-day performance score cycles
* Employee rankings
* Notifications
* Recipe management

⸻

Tech Stack

Frontend

* Expo
* React Native
* TypeScript
* Expo Router

Backend

* Supabase
* PostgreSQL
* Row Level Security (RLS)

State Management

* TanStack Query
* Zustand (only when necessary)

Notifications

* Expo Notifications

⸻

Commands

npm start
npm run ios
npm run android
npm run web
npm run lint

⸻

Architecture

Source Layout

app/
  (auth)/
  (tabs)/
  employees/
  scores/
  recipes/
  notifications/
src/
  components/
    atoms/
    molecules/
    organisms/
  hooks/
  services/
  lib/
  types/
  constants/
  utils/

Data Flow

1. Screens should stay thin.
2. Supabase queries belong in services.
3. Data fetching belongs in hooks.
4. Components should not call Supabase directly.
5. Business logic belongs in services or utils.
6. UI components should be reusable and presentational whenever possible.

⸻

Database Rules

Core tables:

* profiles
* locations
* employee_locations
* invitations
* score_cycles
* score_categories
* score_entries
* notifications
* recipe_categories
* recipes
* recipe_history

Rules:

* profiles.id references auth.users.id
* profiles.role is organization-wide
* employees may belong to multiple locations
* score_entries are immutable
* score_entries must never be updated or deleted
* corrections must create a new record using correction_for
* rankings are calculated from summed points within a 14-day cycle

⸻

Role Hierarchy

Roles:

1. staff
2. supervisor
3. location_manager
4. general_manager
5. owner

Rules:

* Staff can view their own scores and rankings
* Supervisors can create score entries
* Location Managers manage employees at assigned locations
* General Managers manage all locations
* Owners have full access

⸻

Scoring System

Score Sections:

* daily_performance
* manager_review
* positive_addup
* management_people

Examples:

Late / late notice

-5

Bad Google review

-5

Good Google review

+5

Help cover for coworkers

+2

Fail to update daily record

-1

Rules:

* Scores are additive point records
* Scores are not ratings
* Leaderboards use SUM(points)
* All score history must be preserved

⸻

React Native Rules

* Use Expo Router
* Use functional components only
* Use TypeScript only
* Do not use any unless absolutely necessary
* Prefer NativeWind for styling
* Avoid large screens with mixed responsibilities
* Prefer composition over inheritance

⸻

Component Conventions

* Props interfaces are named [ComponentName]Props
* Components should remain pure whenever possible
* Side effects belong in hooks
* Fetching belongs in hooks
* Supabase access belongs in services
* Use explicit types

⸻

Environment Variables

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

Never hardcode keys.

⸻

UI Principles

* Mobile first
* Fast to use during shifts
* Minimize typing
* Prioritize supervisor workflows
* Large touch targets
* Clear hierarchy
* Avoid unnecessary animations

⸻

MVP Priority

Build features in this order:

1. Authentication
2. Current User Profile
3. Employee Management
4. Location Assignment
5. Score Categories
6. Score Entry
7. Ranking
8. Notification Center
9. Recipe Management

Do not build advanced features before MVP is working.

⸻

Development Rules

Before implementing a feature:

1. Explain the implementation plan
2. List files that will be modified
3. Ask for confirmation before database schema changes

For large changes:

* Explain tradeoffs
* Explain alternatives
* Wait for approval

⸻

Important

This is a solo project.

Prefer simplicity over scalability.

Do not introduce unnecessary abstractions.

Do not create complex patterns unless they solve a real problem.

Build the simplest working solution first.

When unsure, ask before coding.
