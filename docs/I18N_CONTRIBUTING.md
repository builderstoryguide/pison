# i18n Contributing Guide

Use this checklist when building or updating UI:

1. Add all user-facing copy via translation keys in `i18n/messages/en.json` and `i18n/messages/fr.json`.
2. Use `useTranslation()` in components and reference keys with `t('...')`.
3. Translate labels, placeholders, helper text, button text, tab names, empty states, tooltips, and aria labels.
4. Prefer shared keys for reusable copy (`common.*`) and feature keys for page-specific copy (`pages.<feature>.*`).
5. Use locale-aware formatters from `lib/helpers.ts` for dates, times, numbers, and currency.
6. Run `npm run i18n:check` before opening a PR.

## Naming convention

- Reusable copy: `common.<group>.<key>`
- Feature copy: `pages.<feature>.<key>`
- Auth copy: `pages.auth.<screen>.<key>`
- Topbar/shell copy: `pages.topbar.<component>.<key>`
- Dialog copy: `pages.dialogs.<dialog>.<key>`

## Avoid

- Hardcoded JSX text (`<span>Some text</span>`)
- Hardcoded placeholders (`placeholder="Search..."`)
- Copy existing only in one locale file
