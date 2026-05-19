# UI Context

## Theme

Dark only. No light mode. The design language is a focused technical
workspace — deep neutral backgrounds, subtle surface layering, and a
single vivid accent for interactive elements. The aesthetic references
Linear and Vercel's dashboard: high information density without feeling
cluttered. Every element earns its place.

## Colors

All components must use these CSS custom property tokens.
No hardcoded hex values anywhere in component files.
Defined in `app/globals.css` under `:root`.

| Role              | CSS Variable          | Value     |
| ----------------- | --------------------- | --------- |
| Page background   | `--bg-base`           | `#0a0a0a` |
| Surface (cards)   | `--bg-surface`        | `#111111` |
| Surface elevated  | `--bg-surface-raised` | `#1a1a1a` |
| Border default    | `--border-default`    | `#262626` |
| Border subtle     | `--border-subtle`     | `#1f1f1f` |
| Primary text      | `--text-primary`      | `#ededed` |
| Muted text        | `--text-muted`        | `#737373` |
| Subtle text       | `--text-subtle`       | `#525252` |
| Primary accent    | `--accent-primary`    | `#7c3aed` |
| Accent hover      | `--accent-hover`      | `#6d28d9` |
| Accent muted bg   | `--accent-muted-bg`   | `#1e1030` |
| Success           | `--state-success`     | `#22c55e` |
| Error             | `--state-error`       | `#ef4444` |
| Warning           | `--state-warning`     | `#f59e0b` |
| Code background   | `--code-bg`           | `#161616` |

## Typography

| Role          | Font         | Variable       | Notes                          |
| ------------- | ------------ | -------------- | ------------------------------ |
| UI text       | Geist Sans   | `--font-sans`  | All body, labels, headings     |
| Code / mono   | Geist Mono   | `--font-mono`  | Code blocks, inline code, keys |

Font sizes follow Tailwind defaults. Lesson body text uses `text-base`
(16px). Code blocks use `text-sm` (14px). UI labels use `text-sm`.
Headings inside lessons use `text-xl` / `text-2xl`.

## Border Radius

| Context              | Tailwind Class   |
| -------------------- | ---------------- |
| Buttons, badges, tags | `rounded-md`    |
| Cards, panels, inputs | `rounded-lg`    |
| Modals, dialogs       | `rounded-xl`    |
| Full pill (progress)  | `rounded-full`  |

## Component Library

shadcn/ui on top of Tailwind CSS. Components live in `components/ui/`.
Always add new components via `npx shadcn add <component>` — never
write shadcn primitives from scratch or edit files in `components/ui/`
manually.

Custom product components live in `components/` (e.g.
`components/LessonCard.tsx`, `components/RoadmapView.tsx`). These
compose shadcn primitives and accept props — no data fetching inside.

## Layout Patterns

- **Lesson page**: Two-column layout. Left column (flex-1): lesson
  content, exercise, quiz. Right column (w-80, fixed): AI tutor chat
  panel. On mobile, tutor collapses to a floating button that opens a
  drawer.
- **Roadmap page**: Single centered column (max-w-3xl). Vertical list
  of topic sections, each containing an ordered list of lesson cards.
  Progress indicators on each card (not started / in progress / done).
- **Import page**: Centered single-column form (max-w-lg). URL input
  at top, skill level selector, goal text field, import button. Full
  streaming progress log below the button during crawl and generation.
- **Dashboard**: Sidebar layout. Left nav (w-56) with logo, nav links,
  and user avatar at bottom. Main area shows recent courses as a grid
  of cards.
- **Sidebars**: Fixed width with `border-r border-[--border-default]`
  separator. No shadow — separation is done with border only.
- **Modals**: Centered overlay with `backdrop-blur-sm` and
  `bg-black/60` scrim. Rounded-xl card.

## Component Behavior Notes

- **Streaming text**: Use a `StreamingText` component that renders
  progressively as tokens arrive. Show a blinking cursor while
  streaming. Do not show a spinner — the text itself indicates loading.
- **Progress indicators on lesson cards**: Three states visualized
  with a left border color: `--border-subtle` (not started),
  `--accent-primary` (in progress), `--state-success` (done).
- **Quiz questions**: Rendered as radio button groups. Correct answer
  reveals with a green highlight, wrong with red, after submission.
  No retry in MVP.
- **Code blocks**: Dark background `--code-bg`, syntax highlighting
  via `shiki`. Language label in top-right corner of the block.
  Copy button appears on hover.
- **Import progress log**: Monospace text, `text-sm`, lines stream
  in one at a time as crawl and generation progress. Shows step names
  and counts — not raw logs.

## Icons

Lucide React. Stroke-based icons only.
- Inline with text: `h-4 w-4`
- Standalone buttons and nav items: `h-5 w-5`
- Empty state illustrations: `h-10 w-10`, `--text-muted` color

No icon libraries other than Lucide.
