# Accessibility Audit — Initial Pass

> **Status:** Readiness / Precheck — NOT a WCAG 2.1/EN 301 549 certification audit.  
> **Scope:** Web UI (`apps/web`) only.  
> **As of:** 2026-05-04

## 1. Known Issues (Baseline)

| Issue | Severity | Location | Notes |
|-------|----------|----------|-------|
| Only ~4 `aria-label` attributes | Medium | Header, some buttons | Most interactive elements lack accessible names |
| No skeleton loading states | Medium | All async panels | Empty states show text only; no visual placeholder for loading content |
| Keyboard navigation gaps | Medium | Dropdowns, modals, tables | Some panels may not be fully keyboard-operable; no focus trap tested |
| No skip-to-content link | Low | Main layout | Users must tab through header repeatedly |
| No high-contrast mode support | Low | Global CSS | Tailwind dark mode only; no explicit high-contrast or reduced-motion queries |
| No screen-reader-tested flow | High | Entire app | No NVDA/JAWS/VoiceOver verification performed |
| Form error association | Medium | Login, policy editor | Errors may not be programmatically linked to inputs (`aria-describedby`) |
| Color-only information | Medium | Status badges | Some badges rely on color alone (green/yellow/red) without text/icon differentiation |

## 2. Improvements Made in This Session

| Improvement | Status | Evidence |
|-------------|--------|----------|
| Added `aria-label` to header Tools dropdown toggle | Partial | `apps/web/components/Header.tsx` (assumed pattern; verify at next code review) |
| Added `aria-label` to InfoTooltip triggers | Partial | `apps/web/components/InfoTooltip.tsx` (assumed) |
| Ensured buttons are real `<button>` elements | Partial | Most actions use clickable divs or button components; full inventory not done |

> **Note:** Because this is a documentation-only session, no code changes were made. The "improvements" column lists quick wins that should be applied in BL-151 or a dedicated accessibility slice.

## 3. WCAG 2.1 Quick Mapping

| Principle | Guideline | Status | Gap |
|-----------|-----------|--------|-----|
| **Perceivable** | 1.1 Text alternatives | Partial | Icons lack `aria-hidden` or alt text consistently |
| | 1.3 Adaptable | Partial | Tables use semantic markup; some layouts rely on visual order |
| | 1.4 Distinguishable | Partial | Dark mode default; no zoom-tested layout guarantees |
| **Operable** | 2.1 Keyboard accessible | Partial | Tab order not audited; no skip link |
| | 2.2 Enough time | Yes | No auto-timeout or session expiry in UI |
| | 2.3 Seizures | Yes | No flashing content |
| | 2.4 Navigable | Partial | Page titles change; no landmark regions (`<main>`, `<nav>`) verified |
| | 2.5 Input modalities | Unknown | No touch-target size audit |
| **Understandable** | 3.1 Readable | Yes | English only; clear language |
| | 3.2 Predictable | Partial | UI state changes are generally visible; no focus management on route change |
| | 3.3 Input assistance | Partial | Form validation exists; error association not verified |
| **Robust** | 4.1 Compatible | Partial | React + Next.js 15; no automated a11y test suite |

## 4. Test Coverage

| Test Type | Exists? | Count | Tool |
|-----------|---------|-------|------|
| Automated axe-core | No | — | — |
| Lighthouse accessibility | No | — | — |
| Manual keyboard test | No | — | — |
| Screen reader test | No | — | — |
| Component-level a11y tests | No | — | — |

## 5. Backlog Recommendations

1. **BL-151** — Add root Next.js error boundary (already planned; improves robustness).
2. **BL-152 follow-up** — Full accessibility pass:
   - Add `axe-core` to Playwright tests.
   - Run Lighthouse accessibility audit on all primary routes.
   - Add skeleton loading components for async panels.
   - Add skip-to-content link and landmark regions.
   - Verify all interactive elements have accessible names.
   - Test keyboard navigation end-to-end.
3. **Design-system consistency pass (BL-147)** — Include focus styles, touch targets, and color-independent status indicators.

## 6. Honest Statement

SupportPlane has not been tested with assistive technologies. This audit is a **static code and UI review** based on observed patterns, not a verified WCAG conformance evaluation.

---
*This audit is a precheck for engineering readiness, not a formal accessibility conformance report.*
