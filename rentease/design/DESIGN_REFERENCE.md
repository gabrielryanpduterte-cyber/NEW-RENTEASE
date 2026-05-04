# 🎨 RentEase Design Reference

## Design Inspiration Source
**Pinterest Reference:** https://pin.it/3tmQqSYI6

---

## Design System Overview

This document serves as the single source of truth for RentEase's visual design and UI/UX patterns.

### Tech Stack
- **React (Vite)** - Component framework
- **HTML** - Structure
- **CSS** - Styling (Pure CSS, no frameworks)
- **JavaScript** - Interactivity

---

## Design Principles

Based on the Pinterest reference, the design should follow:

### 1. **Modern & Clean**
- Minimalist interface
- Plenty of white space
- Clear visual hierarchy
- Professional appearance

### 2. **User-Friendly**
- Intuitive navigation
- Clear call-to-action buttons
- Easy-to-read typography
- Accessible color contrasts

### 3. **Responsive**
- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Fluid layouts

---

## Color Palette

### Primary Colors
```css
--primary: #0f172a;           /* Dark slate - main brand color */
--primary-light: #334155;     /* Lighter slate */
--primary-dark: #020617;      /* Darker slate */
```

### Secondary Colors
```css
--secondary: #f8fafc;         /* Light background */
--secondary-dark: #e2e8f0;    /* Borders and dividers */
```

### Accent Colors
```css
--accent-blue: #3b82f6;       /* Links and highlights */
--accent-green: #10b981;      /* Success states */
--accent-red: #ef4444;        /* Errors and warnings */
--accent-amber: #f59e0b;      /* Warnings */
```

### Neutral Colors
```css
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
```

---

## Typography

### Font Families
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-heading: 'Manrope', 'Inter', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-full: 9999px;   /* Fully rounded */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## Component Patterns

### Buttons
- **Primary:** Solid background, white text
- **Secondary:** Outlined, transparent background
- **Ghost:** No border, subtle hover
- **Sizes:** Small, Medium, Large

### Cards
- White background
- Subtle border
- Rounded corners
- Soft shadow on hover

### Forms
- Clear labels
- Consistent input heights
- Focus states with blue outline
- Error states with red border

### Navigation
- Fixed sidebar (desktop)
- Collapsible menu (mobile)
- Active state indicators
- Smooth transitions

---

## Layout Grid

### Desktop (1024px+)
- Sidebar: 280px fixed
- Main content: Fluid
- Max content width: 1400px

### Tablet (768px - 1023px)
- Collapsible sidebar
- Full-width content
- 2-column grids

### Mobile (< 768px)
- Single column
- Bottom navigation (optional)
- Full-width cards

---

## Animation & Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Common Animations
- Fade in/out
- Slide in/out
- Scale on hover
- Smooth color transitions

---

## Accessibility

### Requirements
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast (4.5:1 minimum)
- Focus indicators on all interactive elements

---

## Icons

**Recommended:** Use simple, consistent icon style
- Line icons (not filled)
- 24px default size
- Consistent stroke width
- Scalable SVG format

---

## Images

### Guidelines
- Use WebP format when possible
- Provide fallback formats
- Lazy load images
- Optimize for performance
- Use placeholder while loading

---

## Responsive Breakpoints

```css
/* Mobile first approach */
@media (min-width: 640px)  { /* Small tablets */ }
@media (min-width: 768px)  { /* Tablets */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

---

## Design Checklist

### Before Implementation
- [ ] Review Pinterest reference
- [ ] Confirm color palette
- [ ] Check typography scale
- [ ] Verify spacing consistency
- [ ] Test responsive behavior

### During Development
- [ ] Use CSS variables
- [ ] Follow naming conventions
- [ ] Keep components modular
- [ ] Test on multiple devices
- [ ] Validate accessibility

### After Implementation
- [ ] Cross-browser testing
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] User testing
- [ ] Documentation update

---

## File Structure

```
frontend/
├── src/
│   ├── index.css           # Global styles & design tokens
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page-level components
│   └── assets/            # Images, icons, fonts
```

---

## Notes

- **Pure CSS only** - No Tailwind, no CSS frameworks
- **React components** - Modular and reusable
- **Mobile-first** - Design for small screens first
- **Performance** - Optimize for fast loading
- **Consistency** - Follow this guide for all new features

---

## Updates

**Last Updated:** 2026-05-02  
**Version:** 1.0  
**Reference:** https://pin.it/3tmQqSYI6

---

**This is the single source of truth for RentEase design. All UI/UX decisions should reference this document.**
