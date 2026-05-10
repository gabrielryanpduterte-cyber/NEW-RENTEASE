# 🚀 START HERE - RENTEASE Quick Setup

## ⚡ Get Running in 3 Steps

### Step 1: Run Setup (2 minutes)

```powershell
# Open PowerShell as Administrator
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE"

# Run setup
.\scripts\setup.ps1
```

### Step 2: Start Services (1 minute)

1. **Start XAMPP as Administrator**
   - Right-click `C:\xampp\xampp-control.exe`
   - Select "Run as administrator"
   - Click **Start** for Apache
   - Click **Start** for MySQL

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

### Step 3: Access Application (30 seconds)

Open browser: **http://localhost:5173**

Login with:
- Admin: `admin@rentease.local` / `Admin123!`
- Owner: `owner@rentease.local` / `Owner123!`
- Seeker: `seeker@rentease.local` / `Seeker123!`
- Parent: `parent@rentease.local` / `Parent123!`

---

## 🔧 Having Issues?

### MySQL Won't Start?
→ Read `MYSQL_SIMPLE_FIX.md`

### Page Stuck Loading?
→ Read `LOADING_ISSUE_FIX.md`

### Need Full Guide?
→ Read `README.md`

---

## 📚 Documentation

- `README.md` - Full project overview
- `PROJECT_STRUCTURE.md` - File organization
- `MYSQL_SIMPLE_FIX.md` - MySQL troubleshooting
- `docs/DEFENSE_RUNBOOK.md` - Feature walkthrough

---

**That's it! You're ready to use RENTEASE!** 🎉
