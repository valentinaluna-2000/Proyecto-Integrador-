---
version: beta
name: Rentify
description: Identidad PropTech SaaS que combina precisión operativa y calidez hospitalaria.
colors:
  primary: "#173B32"
  on-primary: "#FFFFFF"
  primary-hover: "#102E27"
  secondary: "#285B4A"
  sage: "#A8C8B8"
  accent: "#D9A441"
  accent-hover: "#C48E2B"
  on-accent: "#25332F"
  surface: "#FFFFFF"
  surface-soft: "#E8F0EC"
  background: "#F4F7F5"
  on-surface: "#25332F"
  text-secondary: "#66736B"
  text-secondary-brand: "#718078"
  border: "#E2E9E5"
  disabled: "#64736A"
  disabled-surface: "#E9EEEB"
  focus: "#173B32"
  brand-blue: "#176BB2"
  brand-blue-soft: "#EAF3F9"
  status-available: "#285B4A"
  status-available-surface: "#E5F0EA"
  status-reserved: "#173B32"
  status-reserved-surface: "#DEEAE4"
  status-pending: "#785A1A"
  status-pending-surface: "#F8EFD9"
  status-paid: "#285B4A"
  status-paid-surface: "#E5F0EA"
  status-blocked: "#59645E"
  status-blocked-surface: "#E9EEEB"
  status-cancelled: "#963E45"
  status-cancelled-surface: "#F8E9E8"
  success: "#285B4A"
  success-surface: "#E5F0EA"
  warning: "#785A1A"
  warning-surface: "#F8EFD9"
  error: "#963E45"
  error-surface: "#F8E9E8"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
    fontSize: 60px
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: -0.045em
  h1:
    fontFamily: "Manrope, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: -0.045em
  h2:
    fontFamily: "Manrope, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
  h3:
    fontFamily: "Manrope, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Manrope, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Manrope, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.04em
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: 14px
    fontWeight: 650
    lineHeight: 1.2
rounded:
  sm: 8px
  md: 12px
  lg: 18px
  xl: 24px
  pill: 999px
spacing:
  space-1: 4px
  space-2: 8px
  space-3: 12px
  space-4: 16px
  space-6: 24px
  space-8: 32px
  space-12: 48px
  control: 44px
elevation:
  card: "0 10px 30px rgb(23 59 50 / 8%)"
  hover: "0 16px 36px rgb(23 59 50 / 14%)"
motion:
  fast: 180ms
  standard: 260ms
  entrance: 340ms
  easeOut: "cubic-bezier(0.2, 0.8, 0.2, 1)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "{spacing.control}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "{spacing.control}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: 47px
  property-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
  booking-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
  admin-sidebar:
    backgroundColor: "{colors.surface}"
    activeBackground: "{colors.primary}"
    textColor: "{colors.on-surface}"
    activeTextColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  status-available:
    backgroundColor: "{colors.status-available-surface}"
    textColor: "{colors.status-available}"
    rounded: "{rounded.pill}"
  status-reserved:
    backgroundColor: "{colors.status-reserved-surface}"
    textColor: "{colors.status-reserved}"
    rounded: "{rounded.pill}"
  status-pending:
    backgroundColor: "{colors.status-pending-surface}"
    textColor: "{colors.status-pending}"
    rounded: "{rounded.pill}"
  status-paid:
    backgroundColor: "{colors.status-paid-surface}"
    textColor: "{colors.status-paid}"
    rounded: "{rounded.pill}"
  status-blocked:
    backgroundColor: "{colors.status-blocked-surface}"
    textColor: "{colors.status-blocked}"
    rounded: "{rounded.pill}"
  status-cancelled:
    backgroundColor: "{colors.status-cancelled-surface}"
    textColor: "{colors.status-cancelled}"
    rounded: "{rounded.pill}"
---

# Rentify Design System

## Direction

**Corporate Tech + Warm Experience.** One brand serves two audiences through different compositions. Guest pages are visual and welcoming, with property photography and clear booking decisions. Owner pages prioritize operational clarity, dense information, and fast access to common actions. Both use the same forest, sage, warm accent, typography, and feedback language.

## Color and accessibility

The supplied forest, secondary green, sage, warm accent, background, surface, and primary text values anchor the identity. The logo blue (#176BB2) is a secondary brand accent: reserve it for small details such as guest step markers, carousel-control hover feedback, and focused or highlighted authentication controls. Keep forest, greens, and warm neutrals dominant. Use forest for primary actions and active navigation; use sage and the warm accent selectively for supporting emphasis. Keep text on the accent dark. Functional states always include a written label or icon, never color alone. The footer uses the soft-surface token to distinguish the closing area without introducing a new hue.

The brief's #718078 secondary shade is retained as a brand tone for large or decorative text. Small and body copy use #66736B so the contrast against the pale background reaches at least 4.5:1. State pairs are independent of brand colors: available, reserved, pending, paid, blocked, and cancelled each have a foreground and surface token.

## Typography and layout

Use Lora for guest-facing display headlines and Manrope for the rest of the product. The restrained serif adds warmth to storytelling while preserving the clear, technical voice of forms, navigation, and administration. Use compact, tabular figures for owner metrics, prices, and dates. Follow the documented type scale and 4px spacing rhythm. Guest layouts can use broad photography and editorial sections; administration uses an app shell, a concise page heading, filters near their results, and tables that remain readable on narrow screens.

The guest home benefits panel closes with a centered two-line brand message. Keep both lines within the panel's content width and align the stronger display line to the center.

## Elevation, shape, and interaction

Use borders and subtle forest-tinted shadows to define surfaces. Reserve stronger elevation for the booking summary and active overlays. Buttons, links, fields, cards, navigation, calendar days, and gallery controls provide a visible hover/focus/active state where applicable. Async actions show loading and a clear success or recovery message. Motion uses 180ms for quick feedback, 260ms for standard movement, and 340ms for content entrance; animate transform and opacity, and honor prefers-reduced-motion.

## Authentication

Keep the existing sliding login/registration panel and its authentication flow. Improve its visual alignment, focus behavior, form feedback, and mobile layout without replacing Supabase Auth or changing its API calls.

## Administration

The owner shell uses the established brand with a focused top bar and the existing six destinations. The dashboard emphasizes the existing reservation, income, occupancy, and cancellation metrics; date/property/report filters; occupancy chart; and detail table. Do not add cards or indicators without real data. At mobile widths, the navigation becomes an independently scrollable row and the page itself must not scroll horizontally.

## Design heuristics

The primary action is the strongest action on each view (H1 / Von Restorff). Related inputs and filters are grouped (H3 / Proximity). Data screens define loading, error, empty, and success states (H28 / Doherty Threshold). Forms use visible labels, native input types, and clear validation (H23–H26). Reflow at 320 CSS px (H9), maintain visible keyboard focus (H38), use touch targets of at least 44px where practical (H39 / Fitts's Law), and keep motion within 150–400ms while respecting reduced motion (H33–H36). Reuse familiar navigation patterns (Jakob's Law) and preserve the user's current context (Recognition over Recall).
