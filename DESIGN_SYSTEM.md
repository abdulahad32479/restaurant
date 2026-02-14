**Duke's — UI Design System & Blueprint**

Overview
--------
This document is a complete, pixel-oriented visual design system for "Duke's" — a premium dark-themed restaurant POS. It describes colors, spacing, typography, components, layers, responsive behavior, and page layout blueprints. It's strictly visual — no backend, logic, or runtime behavior.

Brand Palette (tokens)
- Primary (deep red): #8B0000
- Accent (gold): #D4AF37
- Main background: #121212
- Secondary background: #1A1A1A
- Card surface: #1F1F1F
- Borders / dividers: #2A2A2A
- Text primary: #FFFFFF
- Text secondary: #B3B3B3

Spacing System
- Unit: 8px (1 space)
- x1 = 8px, x2 = 16px, x3 = 24px, x4 = 32px, x5 = 40px, x6 = 48px
- Touch minimum: 48px (use for primary touch targets)
- Card padding: 16–24px

Grid
- 12-column grid
- Default gutter: 24px (3 units)

Corner radius
- Small: 8px
- Standard: 12–14px (prefer 12px)
- Large: 16px for large cards and floating actions

Layer / Elevation System
- Layer 0 — Background: #121212 (flat)
- Layer 1 — Section containers: #1A1A1A (soft shadow)
- Layer 2 — Cards / modules: #1F1F1F (subtle uplift)
- Layer 3 — Active / hovered elements: slightly lighter surface + stronger shadow
- Layer 4 — Modals / popups: glassmorphism, blur (backdrop-filter) + higher shadow
- Layer 5 — Alerts / notifications: bold solid color, highest contrast

Shadow rules
- Soft shadow (layer 1): 0 4px 12px rgba(0,0,0,0.45)
- Card shadow (layer 2): 0 8px 24px rgba(0,0,0,0.55)
- Active shadow (layer 3): 0 12px 32px rgba(0,0,0,0.6)
Use subtle colored glows for important elements (e.g., gold accent glow for CTA hover)

Typography
- Font family: Modern sans-serif (Inter / Poppins style)
- Weights: 400 / 500 / 600 / 700
- Scale (desktop):
  - H1: 48px / 56px (700) — Dashboard title
  - H2: 32px / 36px (600) — Section headers
  - H3: 20px / 24px (600) — Card titles
  - Body: 16px (400) — Primary body
  - Small: 12px / 14px (400) — Meta / helper
  - Button: 14px / 16px (600) — Uppercase, letter-spacing +0.08em

Color usage & contrast
- Primary red used for active states, primary navigation highlight, and important CTA backgrounds.
- Accent gold used for unlock elements, highlights, badges, and important secondary CTAs.
- Secondary background and card surface preserve dark hierarchy.
- All text colors ensure adequate contrast: primary white on surfaces and secondary grey for meta information.

Interactive motion
- Duration: 200–300ms for hover/active transitions.
- Easing: cubic-bezier(0.2, 0.8, 0.2, 1)
- Microinteractions: subtle scale 0.98 on press, small translateY on card hover.

Component primitives (spec)
- Buttons
  - Primary: deep red background, white text, rounded 12px, shadow
  - Secondary: transparent surface with gold border or gold background on emphasis
  - Danger: muted red/pulse for destructive actions
  - Sizes: small (40px), medium (48px), large (56px)
- Inputs
  - Background: #151515 / card surface, subtle border #2A2A2A
  - Focus: gold outline (2px) or red glow
  - Height: 48px (touch friendly)
- Cards
  - Padding: 16–24px
  - Border radius: 12px
  - Surface: #1F1F1F
  - Accent: small square or circle badge in top-right for icons
- Badges / Status
  - Pending: amber/gold outline
  - Preparing: blue
  - Ready: green
  - Canceled: muted grey
- Modal / Drawer
  - Backdrop: 30–40% opacity + backdrop blur 6px
  - Container: glass-like surface (#1F1F1F with 8–10% white overlay)

Screens blueprint (layout + notes)
--------------------------------
1) Login Screen
  - Fullscreen dark gradient (#0f0f0f -> #121212)
  - Centered login card (max-width 420px) with animated logo placeholder on top
  - PIN pad: 3x4 grid, large circular buttons (56–72px) with primary highlights
  - Role indicator under logo (Admin / Staff badge)

2) Admin Dashboard
  - Top header (fixed): left logo, center breadcrumb/title, right profile & notifications
  - Left collapsible sidebar (220–280px default) — icons + labels, active deep-red pill
  - Main content uses 12-column grid: KPI cards row (4 per row), charts span 8–9 columns, lists span 3–4

3) POS Billing (Detailed)
  - Layout: 3-column split (20% categories | 50% product grid | 30% cart)
  - Left panel: vertically scrollable category list, large pill active state in deep red
  - Center: product cards with image top, name, price, quick-add circular button in corner
  - Right: cart list, each item row with qty controls (−/num/+), notes icon, remove action; subtotal, tax, discount rows; grand total large
  - Bottom sticky payment bar (fixed): 3–4 large payment buttons with distinct color accents
  - Empty states: illustration placeholder, muted message, large CTA to add items

4) Kitchen Display
  - Fullscreen card grid, responsive columns adapt by width
  - Top row: filter tabs (All / Pending / Preparing / Ready)
  - Order card: left border color-coded, header with order number and timer, item list, quick status toggles

5) Orders Management
  - Filter bar (search, status select, date range) above table
  - Table: dark surface rows, thin dividers, status badges, right aligned actions (view / print)

6) Menu Management
  - Split: categories left column, items grid/table on right
  - Floating Add Item button (deep red rounded) bottom-right of content area
  - Modal: add/edit item with image upload placeholder and form fields

7) Inventory
  - Stock overview KPI cards on top
  - Table with low-stock highlighting, supplier side panel on demand

8) Staff Management
  - Card grid with role badges and permission chips
  - Modal to edit role & permission toggles, activity log side panel

9) Reports & Analytics
  - Large chart area with date range and export CTA
  - Summary cards to the right or below depending on width

10) Settings
  - Tabs for General / Tax / Receipt / Printer / Backup
  - Each tab uses card sections, toggles, and inline save action; main Save fixed bottom-right

Responsive behavior
- Desktop (>=1366px): full sidebar, multi-column content, charts and tables side-by-side
- Tablet: sidebar collapses to icons only; POS center column expands; touch spacing increases
- Mobile: primary flows stack vertically; use bottom-sheet drawers for cart/panels

Microinteractions
- Hover: lift 6–8px, subtle translateY(-4px), shadow increase
- Active/press: scale 0.98, reduce shadow
- Transitions: 200–300ms

Files added to the repo in this change
- A static documentation file DESIGN_SYSTEM.md describes the full blueprint
- A small set of UI components are supplied in src/components/ui to match these tokens
- Two demo pages are added to app/design-system and app/pos as static, visual-only pages

Usage notes
- These artifacts are UI-only. Use them as a visual blueprint for engineers and UI implementers. All colors and spacing are tokenized above.

End of design system doc
