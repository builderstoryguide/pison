# Android Mobile-First Testing Guide

## Overview

This document tracks comprehensive mobile-first testing for the school management application, focusing on Android Chrome browser experience. The testing ensures native mobile experience with proper responsive design, touch interactions, and performance optimization.

## Scope

- **Target Platform**: Android Chrome only (phones first; small-to-medium screens)
- **Device Matrix**: Pixel 5 (393x851 viewport, DPR 2.75)
- **Network Conditions**: 3G Fast throttling
- **Motion**: Reduced motion enabled for accessibility

## App Areas Under Test

| Area | Automated Tests | Manual Tests | Status | Last Run |
|------|----------------|--------------|--------|----------|
| Dashboard | ✅ | ✅ | 🟡 In Progress | - |
| User Management | ⏳ | ✅ | 🔴 Pending | - |
| Teacher Management | ⏳ | ✅ | 🔴 Pending | - |
| Class Management | ⏳ | ✅ | 🔴 Pending | - |
| Subjects & Branches | ⏳ | ✅ | 🔴 Pending | - |
| Examinations | ⏳ | ✅ | 🔴 Pending | - |
| Attendance | ⏳ | ✅ | 🔴 Pending | - |
| Alerts | ⏳ | ✅ | 🔴 Pending | - |
| Employee Management | ⏳ | ✅ | 🔴 Pending | - |
| App Configuration | ⏳ | ✅ | 🔴 Pending | - |
| Students | ⏳ | ✅ | 🔴 Pending | - |
| Finances | ⏳ | ✅ | 🔴 Pending | - |
| Reports | ⏳ | ✅ | 🔴 Pending | - |

**Legend**: ✅ Complete | ⏳ In Progress | 🔴 Pending | ❌ Failed

## Performance Budgets (Mobile)

### Lighthouse CI Targets
- **Performance**: ≥ 85
- **Best Practices**: ≥ 90  
- **Accessibility**: ≥ 90
- **PWA**: Installable (if applicable)

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: ≤ 3.0s (3G Fast)
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **TBT (Total Blocking Time)**: ≤ 300ms
- **Main Thread**: ≤ 2.5s
- **Total JS**: ≤ 350KB gzipped

### Last Performance Results
*Results will be updated after each test run*

## How to Run Tests

### Automated Tests (Playwright)
```bash
# Run all mobile tests
npm run test:mobile

# Run with UI for debugging
npm run test:mobile:ui

# Run specific area tests
npx playwright test --project=android-chrome tests/mobile/dashboard.spec.ts
```

### Performance Audits (Lighthouse CI)
```bash
# Run Lighthouse mobile audits
npm run lighthouse:mobile

# Run all tests (Playwright + Lighthouse)
npm run test:mobile:all
```

### Manual Testing
Use the checklist below on Android Chrome (Pixel 5 dimensions: 393x851px)

## Manual Testing Checklist

### Layout & Responsiveness
- [ ] No horizontal scroll at 360–414px widths
- [ ] Content fits within safe areas (notch/punch hole)
- [ ] Cards and widgets stack vertically on mobile
- [ ] Tables collapse or scroll horizontally when needed
- [ ] Images are responsive and don't overflow

### Navigation & Touch
- [ ] Hamburger/overflow menus are reachable and tappable
- [ ] Tap targets are ≥ 48x48dp (minimum touch target size)
- [ ] Navigation drawer toggles properly
- [ ] Back button behavior is consistent with Android patterns
- [ ] Bottom navigation (if present) is accessible

### Typography & Readability
- [ ] Base font size is ≥ 16px (prevents zoom on iOS)
- [ ] Line height is readable (1.4-1.6)
- [ ] Text is not truncated or cut off
- [ ] No forced zoom required for reading

### Forms & Inputs
- [ ] Input types are correct (`email`, `tel`, `number`, etc.)
- [ ] Numeric keyboards appear for numeric fields
- [ ] Form validation messages are clear and visible
- [ ] Submit buttons are sticky and don't cover form fields
- [ ] Error states are clearly indicated

### Performance & Interaction
- [ ] First interaction is smooth (< 3s on 3G Fast)
- [ ] No jank during scrolling
- [ ] Loading states are visible and informative
- [ ] Animations respect reduced motion preferences

### Accessibility (Android TalkBack)
- [ ] Focus order is logical and predictable
- [ ] All interactive elements have proper roles
- [ ] Labels and names are descriptive
- [ ] Focus indicators are visible
- [ ] Screen reader announcements are helpful

### Media & Assets
- [ ] Images are not blurry on high DPI screens
- [ ] SVG icons are crisp and scalable
- [ ] Videos (if any) are responsive
- [ ] Icons are appropriately sized for touch

### Alerts & Notifications
- [ ] Toast messages are accessible and not clipped
- [ ] Snackbars don't cover important content
- [ ] Alert dialogs are mobile-friendly
- [ ] Notification permissions work correctly

### Offline & PWA (if applicable)
- [ ] Add to home screen works
- [ ] Offline messaging is graceful
- [ ] Service worker handles network failures
- [ ] Cached content is available offline

## Test Reports

### Automated Test Reports
- **Playwright Report**: `playwright-report/index.html`
- **Lighthouse Report**: `lighthouse-report/index.html`

### Performance History
*Performance trends will be tracked here*

## Common Issues & Solutions

### Horizontal Scroll
- **Issue**: Content overflows viewport width
- **Solution**: Use CSS `max-width: 100%` and `overflow-x: hidden`

### Touch Target Size
- **Issue**: Buttons/links too small for touch
- **Solution**: Ensure minimum 48x48dp touch targets

### Input Zoom
- **Issue**: iOS zooms on input focus
- **Solution**: Use `font-size: 16px` minimum on inputs

### Performance Issues
- **Issue**: Slow loading on 3G
- **Solution**: Optimize images, lazy load content, reduce JS bundle

## TODO List

### High Priority
- [ ] Create docs/MOBILE_FIRST_README.md with sections and living TODO
- [ ] Add Playwright Android project to playwright.config.ts
- [ ] Implement mobile helpers: viewport, overflow, tap-target, keyboard types
- [ ] Add lighthouserc-mobile.json with budgets and routes
- [ ] Add npm scripts: test:mobile, lighthouse:mobile, test:mobile:all

### Test Specifications
- [ ] Write Dashboard mobile smoke spec
- [ ] Write User Management mobile smoke spec
- [ ] Write Teacher Management mobile smoke spec
- [ ] Write Class Management mobile smoke spec
- [ ] Write Subjects & Branches mobile smoke spec
- [ ] Write Examinations mobile smoke spec
- [ ] Write Attendance mobile smoke spec
- [ ] Write Alerts mobile smoke spec
- [ ] Write Employee Management mobile smoke spec
- [ ] Write App Configuration mobile smoke spec
- [ ] Write Students mobile smoke spec
- [ ] Write Finances mobile smoke spec
- [ ] Write Reports mobile smoke spec

### Documentation & CI
- [ ] Populate README manual checklist and coverage table
- [ ] Optionally wire into CI to run on PRs

## Contributing

When adding new features or modifying existing ones:

1. **Test on Mobile First**: Always test on mobile viewport before desktop
2. **Update Tests**: Add/update Playwright specs for new functionality
3. **Check Performance**: Ensure new features don't degrade Lighthouse scores
4. **Update Checklist**: Add new manual test cases as needed
5. **Document Issues**: Record any mobile-specific issues and solutions

## Resources

- [Playwright Mobile Testing](https://playwright.dev/docs/emulation)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Android Touch Target Guidelines](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Web.dev Mobile Best Practices](https://web.dev/mobile/)

---

*Last Updated: [Date will be updated automatically]*
*Test Coverage: [Will be updated after test runs]*
