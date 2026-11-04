# Accessibility

CafeOps targets [WCAG 2.1 Level AA](https://www.w3.org/TR/WCAG21/) on web. This document records what was audited, what changed and why, and what has not been verified. It does not claim full conformance: that would require the manual testing listed under [Not yet verified](#not-yet-verified).

## The finding that started this

An automated Lighthouse audit of the login screen scored **93/100**, which looked close to done.

Reading the accessibility tree told a different story. All 48 `Pressable` components rendered as a `<div>` with no role, so a screen reader had no way to tell a button from plain text. Inputs were named only by their placeholder, form errors were never announced, and pages had no title, headings, or landmarks.

Automated rules passed these controls because a focusable `<div>` with text is not, by itself, a rule violation. A high score measured how little the tool could detect, not how usable the app was.

## Before and after

| Check | Before | After |
| --- | --- | --- |
| Interactive elements exposing a role | 0 of 48 `Pressable`s in source | All, enforced in CI |
| Space key on checkboxes and radios | Not handled | Works |
| Keyboard focus after activating a control | Dropped by a global blur handler | Kept, except when following a link |
| Focus and announcement on route change | Nothing announced | Focus moves to the screen's `<h1>`; tab title updates |
| Page title | Missing | Unique per screen |
| Heading structure | None | `<h1>` on each screen, `<h2>` for sections |
| Landmarks | None | `<main>` |
| Form errors | Visual only | `role="alert"`, `aria-invalid`, `aria-describedby` |
| Login field labels | Placeholder only | Visible labels |
| Placeholder contrast | 2.43:1 | 4.63:1 |
| Input border contrast | 1.47:1 | 4.63:1 or better |
| Smallest measured target | 50×15 px ("View All") | 44×44 px |
| Lighthouse accessibility | 93 (login only) | 100 on all 15 screens tested |

The 15 screens were tested with Lighthouse in snapshot mode against the local development server, using mobile emulation and test accounts for the relevant roles. A separate script checked each screen's rendered text contrast, target sizes, roles, names, and heading order, and found no violations in the final pass.

## Decisions

### Use `role` and `aria-*` rather than a wrapper component

react-native-web maps these props to native elements: `role="button"` renders a real `<button>`, which brings browser behaviour for free. Adding the props in place kept existing components and required no new dependency.

### Move focus to the heading on route change

A client-side route change is silent to screen readers. `ScreenTitle` renders the `<h1>`, updates the tab title, and moves focus to the heading whenever a screen gains focus, so the new screen is announced and the next Tab starts at the new content.

### Fill the library's keyboard gaps in one place

react-native-web ignores Space on `checkbox` and `radio`, and leaves Enter on `role="link"` to the browser, which does nothing for a `<div>`. A single capture-phase listener in the root layout handles both. The decision logic is a pure function with unit tests.

The Enter gap was a regression from this work. Adding `role="link"` silently broke keyboard navigation for every link, and static checks and Lighthouse could not catch it. Pressing the keys in a real browser did. This is why the keyboard paths are tested by hand and the logic now has a regression test.

### Keep accessible names consistent with visible text

The first version gave some rows a descriptive `aria-label` that differed from the visible text, which fails WCAG 2.5.3 (Label in Name): a voice-control user saying what they see would not match the control. Those rows now derive their name from their content, with decorative parts hidden using `aria-hidden`.

### Enforce the conventions in CI

`src/__tests__/accessibilityConventions.test.ts` fails the build when a `Pressable` has no role, when an input, switch, or loading indicator has no name, or when a known low-contrast text color returns. It also computes WCAG contrast for the main color pairs. The checks were confirmed to fail on a deliberately broken file.

These are static checks. They catch a missing role, not a wrong one, and do not replace manual testing.

## WCAG criteria addressed

| Criterion | How |
| --- | --- |
| 1.1.1 Non-text Content | `alt` on photos; decorative icons hidden; meaningful icons labelled |
| 1.3.1 Info and Relationships | Headings, landmarks, grouped controls, programmatic errors |
| 1.4.3 Contrast (Minimum) | Text colors changed to meet 4.5:1 |
| 1.4.11 Non-text Contrast | Input and checkbox borders meet 3:1 |
| 2.1.1 Keyboard | Enter and Space activate every control tested |
| 2.4.2 Page Titled | Unique title per screen |
| 2.4.3 Focus Order | Focus moved on navigation and kept on toggles |
| 2.4.7 Focus Visible | 2 px focus outline across the app |
| 2.5.3 Label in Name | Names contain the visible text |
| 2.5.8 Target Size (2.2 AA) | 44 px targets, above the 24 px minimum |
| 3.3.1 Error Identification | Errors identified in text and linked to their fields |
| 3.3.2 Labels or Instructions | Visible labels on all forms |
| 4.1.2 Name, Role, Value | Roles, names, and `aria-checked` / `aria-expanded` state |
| 4.1.3 Status Messages | `role="alert"` for errors; live region for score submission |

## Not yet verified

- **Real screen readers.** No testing with VoiceOver, TalkBack, or NVDA. The accessibility tree shows what is exposed, not how it sounds in use.
- **Native iOS and Android builds.** Only the web build was tested. Some ARIA props are web-only, and `aria-live` is not announced on iOS.
- **Photo viewer and photo picker.** The code was updated, but the test accounts had no photos to open, so the dialog and its focus handling were not exercised.
- **Score submission announcement.** Submitting would create permanent score records, which cannot be deleted, so the live region was not observed firing.
- **Browser zoom.** Reflow was checked at 320 px on the score entry screen only.

## Known gaps

- **Arrow keys in radio groups.** Radios work with Tab and Space, but the full ARIA pattern also uses arrow keys.
- **Confirmation dialogs on web.** `Alert.alert` does nothing in react-native-web. Deactivating an employee on web never saves, because the save runs from the dialog, and a successful invitation shows no confirmation. This is a functional bug as well as an accessibility one.
- **Employee detail error state.** It has no back link and no `<h1>`.
- **List semantics.** Lists are visually grouped but are not exposed as lists.

## Manual test script

Run this before a release, with VoiceOver on macOS (Cmd+F5) in Safari or Chrome.

1. **Sign in with an empty form.** Both errors are announced, and each field reports as invalid.
2. **Sign in.** The home heading is announced.
3. **Open the rotor (VO+U).** Headings and landmarks are listed.
4. **Go to Score Entry using only the keyboard.** The screen title is announced on arrival.
5. **Search for an employee and press Space on the result.** It is announced as a checked checkbox, and focus stays on it.
6. **Expand a category section.** Its expanded state is announced.
7. **Submit a test entry, on a test environment.** The result is announced without moving focus.

## Running the checks

```bash
npx tsc --noEmit
npm run lint
npm test
```

CI runs all three on every pull request and on pushes to `main`.
