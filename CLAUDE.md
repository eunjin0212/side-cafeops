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

1. trainee
2. staff
3. supervisor
4. location_manager
5. general_manager
6. owner

### Employee Edit Rules

* All roles, including trainees, may edit their own personal information such as full name and phone.
* Email is read-only and cannot be edited from the employee profile form.
* Users must never edit their own role.
* Users must never edit their own location assignment.
* Role changes require actor rank strictly higher than the target employee (minimum actor rank: supervisor).
* Location changes require actor rank location_manager or above, AND actor rank >= the target employee's rank (minimum actor rank: location_manager — supervisors can edit an employee's role but never their location).
* Trainees and staff cannot edit another employee's role or location.
* Role hierarchy rules must use the centralized permission helpers in `src/constants/permissions.ts`.
* Do not hardcode role permission arrays inside screens.

### Permission Rules

* Trainees and Staff can view their own scores and rankings.
* Supervisors can create score entries for employees they are allowed to manage.
* Location Managers manage employees at their assigned locations.
* General Managers manage employees across all locations.
* Owners have full access.
* Role edits require actor rank strictly higher than the target employee (minimum actor rank: supervisor).
* Location edits require actor rank location_manager or above, AND actor rank >= the target employee's rank.
* Users cannot edit their own role or location assignment.
* Client-side permission checks are UX only; RLS is the source of truth for authorization.

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

* Base performance score is `200`.
* `BASE_SCORE` must use the centralized constant in `src/constants/scoring.ts`.
* Scores are additive point records.
* Scores are not ratings.
* Score delta is `SUM(score_entries.points)` within the active score cycle.
* Performance Score = `BASE_SCORE + SUM(score_entries.points)`.
* Positive Points = sum of score entries where `points > 0`.
* Negative Points = sum of score entries where `points < 0`.
* Rankings are ordered by summed score-entry points within the active 14-day cycle.
* Displayed ranking scores must include `BASE_SCORE`.
* Adding the same `BASE_SCORE` to every employee does not affect ranking order.
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

## Task Completion Rules

After every completed task:

* Provide a summary
* List created files
* List modified files
* Report TypeScript status
* Report lint status
* Suggest a git commit message

Format:

Recommended Commit Message:
feat: add employee service

Do not execute git commit.
Do not execute git push.

## Security Work Before Production

### RLS: target-rank enforcement on profiles UPDATE — done (2026-08-28)

A full RLS audit found and fixed several live authorization gaps, including this one. `profiles` UPDATE now enforces at the database level:

* Users cannot edit their own role, is_active, or email (self-edits of these columns are rejected regardless of caller).
* Role changes require actor rank strictly higher than the target's role (minimum actor rank: supervisor).
* `employee_locations` INSERT/UPDATE/DELETE require actor rank strictly higher than the target, or equal rank if the actor is location_manager+ (matching `canEditEmployeeLocation`); self-assignment is always rejected regardless of rank.
* `score_entries` INSERT requires points to match an active `score_categories` row and blocks self-scoring.
* `invitations` INSERT/UPDATE require the invited role to be strictly below the actor's own rank.
* `score_entries` and `employee_locations` SELECT are scoped to self / same-location coworkers / general_manager+owner, matching `profiles`.

Client-side permission checks (`src/constants/permissions.ts`) and RLS now represent the same business rules. See `supabase/migrations/20260828*.sql` for the fixes and their rationale.

**Still open (lower severity, not yet fixed):** SECURITY DEFINER functions have no explicit `search_path`; `get_leaderboard()` is not marked `STABLE`; the "who can see whom" location logic is implemented separately in the `profiles` policy and in `get_leaderboard()` rather than sharing one helper.

---

## Current MVP Status

### Completed / Implemented

* Authentication
* Current User Profile
* Employee Management
* Employee Location Assignment
* Employee Invitations
* Centralized Role Permissions
* Score Categories
* Score Entry
* Multi-employee / multi-score entry
* Score Entry Notes
* Score Entry Photos
* Basic Leaderboard
* Score RLS / Permission Audit

### Current Priority

1. My Score Dashboard
2. Update Leaderboard display to use `BASE_SCORE = 200`
3. Verify Score Cycle lifecycle
4. Notification Center
5. Complete Invitation signup flow
6. Recipe Management
7. Role-based QA
8. Production readiness

Do not build advanced features before the MVP is working.
