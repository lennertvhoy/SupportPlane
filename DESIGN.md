# SupportPlane Design System

> Enforceable visual contract for dark enterprise cockpit UI.
> All colours reference `apps/web/tailwind.config.ts` tokens.

---

## 1. Design Intent

SupportPlane is a dark, operationally trustworthy governance cockpit where every colour choice signals system state, trust boundary, and actionability.

---

## 2. Visual Principles

1. **Dark by default** — `cockpit-950/900/800` hierarchy only; no light-mode surfaces.
2. **Calm, not alarming** — status colours are used sparingly; most UI is neutral.
3. **Governed and explicit** — every action, label, and status carries its authority level visibly.
4. **Operationally trustworthy** — text is always readable; contrast is never sacrificed for aesthetics.
5. **Clear boundary signalling** — mock, sandbox, and production states are distinguishable by icon/prefix **and** colour, never colour alone.
6. **Keyboard-first confidence** — every interactive element shows a visible, high-contrast focus indicator.
7. **Disabled is explicit** — disabled states use multiple visual cues; opacity is never the sole signal.

---

## 3. Colour / Token Rules

### Background Hierarchy

| Layer    | Token                | Hex       | Usage                                |
| -------- | -------------------- | --------- | ------------------------------------ |
| Deepest  | `bg-cockpit-950`     | `#030712` | Root page background, modal backdrop |
| Base     | `bg-cockpit-900`     | `#0b0f19` | App shell, login card, sidebar       |
| Surface  | `bg-cockpit-800`     | `#111827` | Panels, cards, elevated surfaces     |
| Elevated | `bg-cockpit-700`     | `#1f2937` | Active nav item, hovered rows        |
| Border   | `border-cockpit-700` | `#1f2937` | Default borders                      |
| Divider  | `border-cockpit-800` | `#111827` | Subtle separators                    |

### Text Hierarchy (with contrast requirements)

| Level         | Token              | Hex       | Minimum Background      | Contrast Requirement                |
| ------------- | ------------------ | --------- | ----------------------- | ----------------------------------- |
| Primary       | `text-cockpit-100` | `#f3f4f6` | `cockpit-900` or darker | ≥ 15:1 (proven)                     |
| Secondary     | `text-cockpit-200` | `#e5e7eb` | `cockpit-900` or darker | ≥ 13:1 (proven)                     |
| Label         | `text-cockpit-300` | `#d1d5db` | `cockpit-800` or darker | ≥ 8:1 (proven)                      |
| Metadata      | `text-cockpit-400` | `#9ca3af` | `cockpit-800` or darker | ≥ 5.5:1 (proven)                    |
| **Forbidden** | `text-cockpit-500` | `#4b5563` | **Any dark bg**         | **FAILS** (~2.8:1 on `cockpit-950`) |

**Rule:** `text-cockpit-500` MUST NOT be used on `cockpit-950`, `cockpit-900`, `cockpit-800`, or `cockpit-700`. It is permitted only on `cockpit-100` or lighter surfaces (≥ 5.9:1).

### Accent Rules

| Token                  | Hex       | Contrast on white   | Contrast on `cockpit-950` | Usage                                   |
| ---------------------- | --------- | ------------------- | ------------------------- | --------------------------------------- |
| `accent` / `bg-accent` | `#3b82f6` | 3.62:1 **FAILS** AA | 5.7:1 **PASSES**          | Accent on dark bg only                  |
| `accent-dark`          | `#2563eb` | 5.3:1 **PASSES** AA | 7.2:1 **PASSES**          | **Preferred for buttons on light text** |
| `accent-light`         | `#60a5fa` | 2.4:1 **FAILS**     | 11.5:1 **PASSES**         | Focus rings, highlights on dark         |

**Rule:** Buttons with `text-white` MUST use `bg-accent-dark` (`#2563eb`) or darker, not `bg-accent` (`#3b82f6`), to achieve ≥ 4.5:1.

### Status Colours

All status text on dark backgrounds (`cockpit-950`–`cockpit-800`) MUST meet WCAG AA normal text (≥ 4.5:1).

| Status  | Text Token                        | Hex       | Proven Contrast on `cockpit-950` | Usage                              |
| ------- | --------------------------------- | --------- | -------------------------------- | ---------------------------------- |
| Success | `text-success` / `text-green-400` | `#4ade80` | 7.8:1                            | Success states, healthy indicators |
| Warning | `text-warning` / `text-amber-400` | `#fbbf24` | 8.2:1                            | Warnings, sandbox labels           |
| Danger  | `text-danger` / `text-red-400`    | `#f87171` | 7.1:1                            | Errors, destructive actions        |
| Info    | `text-info` / `text-blue-400`     | `#60a5fa` | 11.5:1                           | Informational states               |

**Badge solid background rule:** For `text-xs` badge text, prefer **solid dark backgrounds with light text**:

- Success: `bg-green-900 text-green-400`
- Warning: `bg-amber-950 text-amber-400`
- Danger: `bg-red-950 text-red-400`
- Info: `bg-blue-950 text-blue-400`

**Do NOT use** semi-transparent backgrounds like `bg-red-900/40` for badge text — the blended background makes contrast unpredictable across surfaces.

### Border Rules

- Default: `border-cockpit-700`
- Subtle: `border-cockpit-800`
- Accent: `border-accent-dark`
- Error: `border-red-700`
- Warning: `border-amber-700`

---

## 4. Typography Hierarchy

| Element     | Size             | Weight          | Line Height | Colour Token       | Min Contrast |
| ----------- | ---------------- | --------------- | ----------- | ------------------ | ------------ |
| Page title  | `text-lg` (18px) | `font-semibold` | 1.4         | `text-cockpit-100` | ≥ 15:1       |
| Panel title | `text-sm` (14px) | `font-semibold` | 1.4         | `text-cockpit-300` | ≥ 8:1        |
| Body        | `text-sm` (14px) | `font-normal`   | 1.5         | `text-cockpit-200` | ≥ 13:1       |
| Label       | `text-xs` (12px) | `font-medium`   | 1.4         | `text-cockpit-300` | ≥ 8:1        |
| Metadata    | `text-xs` (12px) | `font-normal`   | 1.4         | `text-cockpit-400` | ≥ 5.5:1      |
| Caption     | `text-[11px]`    | `font-normal`   | 1.3         | `text-cockpit-400` | ≥ 5.5:1      |
| Badge       | `text-xs` (12px) | `font-medium`   | 1           | varies             | ≥ 4.5:1      |

**Rule:** Any text smaller than `text-sm` (14px) that is not bold MUST meet ≥ 4.5:1 contrast.

---

## 5. Spacing / Surface Rules

| Token / Value                       | Usage                           |
| ----------------------------------- | ------------------------------- |
| `p-4` (16px)                        | Default panel padding           |
| `p-5` (20px)                        | Modal/card padding              |
| `px-4 py-3` (16×12px)               | Panel header padding            |
| `rounded` (4px)                     | Buttons, inputs, small elements |
| `rounded-lg` (8px)                  | Panels, cards, modals           |
| `border` (1px) `border-cockpit-700` | Default panel/card border       |
| `shadow-sm`                         | Panel elevation (subtle)        |
| `shadow-lg`                         | Modal elevation                 |

**Surface stack:**

```
Page:      bg-cockpit-950
Card:      bg-cockpit-900  border-cockpit-700  rounded-lg
Panel:     bg-cockpit-800/60  border-cockpit-700  rounded-lg  shadow-sm
Panel hdr: border-b border-cockpit-700
```

---

## 6. Button Rules

### Primary Button

```
bg-accent-dark text-white
rounded px-3 py-2
text-sm font-medium
hover:bg-accent-dark/90
focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950
```

- **Contrast:** `text-white` on `bg-accent-dark` = 5.3:1 ≥ 4.5:1 ✓
- **Focus:** 2px ring, `accent-light` (`#60a5fa`), with 2px offset against `cockpit-950`

### Secondary Button

```
bg-cockpit-800 text-cockpit-100 border border-cockpit-600
rounded px-3 py-2
text-sm font-medium
hover:bg-cockpit-700 hover:border-cockpit-500
focus-visible:ring-2 focus-visible:ring-cockpit-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950
```

- **Contrast:** `text-cockpit-100` on `bg-cockpit-800` = 15.4:1 ✓

### Danger Button

```
bg-red-700 text-white
hover:bg-red-800
focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950
```

- **Contrast:** ≥ 7:1 ✓

### Icon-Only Button

- MUST have `aria-label` attribute
- MUST have `title` attribute for tooltip
- Minimum touch target: 36×36px (`h-9 w-9`)
- Example:

```jsx
<button aria-label="Close panel" title="Close panel" className="h-9 w-9 ...">
  <X size={16} />
</button>
```

### Disabled Button

- See Section 10 (Disabled-State Rules)

---

## 7. Badge / Status Rules

**Contrast mandate:** Every badge variant MUST meet WCAG AA normal text contrast (≥ 4.5:1) against its background.

### Enforceable Badge Variants

| Variant | Classes                                                     | Text on BG Contrast |
| ------- | ----------------------------------------------------------- | ------------------- |
| Default | `bg-cockpit-700 text-cockpit-200`                           | ~13:1 ✓             |
| Success | `bg-green-900 text-green-400`                               | ~7.8:1 ✓            |
| Warning | `bg-amber-950 text-amber-400`                               | ~8.2:1 ✓            |
| Danger  | `bg-red-950 text-red-400`                                   | ~7.1:1 ✓            |
| Info    | `bg-blue-950 text-blue-400`                                 | ~11.5:1 ✓           |
| Muted   | `bg-cockpit-800 text-cockpit-400 border border-cockpit-700` | ~5.5:1 ✓            |

### Prohibited Patterns

- `bg-*-900/40` with `text-*-300` — semi-transparent bg makes contrast unpredictable
- `bg-green-500 text-white` on small badges — green-500 on white text may fail depending on exact shade

### Size Rule

- Badges use `text-xs` (12px) `font-medium`
- Because 12px is < 14px and not bold by default, it MUST meet normal text contrast (≥ 4.5:1)

---

## 8. Mock / Sandbox / Real Boundary Label Rules

Every environment indicator MUST use a **non-colour indicator** (icon or text prefix) plus colour.

| State          | Prefix     | Icon                          | Background       | Text               | Border               |
| -------------- | ---------- | ----------------------------- | ---------------- | ------------------ | -------------------- |
| **Mock**       | `MOCK:`    | Flask (`<Flask size={12} />`) | `bg-amber-950`   | `text-amber-400`   | `border-amber-800`   |
| **Sandbox**    | `SANDBOX:` | Beaker / alert triangle       | `bg-amber-950`   | `text-amber-400`   | `border-amber-800`   |
| **Local Dev**  | `LOCAL:`   | Laptop / code                 | `bg-cockpit-800` | `text-cockpit-300` | `border-cockpit-700` |
| **Production** | `LIVE:`    | Shield-check                  | `bg-green-950`   | `text-green-400`   | `border-green-800`   |

### Banner Component Pattern

```jsx
<div className="rounded border border-amber-800 bg-amber-950 px-3 py-2 text-xs text-amber-400">
  <Flask size={12} className="inline mr-1" />
  <strong>MOCK:</strong> No production data. Simulated responses.
</div>
```

---

## 9. Focus / Keyboard Rules

1. **All interactive elements** (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, `[role="button"]`) MUST have a visible focus indicator.
2. **Minimum specification:** 2px outline or ring.
3. **Focus colour:** `accent-light` (`#60a5fa`) or `cockpit-300` (`#d1d5db`) — MUST contrast ≥ 3:1 with the element's background.
4. **Offset:** Use `ring-offset-2 ring-offset-cockpit-950` on dark surfaces to ensure the ring is visible.
5. **Preferred Tailwind pattern:**

```
focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none
```

6. **No browser default suppression** without replacement — `outline-none` is permitted ONLY when a `ring` or custom `box-shadow` focus style is applied in the same selector.
7. **Tab order:** Must be logical and visible. Do not use `tabIndex` > 0.

---

## 10. Disabled-State Rules

**MANDATE:** Disabled states MUST use reduced opacity **PLUS** at least one additional visual difference.

### Permitted Patterns

1. **Muted + opacity + cursor:**

```
bg-cockpit-900 text-cockpit-600 opacity-60 cursor-not-allowed
```

2. **Different background + muted text:**

```
bg-cockpit-900 text-cockpit-500 border border-cockpit-700 cursor-not-allowed
```

3. **Strikethrough + muted:**

```
bg-cockpit-800 text-cockpit-500 line-through cursor-not-allowed opacity-70
```

### Forbidden Patterns

- `opacity-50` alone with no background change, text change, or cursor change
- `cursor-not-allowed` alone
- Keeping the same background and text colours as the enabled state

### Sidebar Disabled Item Pattern

```
className={`
  flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium
  ${active ? 'bg-cockpit-700 text-white' : 'text-cockpit-300 hover:bg-cockpit-800 hover:text-cockpit-100'}
  ${disabled ? 'bg-cockpit-900 text-cockpit-600 cursor-not-allowed opacity-60' : ''}
`}
```

---

## 11. Error / Warning / Empty-State Rules

1. **Never colour-only** — error, warning, success, and info states MUST include an icon or explicit text label.
2. **Error text:** Minimum `text-red-400` (`#f87171`) on `cockpit-950` = 7.1:1 ✓
3. **Warning text:** Minimum `text-amber-400` (`#fbbf24`) on `cockpit-950` = 8.2:1 ✓
4. **Error banner pattern:**

```jsx
<div className="rounded border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-400">
  <AlertTriangle size={14} className="inline mr-1" />
  <strong>Error:</strong> {message}
</div>
```

5. **Empty state pattern:**

```jsx
<div className="flex flex-col items-center justify-center py-8 text-cockpit-400">
  <Inbox size={24} className="mb-2" />
  <p className="text-sm">No items found</p>
  <p className="text-xs text-cockpit-500">Add a connector to get started</p>
</div>
```

6. **Form error pattern:**

```jsx
<p className="mt-1 text-xs text-red-400" role="alert">
  <AlertCircle size={12} className="inline mr-1" />
  This field is required
</p>
```

---

## 12. Evidence / Screenshot Rules

Accessibility and visual changes MUST be captured as evidence per `AGENTS.md`:

1. **Contrast verification:** Use a browser DevTools contrast checker or axe DevTools on every changed component.
2. **Screenshot states to capture:**
   - Default state
   - Hover state
   - Focus state (keyboard-tabbed)
   - Disabled state
   - Error/warning state
3. **Focus screenshot requirement:** Capture a focused button/link to prove the focus ring is visible.
4. **Badge screenshot requirement:** Capture all badge variants on the actual background they appear on.
5. **Evidence folder:** `output/playwright/session-NNN-bl156-*` — max 20 files per folder.
6. **Tooling:** `npx playwright test` or manual browser capture. Include axe-core scan results if possible.

---

## 13. Do / Don't Examples

### 1. Button Contrast

- ✅ **DO:** `bg-accent-dark text-white` — 5.3:1, passes AA
- ❌ **DON'T:** `bg-accent text-white` — 3.68:1, fails AA normal text

### 2. Text on Dark Background

- ✅ **DO:** `text-cockpit-400` on `bg-cockpit-800` — 5.5:1, passes
- ❌ **DON'T:** `text-cockpit-500` on `bg-cockpit-900` — ~2.5:1, fails

### 3. Badge Backgrounds

- ✅ **DO:** `bg-red-950 text-red-400` — solid, predictable, passes
- ❌ **DON'T:** `bg-red-900/40 text-red-300` — blended bg, unpredictable contrast

### 4. Disabled States

- ✅ **DO:** `bg-cockpit-900 text-cockpit-600 cursor-not-allowed opacity-60` — multiple cues
- ❌ **DON'T:** `opacity-50` alone — single cue, unclear on some displays

### 5. Focus Indicators

- ✅ **DO:** `focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2`
- ❌ **DON'T:** `focus:outline-none` with no replacement ring/outline

---

## 14. Remaining Known Gaps

This design system does NOT yet cover:

1. **Form input styling** — focused, invalid, and placeholder states need explicit tokens
2. **Data table rules** — row hover, selection, sort indicators, empty states
3. **Modal / dialog overlay** — backdrop opacity, focus trap, close button rules
4. **Toast / notification system** — colours, positions, auto-dismiss timing
5. **Loading / skeleton states** — shimmer colours, animation rules
6. **Chart / data-viz colours** — accessible palette for dashboards
7. **Mobile responsive breakpoints** — sidebar collapse, touch target sizes
8. **Animation / motion** — reduced-motion preferences, transition durations
9. **Print styles** — not required for a cockpit but noted as uncovered
10. **Light mode** — explicitly out of scope; this system is dark-only

---

## Appendix: Quick Contrast Reference

| Foreground              | Background              | Ratio   | AA Normal |
| ----------------------- | ----------------------- | ------- | --------- |
| `#f3f4f6` (cockpit-100) | `#030712` (cockpit-950) | ~18.7:1 | ✅        |
| `#e5e7eb` (cockpit-200) | `#0b0f19` (cockpit-900) | ~15.4:1 | ✅        |
| `#d1d5db` (cockpit-300) | `#111827` (cockpit-800) | ~10.1:1 | ✅        |
| `#9ca3af` (cockpit-400) | `#111827` (cockpit-800) | ~5.5:1  | ✅        |
| `#4b5563` (cockpit-500) | `#0b0f19` (cockpit-900) | ~2.5:1  | ❌        |
| `#2563eb` (accent-dark) | `#ffffff`               | ~5.3:1  | ✅        |
| `#3b82f6` (accent)      | `#ffffff`               | ~3.68:1 | ❌        |
| `#f87171` (red-400)     | `#030712` (cockpit-950) | ~7.1:1  | ✅        |
| `#fbbf24` (amber-400)   | `#030712` (cockpit-950) | ~8.2:1  | ✅        |
| `#4ade80` (green-400)   | `#030712` (cockpit-950) | ~7.8:1  | ✅        |
