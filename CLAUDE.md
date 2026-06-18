# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project

CafeOps is an Expo React Native + TypeScript + Supabase application for cafe operations management.

### Core Features

* Employee management
* Multi-location support
* Role-based permissions
* 14-day performance score cycles
* Employee rankings
* Notifications
* Recipe management

## Tech Stack

### Frontend

* Expo
* React Native
* TypeScript
* Expo Router
* NativeWind

### Backend

* Supabase
* PostgreSQL
* Row Level Security (RLS)

### State Management

* TanStack Query
* Zustand only when necessary

### Forms

* React Hook Form
* Zod

### Notifications

* Expo Notifications

## Commands

```terminal
npm start
npm run ios
npm run android
npm run web
npm run lint
```

## Architecture

### Source Layout

```file
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
```

### Data Flow

1. Screens should stay thin.
2. Supabase queries belong in services.
3. Data fetching belongs in hooks.
4. Components should not call Supabase directly.
5. Business logic belongs in services or utils.
6. UI components should be reusable and presentational whenever possible.

## Development Rules

### General

* This is a solo project.
* Prefer simplicity over scalability.
* Build the simplest working solution first.
* Do not introduce unnecessary abstractions.
* Do not create complex patterns unless they solve a real problem.
* When unsure, ask before coding.

### Before Implementing a Feature

1. Explain the implementation plan.
2. List files that will be modified.
3. Ask for confirmation before database schema changes.

### For Large Changes

* Explain tradeoffs.
* Explain alternatives.
* Wait for approval.

## TypeScript Rules

* Enable strict mode.
* Use TypeScript only.
* Avoid `any`.
* Prefer `unknown` over `any`.
* Use `type` for DTOs and API responses.
* Use `interface` for component props.
* Explicitly type function parameters and return values when not obvious.

## React Native Rules

* Use Expo Router.
* Use functional components only.
* Prefer NativeWind for styling.
* Avoid large screens with mixed responsibilities.
* Prefer composition over inheritance.
* Use large touch targets.
* Minimize typing for shift-based workflows.
* Avoid unnecessary animations.

## Component Rules

* Props interfaces are named `[ComponentName]Props`.
* Components should remain pure whenever possible.
* Side effects belong in hooks.
* Fetching belongs in hooks.
* Supabase access belongs in services.
* Reuse existing components before creating new ones.
* Keep screens visually consistent.
* Follow existing spacing and typography conventions.

## Data Fetching Rules

* Server state belongs in TanStack Query.
* Do not duplicate server state in Zustand.
* Use Zustand only for UI state and temporary client state.
* Prefer custom hooks wrapping React Query.

## Service Layer Rules

Services should:

* Contain all Supabase queries.
* Return typed results.
* Never return raw database rows directly to UI.
* Handle database mapping when needed.
* Handle Supabase errors explicitly.

## Error Handling

* Never silently swallow errors.
* Show user-friendly messages in UI.
* Log unexpected errors.
* Do not expose sensitive technical details to users.

## Form Rules

* Use React Hook Form.
* Use Zod for validation.
* Validate before submission.
* Keep validation schemas close to forms.

## Import Rules

* Prefer path aliases over deep relative imports.
* Avoid imports like `../../../../components`.
* Use aliases such as:

  * `@/components`
  * `@/services`
  * `@/hooks`
  * `@/types`
  * `@/utils`
  * `@/constants`

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Never hardcode keys.

## Security Rules

* Never trust client-side role checks.
* Frontend role checks are for UX only.
* All authorization must be enforced through RLS policies.
* Backend security always comes from RLS.
* Never expose service role keys in the client.

## Database Rules

### Core Tables

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

### Data Rules

* `profiles.id` references `auth.users.id`.
* `profiles.role` is organization-wide.
* Employees may belong to multiple locations.
* `score_entries` are immutable.
* `score_entries` must never be updated or deleted.
* Corrections must create a new record using `correction_for`.
* Rankings are calculated from summed points within a 14-day cycle.
* All score history must be preserved.

### Database Changes

Before creating a migration:

1. Explain why the change is needed.
2. Show the SQL migration.
3. Explain the rollback strategy.
4. Wait for approval.

## Role Hierarchy

### Roles

1. staff
2. supervisor
3. location_manager
4. general_manager
5. owner

### Permission Rules

* Staff can view their own scores and rankings.
* Supervisors can create score entries.
* Location Managers manage employees at assigned locations.
* General Managers manage all locations.
* Owners have full access.

## Scoring System

### Score Sections

* daily_performance
* manager_review
* positive_addup
* management_people

### Examples

```plaintext
Late / late notice -5
Bad Google review -5
Good Google review +5
Help cover for coworkers +2
Fail to update daily record -1
```

### Scoring Rules

* Scores are additive point records.
* Scores are not ratings.
* Leaderboards use `SUM(points)`.
* All score history must be preserved.

## UI Principles

* Mobile first.
* Fast to use during shifts.
* Prioritize supervisor workflows.
* Large touch targets.
* Clear hierarchy.
* Minimize typing.
* Avoid unnecessary animations.

## Simplicity Rules

Before introducing any of the following:

* Context
* Zustand
* Custom abstraction
* Generic utility
* New dependency

Ask:

> Is this solving a real problem right now?

Prefer duplication over premature abstraction.

Rule of Three applies:

> Only abstract after the same pattern appears at least three times.

## MVP Priority

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

Do not build advanced features before the MVP is working.
