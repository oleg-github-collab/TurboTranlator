# Design System - Kaminskyi Language Intelligence

Modern design system inspired by industry leaders: Vercel, Linear, and Stripe.

## 🎨 Philosophy

### Core Principles
1. **Clarity** - Every element has purpose
2. **Consistency** - Predictable patterns across the app
3. **Performance** - Smooth 60fps animations
4. **Accessibility** - WCAG 2.1 AA compliant
5. **Depth** - Layered glassmorphism creates hierarchy

---

## 🎭 Visual Language

### Glassmorphism

Our signature aesthetic uses frosted glass effects with depth layering.

#### **glass-card** (Primary)
```css
background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
backdrop-filter: blur(16px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow:
  0 8px 32px 0 rgba(0, 0, 0, 0.37),
  inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
```

**Features:**
- Shimmer effect on hover (light sweep animation)
- Elevates 2px on hover
- Border glow with accent color
- Semi-transparent gradient background

**Usage:** Main cards, sections, containers

#### **glass-elevated** (Modals)
```css
background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 100%);
backdrop-filter: blur(24px) saturate(200%);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 20px 60px 0 rgba(0, 0, 0, 0.5);
```

**Usage:** Modals, dropdowns, overlays

#### **glass-subtle** (Secondary)
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

**Usage:** Nested cards, list items

---

## 🎨 Design Tokens

### Colors

#### Brand
```css
--color-accent: #38bdf8         /* Sky blue - Primary CTA */
--color-accent-hover: #0ea5e9   /* Darker blue - Hover state */
--color-secondary: #818cf8      /* Indigo - Secondary actions */
```

#### Neutrals
```css
--color-bg-primary: #0f172a     /* Slate 900 - Main background */
--color-bg-secondary: #1e293b   /* Slate 800 - Elevated surfaces */
--color-text-primary: #ffffff   /* 100% opacity */
--color-text-secondary: rgba(255, 255, 255, 0.8)
--color-text-tertiary: rgba(255, 255, 255, 0.6)
```

#### Status
```css
--color-success: #10b981        /* Emerald */
--color-error: #ef4444          /* Red */
--color-warning: #f59e0b        /* Amber */
--color-info: #3b82f6           /* Blue */
```

### Spacing

Follows 4px base grid:
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
--spacing-4xl: 96px
```

### Typography

#### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
```

#### Type Scale (Major Third - 1.25)
```css
--text-xs: 12px
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 24px
--text-3xl: 30px
--text-4xl: 36px
--text-5xl: 48px
--text-6xl: 60px
```

#### Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Border Radius
```css
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 24px
--radius-full: 9999px
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
--shadow-glow: 0 0 20px rgba(56, 189, 248, 0.3)
```

---

## ✨ Animations

### Timing Functions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Keyframe Animations

#### **fade-in**
Subtle entrance animation
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

#### **slide-up**
Content sliding in from below
```css
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

#### **scale-in**
Zoom in effect for modals
```css
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
```

#### **shimmer**
Gradient text animation
```css
@keyframes shimmer {
  from { background-position: -200% center; }
  to { background-position: 200% center; }
}
```

#### **float**
Gentle floating motion
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

#### **pulse-glow**
Pulsing glow effect for CTAs
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4); }
  50% { box-shadow: 0 0 20px 10px rgba(56, 189, 248, 0); }
}
```

#### **skeleton-loading**
Shimmer effect for loading states
```css
@keyframes skeleton-loading {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
```

### Utility Classes
```css
.animate-fade-in
.animate-slide-up
.animate-slide-down
.animate-scale-in
.animate-float
.animate-pulse-glow
.animate-blur-in
.animate-rotate-in
```

### Stagger Animations
Apply to parent to stagger child animations:
```css
.stagger-fade-in > * {
  animation: fade-in 0.5s ease-out backwards;
}
/* Children animate with 50ms delay increments */
```

---

## 🧩 Components

### Buttons

#### Primary (CTA)
```tsx
className="rounded-full bg-gradient-to-r from-accent to-sky-400
           px-8 py-4 font-semibold text-slate-900
           hover:shadow-2xl hover:shadow-accent/50
           transition-all duration-300 hover:scale-105"
```

#### Secondary
```tsx
className="rounded-full border-2 border-white/30 px-8 py-4
           font-semibold text-white hover:bg-white/10
           hover:border-white/50 transition-all duration-300"
```

#### Ghost
```tsx
className="rounded-full px-6 py-3 font-medium text-white/80
           hover:bg-white/10 transition-all duration-200"
```

### Cards

#### Standard Glass Card
```tsx
<div className="glass-card p-8">
  {/* Content */}
</div>
```

#### Hover-Interactive Card
```tsx
<div className="glass-card p-8 hover:shadow-2xl hover:shadow-accent/10
                transition-all duration-300 hover:scale-[1.02]">
  {/* Content */}
</div>
```

### Input Fields
```tsx
<input
  className="w-full rounded-xl border border-white/20
             bg-slate-950/40 px-4 py-3 text-white
             focus:border-accent focus:ring-2 focus:ring-accent/20
             transition-all duration-200"
/>
```

### Loading States

#### Skeleton
```tsx
<div className="skeleton h-16 w-full"></div>
```

#### Spinner
```tsx
<div className="h-12 w-12 animate-spin rounded-full
                border-4 border-accent border-t-transparent">
</div>
```

#### Typing Indicator
```tsx
<div className="typing-indicator flex gap-1">
  <span className="h-2 w-2 rounded-full bg-white/60"></span>
  <span className="h-2 w-2 rounded-full bg-white/60"></span>
  <span className="h-2 w-2 rounded-full bg-white/60"></span>
</div>
```

---

## 📱 Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px   /* Mobile landscape */
--breakpoint-md: 768px   /* Tablet */
--breakpoint-lg: 1024px  /* Desktop */
--breakpoint-xl: 1280px  /* Large desktop */
--breakpoint-2xl: 1536px /* Extra large */
```

### Mobile-First Approach
```tsx
/* Mobile by default */
<div className="px-4 py-6">

/* Tablet and up */
<div className="px-4 sm:px-6 py-6 sm:py-10">

/* Desktop and up */
<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
```

### Touch Targets
Minimum 44x44px for all interactive elements (WCAG 2.1).

---

## ♿ Accessibility

### Focus States
```css
*:focus-visible {
  outline: 2px solid rgba(56, 189, 248, 0.5);
  outline-offset: 2px;
  border-radius: 8px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
  .glass-card {
    border-width: 2px;
  }
}
```

### Screen Readers
- Semantic HTML (`<nav>`, `<main>`, `<section>`)
- ARIA labels where needed
- Proper heading hierarchy

---

## 🎯 Usage Examples

### Hero Section
```tsx
<section className="glass-card px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20
                    text-center shadow-2xl animate-fade-in">
  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold
                 leading-tight bg-gradient-to-r from-white via-accent to-secondary
                 bg-clip-text text-transparent">
    Transform Your Content
  </h1>

  <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
    <button className="magnetic-button rounded-full bg-gradient-to-r
                       from-accent to-sky-400 px-6 sm:px-8 py-3 sm:py-4
                       font-semibold w-full sm:w-auto">
      Get Started
    </button>
  </div>
</section>
```

### Feature Card
```tsx
<div className="glass-card p-6 sm:p-8 hover:shadow-2xl
                hover:shadow-accent/10 transition-all duration-300
                hover:scale-[1.02] animate-slide-up">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-12 h-12 rounded-xl bg-accent/20
                    flex items-center justify-center">
      {/* Icon */}
    </div>
    <h3 className="text-2xl font-semibold">Feature Title</h3>
  </div>
  <p className="text-white/80">Feature description</p>
</div>
```

---

## 📊 Performance

### Targets
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: 95+
- 60fps animations on all devices

### Optimizations
- CSS containment for animations
- `will-change` for heavy animations
- Hardware acceleration via `transform`
- Reduced motion support

---

## 🔮 Future Enhancements

1. **Dark/Light Mode Toggle**
   - CSS variables ready
   - `[data-theme]` attribute support

2. **Color Palette Generator**
   - Customizable accent colors
   - Automatic shade generation

3. **Component Library**
   - Storybook documentation
   - Reusable components package

4. **Design Tokens Export**
   - Figma plugin
   - JSON/YAML export for other platforms

---

## 📝 Summary

This design system provides:
- ✅ **Consistent** visual language
- ✅ **Accessible** WCAG 2.1 AA
- ✅ **Performant** 60fps animations
- ✅ **Responsive** mobile-first
- ✅ **Modern** glassmorphism aesthetic
- ✅ **Scalable** design tokens

**Result**: Professional UI matching Vercel, Linear, and Stripe quality standards.
