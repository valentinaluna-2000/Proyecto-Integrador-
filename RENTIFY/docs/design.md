---
version: alpha
name: Rentify
description: Una identidad hospitalaria y confiable para descubrir alojamientos y gestionar estadías en Argentina.
colors:
  primary: "#28396C"
  on-primary: "#FFFFFF"
  primary-hover: "#1E2D5A"
  accent: "#B9D175"
  accent-hover: "#A5BE5E"
  on-accent: "#28396C"
  surface: "#FFFFFF"
  surface-soft: "#D9EFBD"
  background: "#F5FBDA"
  on-surface: "#28396C"
  text-secondary: "#4C5874"
  border: "#D8DFC4"
  disabled: "#737963"
  disabled-surface: "#E8ECD9"
  success: "#285B3E"
  success-surface: "#D9EFBD"
  warning: "#70541B"
  warning-surface: "#F6EDCF"
  error: "#963E45"
  error-surface: "#F8E9E8"
  focus: "#28396C"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
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
    fontFamily: "DM Sans, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
  small:
    fontFamily: "DM Sans, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "DM Sans, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.04em
  button:
    fontFamily: "DM Sans, sans-serif"
    fontSize: 14px
    fontWeight: 600
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
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "{spacing.control}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "{spacing.control}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "{spacing.control}"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "{spacing.control}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px"
    height: 47px
  auth-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 0px
  auth-promo-panel:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.h2}"
    rounded: "{rounded.xl}"
    padding: "48px"
  auth-toggle-button:
    backgroundColor: "transparent"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: 46px
  property-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.space-6}"
  booking-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 28px
  admin-sidebar:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.small}"
    rounded: "{rounded.md}"
    padding: "{spacing.space-8}"
  status-confirmed:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "8px 11px"
  status-pending:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "8px 11px"
---

# Rentify Design System

## Overview

Rentify helps guests discover temporary stays and helps hosts manage properties and reservations across Argentina. The visual tone is calm, welcoming, and dependable. The booking confirmation reference guides guest-facing reservation cards, while the dashboard reference guides the structure of administration. Avoid insurance-style density, neon accents, and decorative elements that compete with property photography.

## Colors

The supplied navy `primary` anchors navigation, headings, and high-priority actions. `accent` is the supplied muted green and should highlight secondary actions and dashboard data; keep its text navy because white text on this green is not strong enough. `surface-soft` groups related information, while the pale `background` keeps long browsing sessions light. Success, warning, and error states use distinct text and background pairs so color is never their only signal.

## Typography

Keep the existing Manrope headings and DM Sans body face. Manrope gives headings a clear editorial shape; DM Sans keeps forms, dates, and numbers easy to scan. Use the display level sparingly for the home hero. Reservation dates, capacity, and prices should use the body or heading levels, with tabular numerals where values are compared.

## Layout

Use a comfortable spacing rhythm based on 4, 8, 12, 16, 24, 32, and 48 pixels. Guest pages keep the search path prominent and place booking details beside the property description on wide screens. Administration uses a left navigation rail and a fluid content area; on narrow screens the rail becomes a horizontal, scrollable navigation row. Keep content readable at 320 CSS pixels without horizontal page scrolling.

## Elevation & Depth

Use white cards, a fine `border`, and a soft navy-tinted shadow to separate important panels from the pale background. Reserve stronger elevation for property cards on hover and booking summaries. Avoid heavy dark shadows and avoid relying on shadows alone to define a card boundary.

Microinteractions use `motion-fast` at 180 ms and `motion-standard` at 260 ms with a soft ease-out curve. New content enters over 340 ms using opacity and a small vertical offset; repeated cards use a short stagger. Hover elevation is limited to devices with a fine pointer. Every non-essential motion yields to `prefers-reduced-motion`.

## Shapes

Use 8-pixel corners for form controls, 12 pixels for compact controls, 18 pixels for cards, and 24 pixels for the booking card. Status badges are fully pill-shaped. Keep the rounded language consistent and avoid mixing it with sharp dashboard tiles.

## Components

The primary button is navy with white text and a 44-pixel minimum height. The accent button uses the supplied green with navy text. Buttons give a small press response; cards lift slightly and their photos scale subtly on hover. The login and registration screens share an `auth-card`: its promo panel slides between sides while only the active form remains available to assistive technology. On mobile, the card becomes a single-column form with the switch panel below it. Inputs have visible labels, a clear navy focus ring, and a white surface. Property and reservation cards use a fine border with modest elevation. Confirmed, pending, cancelled, and expired states keep their text label and use readable semantic color pairs. The admin rail highlights the active destination with a navy filled row.

## Do's and Don'ts

Do use navy for primary actions and active navigation; use green for supporting emphasis; give dates and prices clear hierarchy; keep status text explicit; preserve visible keyboard focus; and adapt the admin rail for touch screens.

Don't put white text on the supplied green; communicate a reservation state with color alone; crowd property photography with badges; hide a key action behind hover; use heavy shadows; or let admin navigation cause horizontal page scrolling on mobile.
