# 🚀 QUICK START - Shadcn/ui Implementation

## ⚡ 3-Step Installation (5 minutes)

### Step 1: Install Dependencies
```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\frontend"
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority
```

### Step 2: Replace CSS
```powershell
# Backup old
Rename-Item "src\index.css" "src\index-old.css"

# Use new
Rename-Item "src\index-new.css" "src\index.css"
```

### Step 3: Start & Test
```powershell
npm run dev
```

Visit: http://localhost:5173/showcase

---

## 🎨 Component Cheat Sheet

### Button
```jsx
import { Button } from "@/components/ui/Button-new"

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button size="sm">Small</Button>
```

### Card
```jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card-new"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Form
```jsx
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Badge
```jsx
import { Badge } from "@/components/ui/Badge"

<Badge variant="success">Available</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Overdue</Badge>
```

---

## 📁 Files Created

✅ Configuration (4 files)
- tailwind.config.js
- postcss.config.js
- components.json
- vite.config.js (updated)

✅ Components (5 files)
- Button-new.jsx
- Card-new.jsx
- Input.jsx
- Badge.jsx
- Label.jsx

✅ Documentation (3 files)
- MINIMALIST_DESIGN_GUIDE.md
- SHADCN_IMPLEMENTATION_GUIDE.md
- SHADCN_IMPLEMENTATION_SUMMARY.md

✅ Examples (1 file)
- ComponentShowcase.jsx

---

## 🎯 What You Get

✅ Modern minimalist design
✅ 5 ready-to-use components
✅ Tailwind CSS integration
✅ Dark mode ready
✅ Fully responsive
✅ Accessible by default
✅ Backward compatible

---

## 📚 Documentation

**Full Guide:** SHADCN_IMPLEMENTATION_GUIDE.md
**Design Guide:** MINIMALIST_DESIGN_GUIDE.md
**Summary:** SHADCN_IMPLEMENTATION_SUMMARY.md

---

## 🐛 Quick Fixes

**Tailwind not working?**
```powershell
npm run dev
```

**Import errors?**
Restart dev server (Ctrl+C, then npm run dev)

**Styles broken?**
Make sure src/index.css has @tailwind directives

---

## ✅ Quick Test

After installation:
1. Visit http://localhost:5173/showcase
2. See all components in action
3. Test buttons, cards, forms
4. Check responsive design

---

**Ready? Run Step 1! 🚀**
