# Design Brief: Attendix Dashboard — Electronics & Telecommunication Department

## Direction

Attendix — Professional academic attendance management system with QR-based check-in, mobile-first capture flow, and institutional data dashboard.

## Tone

Refined, efficient, accessible. Educational institution authority paired with modern tech clarity. No playfulness; professional accountability with subtle visual rhythm.

## Differentiation

Three distinct visual contexts: (1) Dashboard — card-based, tabbed student sections with attendance badges; (2) Timetable editor — form-driven, weekly template management; (3) Attendance flow — minimal, distraction-free QR capture (mobile-first, single-purpose).

## Color Palette

| Token | OKLCH | Role |
|---|---|---|
| Background | `0.12 0.018 240` | Dark navy page background |
| Card | `0.15 0.022 240` | Surface for student cards, sections |
| Text Primary | `0.95 0.012 240` | Headings, labels, main content |
| Text Secondary | `0.58 0.02 240` | Hints, secondary info |
| Primary | `0.62 0.22 264` | Main buttons, active tab indicator |
| Success | `0.65 0.2 150` | Attendance present badge |
| Warning | `0.75 0.15 85` | Attendance pending or partial |
| Destructive | `0.58 0.22 27` | Absence, errors |
| Border | `0.24 0.03 240` | Input focus, card separators |
| Muted | `0.2 0.022 240` | Disabled states, inactive tabs |

## Typography

- Display: Space Grotesk — headings, section titles
- Body: Plus Jakarta Sans — form labels, student names, content
- Scale: Hero text-4xl font-bold; h2 text-2xl; label text-sm; body text-base

## Elevation & Depth

Card-based hierarchy with solid card backgrounds, border edges, shadow-md on interactive cards, shadow-lg on modals. No gradients; utilitarian restraint.

## Structural Zones

| Zone | Background | Border | Notes |
|---|---|---|---|
| Sidebar | sidebar-bg | sidebar-border | Fixed left navigation |
| Header | card | border | Top bar with title and mode toggle |
| Content | background | none | Full scrollable area |
| Student card | card | border | Rounded, PRN plus attendance badge |
| Timetable | card | border | Form grid with semester selector |
| Attendance | card | border | Centered QR card, mobile-first |

## Spacing & Rhythm

Vertical rhythm 24px between sections; 16px card padding; 8px internal gaps. Horizontal 16px mobile, 24px tablet. Tab gaps 12px. Touch targets minimum 44px. Border-radius 0.75rem throughout.

## Component Patterns

- Tabs: Active (underline primary), inactive (muted text)
- Cards: bg-card with border, shadow-md, rounded
- Badges: Success green, warning orange, absent red with icon
- Buttons: Primary indigo with opacity hover; secondary muted
- Inputs: Focus ring primary color, labeled form fields
- Forms: Labeled inputs with section dividers

## Motion

- Entrance: Fade-in 200ms on load
- Tab switch: Fade 150ms out then in
- Hover: Opacity 90% no color shift
- Press: scale-95 feedback
- Focus: Ring-2 primary no offset

## Constraints

- Dark mode primary, light mode via CSS variable overrides
- Mobile-first responsive breakpoints
- ARIA labels on all interactive elements
- Focus states meet AA contrast minimum
- No external gradients; utilitarian design
- Dashboard max-width 1400px; attendance flow 400px

## Signature Detail

Attendance flow page strips all dashboard chrome—no sidebar, no header, centered card on dark background—creating jarring context switch that signals capture mode vs browse mode nonverbally.
