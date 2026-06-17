---
name: PossAbilities Journey
colors:
  surface: '#fff8f8'
  surface-dim: '#e1d8d9'
  surface-bright: '#fff8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf1f2'
  surface-container: '#f5eced'
  surface-container-high: '#efe6e7'
  surface-container-highest: '#e9e0e1'
  on-surface: '#1e1b1c'
  on-surface-variant: '#4e434e'
  inverse-surface: '#342f30'
  inverse-on-surface: '#f8efef'
  outline: '#80737f'
  outline-variant: '#d1c2cf'
  surface-tint: '#844594'
  primary: '#290036'
  on-primary: '#ffffff'
  primary-container: '#48065a'
  on-primary-container: '#bb77ca'
  inverse-primary: '#f2afff'
  secondary: '#b30069'
  on-secondary: '#ffffff'
  secondary-container: '#e00085'
  on-secondary-container: '#fffbff'
  tertiary: '#001819'
  on-tertiary: '#ffffff'
  tertiary-container: '#002f2f'
  on-tertiary-container: '#319f9f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fcd7ff'
  primary-fixed-dim: '#f2afff'
  on-primary-fixed: '#340043'
  on-primary-fixed-variant: '#6a2c7a'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cc'
  on-secondary-fixed: '#3e0021'
  on-secondary-fixed-variant: '#8d0051'
  tertiary-fixed: '#8ef3f3'
  tertiary-fixed-dim: '#71d6d6'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#004f50'
  background: '#fff8f8'
  on-background: '#1e1b1c'
  surface-variant: '#e9e0e1'
  deep-navy: '#1A1645'
  teal-accent: '#5BC3C3'
  background-soft: '#F8F9FA'
  success-green: '#2ECC71'
typography:
  display-hero:
    fontFamily: Montserrat
    fontSize: 80px
    fontWeight: '900'
    lineHeight: 90px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  headline-md:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  journey-gap: 48px
---

## Brand & Style

The design system adopts a **Gamified Journey** aesthetic, transforming the induction process into an engaging, high-energy adventure. It balances the professional requirements of a corporate induction with the vibrant, inclusive personality of the brand.

The visual style is **Tactile & Playful**, moving away from the flat origins of the brand manual to embrace depth and interactivity. By utilizing soft shadows, vibrant gradients, and "squishy" UI elements, the system creates a sense of momentum and achievement. The "Path" motif is central—elements should feel like steps on a map, with clear progress indicators and rewarding visual feedback when tasks are completed. The emotional response should be one of optimism, clarity, and excitement.

## Colors

The palette is anchored by the high-contrast trio of **Purple**, **Pink**, and **Blue/Green**. 

- **Purple (Primary):** Used for structural navigation, primary buttons, and level headers. It provides the "professional" weight to the system.
- **Pink (Secondary):** Used as an action color for highlights, achievement badges, and critical "Start" buttons.
- **Blue/Green (Tertiary):** Dedicated to progress tracking and path indicators, symbolizing growth and movement.
- **Neutral:** A deep charcoal is used for body text to ensure high readability, while a very soft off-white (`#F8F9FA`) is used for the "ground" of the journey to let the vibrant primary colors pop.

Gradients are encouraged for progress bars and "Level Up" states, typically transitioning from Purple to Pink or Blue/Green to Teal.

## Typography

This design system uses **Montserrat** as a modern, accessible alternative that captures the geometric "Avenir" spirit while providing the variable weights necessary for a digital gamified interface.

- **Headlines:** Use Heavy (800) and Black (900) weights to mimic the bold section numbering of the original brand manual. These should feel authoritative and celebratory.
- **Body:** Use Regular (400) for high legibility in instructional content.
- **Interactive Labels:** Use Bold (700) with slight letter spacing for buttons and tabs to differentiate them from static content.
- **Path Markers:** Large display numbers (used for Level indicators) should be set in the largest possible size allowed by the viewport to maintain the brand's signature "impact minimalism."

## Layout & Spacing

The layout follows a **Fluid Journey Model**. Rather than a rigid grid, content is organized along a vertical or serpentine "Path" that leads the user from one induction module to the next.

- **The Path:** Central content blocks are aligned to a 12-column grid on desktop, but decorative "connectors" (the path motif) sit behind the cards to visually link them.
- **Margins:** We honor the brand manual’s 64pt (converted to 64px) left margin for primary headers on desktop to create an asymmetrical, modern feel.
- **Rhythm:** An 8px base unit drives all spacing. Larger gaps (48px+) are used between "Levels" to give the content room to breathe and signify a change in topic.

## Elevation & Depth

To achieve the "Gamified" feel, the system uses a **Tonal & Ambient Shadow** approach:

- **Resting State:** Components like cards and buttons have a soft, slightly tinted shadow (using a low-opacity Purple) to make them feel like they are floating above the path.
- **Active/Hover State:** When hovered, elements should "lift" (shadow becomes larger and softer) or "press" (shadow disappears, element shifts 2px down) to provide tactile feedback.
- **Depth Layers:**
    - **Layer 0 (Background):** The soft off-white ground.
    - **Layer 1 (The Path):** Blue/Green decorative lines or tracks.
    - **Layer 2 (Cards):** Solid white containers with 1px soft borders.
    - **Layer 3 (Modals/Pop-ups):** High elevation with a 20% blur backdrop to focus on achievements.

## Shapes

The shape language is defined by **Rounded (0.5rem / 8px)** corners to ensure the UI feels friendly and approachable. 

- **Buttons & Chips:** These should use the `rounded-xl` or pill-shaped logic to feel "squishy" and interactive. 
- **Achievement Badges:** These are the exception and can use circular shapes or hex-polygons to stand out as special collectibles.
- **Progress Bars:** Fully rounded (pill) ends are mandatory to reinforce the "journey" metaphor.

## Components

### Buttons
Primary buttons use the **Pink** hex with white text. They should have a "thick" bottom border (3px) in a darker shade of pink to create a 3D effect, which disappears when clicked (the "press" animation).

### Progress Path
The path is a thick `tertiary` (Blue/Green) line that connects module cards. As a user completes a section, the line "fills" with a gradient from Blue/Green to Pink.

### Module Cards
Cards use a white background, `rounded-lg` corners, and a very subtle `primary` (Purple) border. They include a "Lock" icon if the level hasn't been reached, which transforms into a "Star" or "Check" upon completion.

### Achievement Badges
High-energy containers using **Pink** and **Purple** gradients. These should use "Display" typography for numbers and include a subtle "pulse" animation when first unlocked.

### Input Fields
Fields should be clean with a 2px border that turns **Blue/Green** when focused. Labels should always use `label-bold` for clarity.

### Chips/Tags
Used for metadata (e.g., "5 mins", "Required"). These use low-saturation versions of the brand colors with dark text to remain secondary to the main journey actions.