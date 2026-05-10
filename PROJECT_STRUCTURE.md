# 📁 RENTEASE - Clean Project Structure

## Root Directory Structure

```
NEW RENTEASE/
├── 📂 backend/              # PHP API (production code)
├── 📂 frontend/             # React app (production code)
├── 📂 database/             # SQL schemas and migrations
├── 📂 scripts/              # Automation scripts
├── 📂 docs/                 # All documentation
├── 📂 design/               # Design references
├── 📂 .amazonq/             # AI assistant rules
├── 📄 README.md             # Main project readme
├── 📄 START_HERE.md         # Quick start guide
└── 📄 QUICK_START.md        # 5-minute setup
```

## Essential Files Only (Root Level)

### Documentation (Keep These)
- `README.md` - Main project overview
- `START_HERE.md` - First-time user guide
- `QUICK_START.md` - Quick setup guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `DEPLOYMENT_STATUS.md` - System readiness
- `PRODUCTION_DEPLOYMENT.md` - Production guide
- `DOCUMENTATION_INDEX.md` - Doc navigation
- `SYSTEM_OPTIMIZATION.md` - Performance guide
- `FIX_MYSQL_XAMPP.md` - MySQL troubleshooting
- `MYSQL_SIMPLE_FIX.md` - Simple MySQL fix
- `LOADING_ISSUE_FIX.md` - Loading issue fix
- `PROJECT_SCAN_REPORT.md` - Project scan results

### Google OAuth (Optional)
- `GOOGLE_AUTH_SETUP.md`
- `QUICK_GOOGLE_SETUP.md`
- `GOOGLE_AUTH_FIXED.md`
- `TOGGLE_GOOGLE_AUTH.md`

### Other
- `RENTEASE-v2.docx` - Design document
- `.gitattributes` - Git configuration

## Backend Structure

```
backend/
├── 📂 config/               # Configuration files
│   └── google-oauth.php
├── 📂 storage/              # File uploads
│   └── uploads/
├── 📂 vendor/               # Composer dependencies
│   └── phpmailer/
├── 📄 *.php                 # API modules (14 files)
└── 📄 composer.json         # PHP dependencies
```

### API Modules (Keep All)
- `auth.php` - Authentication
- `users.php` - User management
- `boarding_house.php` - Properties
- `rooms.php` - Room inventory
- `reservations.php` - Bookings
- `payments.php` - Payments
- `feedback.php` - Reviews
- `reports.php` - Analytics
- `activity_logs.php` - Audit logs
- `error_logs.php` - Error tracking
- `uploads.php` - File uploads
- `account_links.php` - Parent-seeker links
- `google-auth.php` - Google OAuth
- `config.php` - Database config
- `helpers.php` - Utility functions

## Frontend Structure

```
frontend/
├── 📂 public/               # Static assets
│   ├── diagnostic.html      # Connection diagnostic
│   ├── favicon.svg
│   └── icons.svg
├── 📂 src/                  # Source code
│   ├── 📂 api/              # API client
│   ├── 📂 auth/             # Authentication
│   ├── 📂 components/       # UI components
│   ├── 📂 pages/            # Route pages
│   ├── 📂 utils/            # Utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── 📄 package.json          # Dependencies
├── 📄 vite.config.js        # Build config
├── 📄 tailwind.config.js    # Styling config
└── 📄 eslint.config.js      # Linting config
```

## Database Structure

```
database/
├── 📄 rentease_final_phase7.sql          # Main schema + data
├── 📄 phase8_uploads_schema.sql          # Uploads table
├── 📄 phase10_parent_seeker_links_schema.sql  # Links table
├── 📄 phase12_google_oauth_schema.sql    # OAuth columns
├── 📄 phase7_demo_seed.sql               # Demo data
├── 📄 optimize_database.sql              # Performance indexes
└── 📄 *.sql                              # Migration/utility scripts
```

## Scripts Structure

```
scripts/
├── 📄 setup.ps1                          # Main setup script
├── 📄 quick-setup.ps1                    # Legacy setup
├── 📄 verify-deployment.ps1              # System verification
├── 📄 pre-deployment-test.ps1            # Comprehensive tests
├── 📄 quick-fix.ps1                      # Quick fixes
├── 📄 fix-mysql.bat                      # MySQL fix
├── 📄 phase8-api-smoke-test.ps1          # API tests
├── 📄 phase9-account-smoke-test.ps1      # Account tests
└── 📄 phase10-onboarding-smoke-test.ps1  # Onboarding tests
```

## Documentation Structure

```
docs/
├── 📂 archive/              # Old/historical docs (70+ files)
├── 📂 email/                # Email setup guides
├── 📂 testing/              # Testing guides
├── 📂 troubleshooting/      # Issue fixes
├── 📄 DEFENSE_RUNBOOK.md    # Feature walkthrough
├── 📄 PHASE12_SUMMARY.md    # Phase 12 summary
└── 📄 PHASE7_FOOTPRINT_LOG.md  # Phase 7 log
```

## Design Structure

```
design/
├── 📄 DESIGN_REFERENCE.md
├── 📄 IMPLEMENTATION_STATUS.md
├── 📄 QUICK_REFERENCE.md
└── 📄 RENTEASE_V2_COMPLIANCE.md
```

## Files Removed (Cleanup)

### Removed Duplicates
- ❌ `rentease/docs/` - Duplicate documentation folder
- ❌ `backend/config-optimized.php` - Merged into main config
- ❌ `move-md-files.bat` - Temporary script
- ❌ `fix-mysql-now.bat` - Duplicate
- ❌ `repair-mysql.ps1` - Duplicate
- ❌ `repair-mysql-step2.ps1` - Duplicate

### Kept in Root (Essential)
- ✅ All main documentation files
- ✅ README and setup guides
- ✅ Troubleshooting guides
- ✅ Google OAuth guides

## File Count Summary

### Production Code
- Backend: 14 PHP files
- Frontend: ~50 React components
- Database: 15 SQL files
- Scripts: 9 automation scripts

### Documentation
- Root level: 12 essential guides
- docs/ folder: 80+ archived/specialized docs
- Total: ~90 documentation files

## What to Keep vs Archive

### Keep in Root (Active Use)
- Setup guides (START_HERE, QUICK_START)
- Deployment guides (DEPLOYMENT_*, PRODUCTION_*)
- Troubleshooting (FIX_MYSQL, LOADING_ISSUE)
- System docs (OPTIMIZATION, SCAN_REPORT)

### Keep in docs/ (Reference)
- Historical implementation logs
- Phase-specific guides
- Specialized setup guides
- Archived troubleshooting

### Can Delete (If Needed)
- `docs/archive/` - Old implementation guides
- Duplicate troubleshooting files
- Outdated setup guides

## Recommended Cleanup (Optional)

If you want even cleaner structure:

```powershell
# Move all root docs to docs/ except essentials
$essentials = @(
    'README.md',
    'START_HERE.md', 
    'QUICK_START.md',
    'DEPLOYMENT_CHECKLIST.md',
    'DEPLOYMENT_STATUS.md'
)

Get-ChildItem -Filter "*.md" | 
    Where-Object { $_.Name -notin $essentials } |
    Move-Item -Destination "docs/"
```

## Clean Structure Benefits

✅ **Clear separation** - Code vs docs vs scripts  
✅ **No duplicates** - Single source of truth  
✅ **Easy navigation** - Logical folder structure  
✅ **Production ready** - Only essential files in root  
✅ **Maintainable** - Easy to find and update files  

## Quick Reference

### Need to setup?
→ `START_HERE.md` or `QUICK_START.md`

### Need to deploy?
→ `DEPLOYMENT_CHECKLIST.md`

### Having issues?
→ `LOADING_ISSUE_FIX.md` or `FIX_MYSQL_XAMPP.md`

### Need optimization?
→ `SYSTEM_OPTIMIZATION.md`

### Need all docs?
→ `DOCUMENTATION_INDEX.md`

---

**Project is now clean and organized!** ✨
