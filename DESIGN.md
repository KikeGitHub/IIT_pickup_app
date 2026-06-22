---
name: Instituto Inglés de Toluca Design System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1b1c'
  on-surface-variant: '#44474f'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#747780'
  outline-variant: '#c4c6d0'
  surface-tint: '#445f8c'
  primary: '#000e27'
  on-primary: '#ffffff'
  primary-container: '#00234e'
  on-primary-container: '#728bbc'
  inverse-primary: '#adc7fb'
  secondary: '#b6171e'
  on-secondary: '#ffffff'
  secondary-container: '#da3433'
  on-secondary-container: '#fffbff'
  tertiary: '#0c0f10'
  on-tertiary: '#ffffff'
  tertiary-container: '#212425'
  on-tertiary-container: '#898b8c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#adc7fb'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#2c4773'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb3ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#930010'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fcf9f8'
  on-background: '#1b1b1c'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  button-text:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-mobile: 16px
  container-margin-desktop: 64px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system for this educational institution is rooted in the concepts of **Academic Prestige** and **Digital Efficiency**. It prioritizes a mobile-first philosophy to accommodate students and parents who need quick access to information on the go. 

The aesthetic is **Corporate Modern**: a clean, structured environment that utilizes a high-contrast palette to communicate authority and trust. The visual language avoids unnecessary decoration, focusing instead on clarity, legibility, and a frictionless user experience that mirrors the precision of language learning.

## Colors
The palette is built upon traditional academic foundations with modern digital adjustments for accessibility.

- **Primary (Institutional Navy):** Used for headers, navigation, and primary brand elements to establish a sense of history and reliability.
- **Secondary (Academic Red):** Reserved strictly for critical actions, notifications, and accents to ensure they command immediate attention against the navy and white.
- **Backgrounds:** A crisp, high-brilliance white (#FFFFFF) is the standard for content areas to maximize text legibility.
- **Neutrals:** Soft grays are used for borders and secondary surfaces to provide structure without adding visual noise.

## Typography
This design system utilizes **Hanken Grotesk** across all levels to maintain a cohesive, sharp, and contemporary professional look. 

- **Headlines:** Use Bold (700) or Semi-Bold (600) weights to establish a clear hierarchy. Mobile headlines are scaled down for better fit on small screens while maintaining their weight.
- **Body Text:** Standardized at 16px to ensure readability for users of all ages. 
- **Character Spacing:** Headlines utilize slight negative tracking for a more "designed" and authoritative appearance. Labels and buttons use slight positive tracking to improve legibility at smaller sizes.

## Layout & Spacing
The layout follows an **8px grid system** to ensure mathematical consistency across all screen sizes.

- **Mobile (Primary):** A single-column fluid layout with 16px side margins. Elements like buttons and input fields are typically full-width to accommodate one-handed thumb interaction.
- **Desktop:** A 12-column fixed grid (max-width 1280px). Content is centered with generous 64px margins to prevent line lengths from becoming too wide for comfortable reading.
- **Rhythm:** Vertical spacing (Stack) is used to group related information. Use `stack-sm` for element-label pairs, `stack-md` for content blocks, and `stack-lg` for section breaks.

## Elevation & Depth
To maintain a professional and clean look, depth is communicated through **Tonal Layering** rather than heavy shadows.

- **Level 0 (Base):** White background.
- **Level 1 (Cards/Surface):** Very light gray (#F8F9FA) or white with a 1px neutral border (#E0E0E0).
- **Level 2 (Interactive):** Subtle, highly diffused ambient shadows (e.g., 0px 4px 12px rgba(0,0,0, 0.05)) are used only for active components like floating action buttons or open menus to suggest they are "lifted" above the main content.

## Shapes
A **Rounded** shape language is employed to soften the institutional navy blue, making the interface feel approachable yet modern.

- **Base Radius:** 0.5rem (8px) for buttons, inputs, and cards.
- **Large Radius:** 1rem (16px) for larger containers like modals or hero sections.
- **Pill Radius:** Used exclusively for status chips or tags to differentiate them from interactive buttons.

## Components
Consistent component styling ensures the interface feels like an integrated part of the institution's identity.

- **Buttons:** 
  - *Primary:* Full-width on mobile, Institutional Navy background, white text, 8px radius. Minimum height of 48px to ensure a large touch target.
  - *Secondary:* Academic Red background, white text. Reserved for "Register Now," "Pay Fees," or critical alerts.
- **Input Fields:** 1px solid gray border that transitions to a 2px Navy border on focus. Labels are always visible above the field (not floating) for maximum clarity.
- **Cards:** Used for course listings or news. They feature a white background, 8px radius, and a subtle 1px border. The header of the card may use a Navy Blue tint for categorization.
- **Lists:** Data-heavy sections (like grades or schedules) use "Zebra-striping" with the tertiary color (#F8F9FA) to help the eye track across rows on mobile screens.
- **Chips:** Used for course levels (e.g., "A1", "B2"). Use a Navy outline with bold label text.