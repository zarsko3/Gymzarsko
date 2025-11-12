# Chart and Animation Compatibility Fixes

## Issues Identified and Fixed

### 1. Global CSS Transitions Interfering with Charts
**Problem**: Global `* { transition: ... }` rule was applying transitions to SVG elements inside Recharts, causing interference with chart animations and hover states.

**Fix**: Added explicit exclusion for SVG and Recharts elements:
```css
svg,
svg *,
.recharts-wrapper,
.recharts-wrapper *,
.recharts-responsive-container,
.recharts-responsive-container * {
  transition: none !important;
  animation: none !important;
}
```

### 2. Max-Width Constraint on Chart Containers
**Problem**: `max-width: 100%` on all divs could interfere with ResponsiveContainer's width measurement.

**Fix**: Excluded chart containers from max-width constraint:
```css
div:not(.recharts-wrapper):not(.recharts-responsive-container):not([class*="recharts"]) {
  max-width: 100%;
}
```

### 3. Layout Isolation for Animations
**Problem**: Framer Motion page transitions could potentially interfere with chart measurements during route changes.

**Fix**: Added `isolation: isolate` to motion containers to create new stacking contexts and prevent interference.

## Best Practices for Charts and Animations

1. **Always use explicit width** for ResponsiveContainer when possible (use `useClientWidth` hook)
2. **Exclude SVG elements** from global CSS transitions
3. **Use `isolation: isolate`** on animated containers to prevent interference
4. **Avoid `overflow: hidden`** on chart containers unless necessary
5. **Ensure `min-w-0`** on flex containers that hold charts
6. **Use ResizeObserver** for reliable width measurement instead of relying on ResponsiveContainer's internal measurement

## Testing Checklist

- [ ] Charts render correctly on initial load
- [ ] Charts resize properly on window resize
- [ ] Hover tooltips appear and function correctly
- [ ] Chart animations (if enabled) work smoothly
- [ ] Framer Motion animations don't interfere with charts
- [ ] Page transitions don't break chart measurements
- [ ] Charts work correctly in tabs/accordions (if applicable)

