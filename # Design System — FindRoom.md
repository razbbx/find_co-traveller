# Design System — FindRoom

A modern, dark-themed hostel chat platform with glassmorphic UI elements and smooth animations.

---

## 1. COLOR PALETTE

### Primary Color: Purple (Violet)
```
50:  #f5f3ff
100: #ede9fe
200: #ddd6fe
300: #c4b5fd
400: #a78bfa
500: #8b5cf6  ← Main primary accent
600: #7c3aed  ← Buttons, active states
700: #6d28d9
800: #5b21b6
900: #4c1d95
950: #2e1065
```

### Neutral Colors: Zinc/Dark
- **Background**: `zinc-950` (#09090b) — Deep dark base
- **Surface Cards**: `zinc-900` (#18181b) — Slightly lighter than bg
- **Borders**: `zinc-800/50` (#27272a with 50% opacity)
- **Text Primary**: `zinc-100` (#fafafa)
- **Text Secondary**: `zinc-500` (#71717a)
- **Text Tertiary**: `zinc-600` (#52525b)

### Background Gradient
Subtle radial gradients at corners with purple tones (15% opacity):
```
- Top-left & Top-right: hsla(263°, 80%, 15%)
- Bottom colors: hsla(250-265°, 80%, 15%)
```
Creates a soft purple glow in the corners without overwhelming the dark base.

---

## 2. TYPOGRAPHY

**Font Family**: `Outfit` (system-ui fallback)  
**Font Weight Hierarchy**:
- **Bold**: Headings, gradient text (`font-bold`)
- **Semibold**: Secondary text (`font-semibold`)
- **Medium**: Button labels, form labels (`font-medium`)
- **Normal**: Body text, descriptions (`font-normal`)

### Heading Sizes
| Element | Size | Example |
|---------|------|---------|
| Page Title | `text-4xl` to `text-5xl` | "Find Your Room" |
| Section Titles | `text-xl` to `text-2xl` | Form headers |
| Card Titles | `text-lg` | Message sender name |
| Body Text | `text-base` | Chat messages, descriptions |
| Labels | `text-sm` to `text-xs` | Form labels, timestamps |
| Micro Text | `text-xs` | Timestamps, badges |

### Color Scheme
- Headings: White (`text-white`) or gradient text
- Body: `text-zinc-100` (primary), `text-zinc-500` (secondary)
- Interactive: `text-primary-500`, `text-primary-400`, `text-primary-300`

---

## 3. COMPONENT DESIGN

### Glass Card (`.glass-card`)
**Purpose**: Primary surface component for content containers
```
Background:  bg-zinc-900/40 (40% opacity + transparency)
Blur:        backdrop-blur-xl
Border:      border border-zinc-800/50
Radius:      rounded-2xl
Shadow:      shadow-2xl
```
Used for: Form containers, chat bubbles, modals, cards

**Hover State**: `hover:border-zinc-700/80` — Slightly lighter border

### Glass Input (`.glass-input`)
**Purpose**: Form inputs with consistent styling
```
Background:  bg-zinc-900/60
Border:      border-zinc-800
Radius:      rounded-xl
Padding:     px-4 py-3
Focus Ring:  focus:ring-2 focus:ring-primary-500/50
Focus Border: focus:border-primary-500/50
Placeholder: text-zinc-600
Transition:   all duration-200
```

### Primary Button (`.primary-button`)
**Purpose**: Main CTA buttons
```
Background:  bg-primary-600
Hover:       bg-primary-500
Text:        text-white font-medium
Padding:     px-6 py-3
Radius:      rounded-xl
Active:      scale-95 (press effect)
Disabled:    opacity-50
Shadow:      shadow-lg shadow-primary-900/20
Transition:  all duration-300
Flex:        items-center justify-center gap-2
```

### Secondary Button (`.secondary-button`)
**Purpose**: Alternative/non-primary actions
```
Background:  bg-zinc-800/50
Hover:       bg-zinc-800
Border:      border border-zinc-700/50
Text:        text-zinc-300 font-medium
Radius:      rounded-xl
Active:      scale-95 (press effect)
Transition:  all duration-300
```

### Gradient Text (`.gradient-text`)
**Purpose**: Prominent headings with visual wow-factor
```
Background:  bg-gradient-to-r from-primary-400 to-primary-600
Apply:       bg-clip-text text-transparent
Font:        font-bold
```

---

## 4. ANIMATIONS

### Defined Keyframes

#### `fade-in` (0.3s ease-out)
```
0%:   opacity: 0
100%: opacity: 1
```
Use for: Component entrance, progressive reveal

#### `slide-up` (0.4s ease-out)
```
0%:   transform: translateY(10px)
      opacity: 0
100%: transform: translateY(0)
      opacity: 1
```
Use for: Elements sliding into view from below

#### `pulse-slow` (4s infinite)
Standard Tailwind pulse at slower speed
```
50%: opacity: 0.5
```
Use for: Loading states, subtle emphasis

#### `shimmer` (2.5s infinite)
```
0%:   transform: translateX(-100%)
100%: transform: translateX(200%)
```
Use for: Loading skeletons, highlight passes

#### `float` (3s ease-in-out infinite)
```
0%, 100%: transform: translateY(0)
50%:      transform: translateY(-3px)
```
Use for: Floating elements (CTA buttons, badges)

### Animation Classes
- `.animate-fade-in` — Component entrance
- `.animate-slide-up` — Sliding entrance
- `.animate-pulse-slow` — Slow pulsing loading state
- `.animate-shimmer` — Shimmer loading skeleton
- `.animate-float` — Floating effect (prominent buttons)

---

## 5. LAYOUT & SPACING

### Spacing Scale
Tailwind's standard scale (`px-2`, `px-4`, `px-6`, `py-3`, etc.)

### Container Sizing
- **Max Width**: `max-w-2xl` for search bar and primary inputs
- **Full Width**: `w-full` typical on most containers
- **Responsive**: `px-4` for mobile, `px-6+` for desktop

### Flex Utilities
- **Centering**: `flex items-center justify-center`
- **Gaps**: `gap-2`, `gap-3`, `gap-4`, `gap-6`
- **Direction**: `flex-col` (mobile), `md:flex-row` (desktop)

### Breakpoints
- Mobile: Default (no prefix)
- Desktop: `md:` prefix for tablet+
- Large: `lg:` for wider screens

---

## 6. SCROLLBAR STYLING

### Standard Scrollbar
```css
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: bg-zinc-800;
  border-radius: 9999px;
  transition: colors;
}

::-webkit-scrollbar-thumb:hover {
  background: bg-zinc-700;
}
```

### Custom Chat Scrollbar (`.custom-scrollbar`)
```css
::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: rgba(24, 24, 27, 0.4);
}

::-webkit-scrollbar-thumb {
  background: rgba(63, 63, 70, 0.5);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(82, 82, 91, 0.8);
}
```

---

## 7. INTERACTIVE PATTERNS

### Search Bar Component
- **Layout**: Glass card with flex row on desktop, column on mobile
- **Icon**: Search icon left-aligned, changes color on focus
- **Input**: Transparent background with placeholder, filters non-numeric
- **Dropdown**: Block selector integrated
- **CTA**: Primary button with arrow icon

### Chat Bubbles
- **User Messages**: Primary-600 background, rounded with no top-right radius
- **Other Messages**: Glass card with no top-left radius
- **Avatar**: Sender name above in small lowercase zinc-500
- **Timestamp**: Tiny microtext that appears on hover (opacity transition)
- **Animation**: Fade-in on appearance
- **Shadow**: shadow-xl for depth

### Gradient Button (Special CTA)
- **Border**: 2px primary-500/40
- **Background**: Gradient from-primary-600/30 via-primary-500/20 to-primary-600/30
- **Shadow**: `shadow-[0_0_40px_-10px_rgba(primary-500, 0.5)]`
- **Hover**: Scales to 105%, shadow intensifies
- **Contents**: Icon with glow effect + text + arrow
- **Animation**: Float + internal shimmer pass
- **Overflow**: Hidden to contain shimmer animation

### Form Inputs
- Glass design with icon support (optional)
- Focus states with primary color ring
- Error states: Red border and error message
- Loading states: Disable with opacity-50
- Transition all states smoothly (0.2-0.3s)

---

## 8. DARK MODE DEFAULTS

**The entire app is dark-mode only:**
```
:root {
  color-scheme: dark;
}
```

**Color Scheme**:
- Background: Very dark (`zinc-950`)
- Cards: Dark with slight transparency to show gradient backdrop
- Text: Light (`zinc-100` primary)
- Accents: Purple throughout (primary-500/600)

No light mode toggle or alternate theme.

---

## 9. RESPONSIVE DESIGN

### Mobile-First Approach
- Base styles: Mobile (default)
- Desktop overrides: `md:` prefix (768px+)
- Desktop spacing often more generous

### Key Responsive Changes
| Component | Mobile | Desktop |
|-----------|--------|---------|
| Search Bar | Column layout | Flex row |
| Chat Bubbles | `max-w-[85%]` | `md:max-w-[70%]` |
| Text Sizes | `text-4xl` | `md:text-5xl` |
| Padding | `px-4` | | (varies by component) |
| Borders | `border-t` | `md:border-t-0 md:border-l` |

---

## 10. ELEVATION & DEPTH

### Shadows
- **Light**: `shadow-lg` — Subtle depth
- **Medium**: `shadow-xl` — Standard components
- **Heavy**: `shadow-2xl` — Modal/card containers
- **Primary Glow**: `shadow-primary-900/20` — Subtle color cast
- **Large Glow**: `shadow-[0_0_40px_-10px_rgba(primary-500, 0.5)]` — Bold accent (buttons)

### Layering
1. **Base**: `zinc-950` background
2. **Gradient**: Radial background gradients
3. **Cards**: `glass-card` with blur effect
4. **Overlay**: Optional modals/dialogs
5. **Floating**: Absolutely positioned floating elements

---

## 11. KEY DESIGN TOKENS (TailwindCSS Config)

```javascript
{
  colors: {
    primary: {
      // 50 to 950 (see color palette)
    }
  },
  animation: {
    'fade-in': 'fadeIn 0.3s ease-out',
    'slide-up': 'slideUp 0.4s ease-out',
    'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  keyframes: {
    fadeIn: { /* ... */ },
    slideUp: { /* ... */ }
  }
}
```

---

## 12. USAGE GUIDELINES

### When to Use Each Component

#### `.glass-card`
✓ Chat message bubbles  
✓ Form containers  
✓ Content sections  
✓ Modals/dialogs  
✓ Card-based layouts  

#### `.glass-input`
✓ Text fields  
✓ Dropdowns  
✓ Search bars  
✓ Form inputs  

#### `.primary-button`
✓ Main CTAs (Submit, Send, Search)  
✓ High-priority actions  
✓ Form submissions  

#### `.secondary-button`
✓ Cancel/Back actions  
✓ Non-primary options  
✓ Destructive actions (if styled separately)  

#### `.gradient-text`
✓ Main hero headings  
✓ Page titles  
✓ Emphasis text  

---

## 13. DESIGN PHILOSOPHY

**Modern Dark Minimalism**
- Embrace the dark theme — don't fight it
- Use transparency and blur for depth without clutter
- Purple accents provide visual interest without overwhelm
- Smooth animations make interactions feel responsive
- Glass morphism creates modern, premium feel

**Principles**
1. **Clarity**: Proper contrast for text and interactive elements
2. **Consistency**: Reuse components across the app
3. **Motion**: Animations serve a purpose, not just decoration
4. **Spacing**: Generous padding creates breathing room
5. **Accessibility**: Focus states and semantic HTML matter

---

## 14. QUICK REFERENCE: COMMON PATTERNS

### Standard Page Layout
```jsx
<div className="w-full min-h-screen bg-zinc-950">
  <div className="max-w-2xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-primary-300 to-zinc-400 bg-clip-text text-transparent">
      Title
    </h1>
    {/* Content */}
  </div>
</div>
```

### Form Container
```jsx
<form className="w-full glass-card p-6 space-y-4">
  <input className="glass-input" />
  <button className="primary-button w-full">Submit</button>
</form>
```

### Chat Bubble (User)
```jsx
<div className="bg-primary-600/90 text-white rounded-2xl rounded-tr-none px-5 py-3 max-w-[70%]">
  <p className="text-base leading-relaxed">{text}</p>
  <span className="text-xs text-primary-300/80 mt-2 block">{time}</span>
</div>
```

### Chat Bubble (Other)
```jsx
<div className="glass-card rounded-tl-none px-5 py-3 max-w-[70%]">
  <span className="text-xs text-zinc-500 mb-1.5 block">{sender}</span>
  <p className="text-base leading-relaxed">{text}</p>
  <span className="text-xs text-zinc-500 mt-2 block">{time}</span>
</div>
```

---

## 15. FILE ORGANIZATION

### Tailwind Config
- `tailwind.config.js` — Color palette, animations, keyframes
- `postcss.config.js` — PostCSS plugins (Tailwind)

### CSS
- `src/index.css` — Base styles, component classes, custom scrollbars

### Components
- Use component classes from `index.css` (`.glass-card`, `.primary-button`, etc.)
- Build layouts with Tailwind utility classes
- Extend with component-specific styles when needed

---

## Tips for Sister Website

1. **Colors**: Keep the purple-zinc palette — it's iconic
2. **Typography**: Use Outfit or sans-serif equivalent
3. **Components**: Reuse `.glass-card`, `.primary-button` patterns
4. **Dark Mode**: Stick with dark-only theme
5. **Animations**: Implement fade-in and slide-up on page entry
6. **Spacing**: Use similar generous padding and gap utilities
7. **Shadows**: Apply similar depth via shadows and glass effect
8. **Responsiveness**: Mobile-first with `md:` overrides
9. **Scrollbars**: Keep custom scrollbar styling consistent
10. **Gradients**: Use radial corner gradients for visual cohesion

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Framework**: TailwindCSS 3.x + React  
**Theme**: Dark Mode Only
