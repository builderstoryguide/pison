# Import Validation Script

This script validates that all lucide-react icons used in components are properly imported to prevent runtime errors.

## Usage

Run the validation script manually:
```bash
npm run validate-imports
```

The script will:
- Scan all `.tsx` and `.ts` files in `components/` and `app/` directories
- Check for lucide-react icon usage
- Verify that used icons are properly imported
- Report any missing imports

## Pre-commit Hook Setup

To automatically run this validation before each commit, you can set up a pre-commit hook:

### Option 1: Using Husky (Recommended)

If you have husky installed:
```bash
npx husky add .husky/pre-commit "npm run validate-imports"
```

### Option 2: Using Git Hooks Directly

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run validate-imports
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Option 3: Using lint-staged

If you use lint-staged, add to your configuration:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["npm run validate-imports"]
  }
}
```

## Automatic Validation

The validation script is automatically run before builds via the `prebuild` npm script. This ensures production builds fail if there are missing imports.

## Adding New Icons

If you use a new lucide-react icon that's not in the validation script, add it to the `COMMON_LUCIDE_ICONS` set in `scripts/validate-icon-imports.js`.

