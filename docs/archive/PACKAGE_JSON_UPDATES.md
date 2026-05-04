# 📦 PACKAGE.JSON UPDATES

## Current Dependencies (Already Installed)

```json
{
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.14.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2",
    "tailwind-merge": "^3.5.0"
  }
}
```

## New Dependencies to Install

### Required for Tailwind CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Required for Shadcn/ui:
```bash
npm install class-variance-authority
```

## After Installation, Your package.json Will Look Like:

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^1.14.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^10.2.1",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.5.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^8.0.10"
  }
}
```

## Dependency Explanations

### Production Dependencies:

**class-variance-authority** (NEW)
- Purpose: Manage component variants (button styles, sizes, etc.)
- Used by: All Shadcn/ui components
- Size: ~5KB

**clsx** (EXISTING)
- Purpose: Conditional className utility
- Already installed ✅

**tailwind-merge** (EXISTING)
- Purpose: Merge Tailwind classes intelligently
- Already installed ✅

### Development Dependencies:

**tailwindcss** (NEW)
- Purpose: Utility-first CSS framework
- Size: ~10KB (after purging)
- Required: Yes

**postcss** (NEW)
- Purpose: CSS transformation tool
- Required by: Tailwind CSS
- Size: Minimal

**autoprefixer** (NEW)
- Purpose: Add vendor prefixes automatically
- Required by: Tailwind CSS
- Size: Minimal

## Installation Commands

### All at Once:
```bash
npm install -D tailwindcss postcss autoprefixer && npm install class-variance-authority
```

### One by One:
```bash
# Dev dependencies
npm install -D tailwindcss
npm install -D postcss
npm install -D autoprefixer

# Production dependency
npm install class-variance-authority
```

## Verify Installation

```bash
# Check if installed
npm list tailwindcss
npm list class-variance-authority

# Should show:
# frontend@0.0.0
# ├── class-variance-authority@0.7.0
# └── tailwindcss@3.4.0
```

## Bundle Size Impact

```
Before:
- React + React DOM: ~140KB
- React Router: ~20KB
- Existing utils: ~5KB
Total: ~165KB (gzipped)

After:
- All above: ~165KB
- Tailwind CSS: ~10KB (purged)
- CVA: ~5KB
Total: ~180KB (gzipped)

Impact: +15KB (~9% increase)
```

## Optional Dependencies (Not Required)

These are NOT needed for basic Shadcn/ui:

```bash
# NOT NEEDED (Shadcn/ui uses Tailwind instead)
# npm install @radix-ui/react-*
# npm install @headlessui/react
# npm install framer-motion
```

## Troubleshooting

### Issue: "Cannot find module 'tailwindcss'"
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Issue: "Cannot find module 'class-variance-authority'"
```bash
npm install class-variance-authority
```

### Issue: Peer dependency warnings
```bash
# Safe to ignore, or run:
npm install --legacy-peer-deps
```

## Quick Install Script

Save this as `install-deps.ps1`:

```powershell
Write-Host "Installing Shadcn/ui dependencies..." -ForegroundColor Cyan

npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority

Write-Host "✅ Installation complete!" -ForegroundColor Green
npm list tailwindcss class-variance-authority
```

Run with:
```powershell
.\install-deps.ps1
```

---

**Ready to install? Run the commands above! 📦**
