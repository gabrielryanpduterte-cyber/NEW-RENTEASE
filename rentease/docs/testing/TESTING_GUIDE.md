# RentEase Testing Guide

## Prerequisites

- **XAMPP** installed (Apache + MySQL)
- **Node.js** installed (v16 or higher)
- **PowerShell** (Windows)

## Initial Setup

### 1. Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Click **Start** for **Apache**
3. Click **Start** for **MySQL**
4. Verify both show green "Running" status

### 2. Run Database Setup

Open **PowerShell as Administrator**:

```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\scripts"

# Run setup script (creates database, imports schema, links project)
.\phase8-local-setup.ps1
```

**Expected Output:**
```
[phase8-setup] Project root: C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease
[phase8-setup] XAMPP root: C:\xampp
[phase8-setup] Created junction: C:\xampp\htdocs\rentease -> ...
[phase8-setup] Ensuring database 'rentease_db' exists
[phase8-setup] Setup completed successfully.
```

### 3. Start Frontend Development Server

Open a **new PowerShell window**:

```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\frontend"

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main application UI |
| **Backend API** | http://localhost/rentease/backend/ | REST API endpoints |
| **phpMyAdmin** | http://localhost/phpmyadmin | Database management |

## Automated Testing

### Run All Smoke Tests

```powershell
cd "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\scripts"

# Test API endpoints
.\phase8-api-smoke-test.ps1

# Test account features
.\phase9-account-smoke-test.ps1

# Test onboarding features
.\phase10-onboarding-smoke-test.ps1
```

## Manual Testing

### Test 1: User Authentication

1. Open http://localhost:5173
2. Click **Login**
3. **IMPORTANT**: Select the role from dropdown first!
4. Use test credentials:
   - **Admin**: `admin@rentease.local` / `Admin123!` (role: admin)
   - **Owner**: `owner@rentease.local` / `Owner123!` (role: owner)
   - **Seeker**: `seeker@rentease.local` / `Seeker123!` (role: seeker)
   - **Parent**: `parent@rentease.local` / `Parent123!` (role: parent)
5. Verify successful login and redirect to dashboard

**Note**: Phase 10 requires role selection during login. If you get "Email or password is incorrect", make sure you selected the correct role!

### Test 2: Browse Properties

1. Navigate to **Properties** or **Boarding Houses**
2. Verify property listings display
3. Click on a property to view details
4. Check images, description, amenities load correctly

### Test 3: Create Reservation (Tenant)

1. Login as **tenant**
2. Browse available properties
3. Click **Book Now** on a property
4. Fill reservation form:
   - Check-in date
   - Check-out date
   - Number of guests
5. Submit reservation
6. Verify confirmation message

### Test 4: Manage Properties (Landlord)

1. Login as **landlord**
2. Go to **My Properties**
3. Click **Add Property**
4. Fill property details:
   - Name
   - Address
   - Price
   - Description
   - Upload images
5. Submit and verify property created

### Test 5: Admin Dashboard

1. Login as **admin**
2. Access **Dashboard**
3. Verify statistics display:
   - Total users
   - Total properties
   - Total reservations
   - Revenue
4. Check **Activity Logs**
5. Check **Error Logs**

### Test 6: Payment Processing

1. Login as **tenant**
2. Go to **My Reservations**
3. Find pending reservation
4. Click **Pay Now**
5. Enter payment details
6. Verify payment confirmation

### Test 7: Feedback System

1. Login as any user
2. Navigate to **Feedback**
3. Submit feedback:
   - Rating (1-5 stars)
   - Comments
4. Verify submission success
5. Login as **admin** to view feedback

### Test 8: File Uploads

1. Login as **landlord**
2. Create/Edit property
3. Upload property images
4. Verify images display correctly
5. Check file stored in `backend/storage/uploads/`

## API Testing with cURL

### Test Authentication

```bash
# Login (MUST include role!)
curl -X POST http://localhost/rentease/backend/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rentease.local","password":"Admin123!","role":"admin"}'
```

### Test Get Users (Admin)

```bash
curl -X GET "http://localhost/rentease/backend/users.php" \
  -H "Cookie: session_id=YOUR_SESSION_ID"
```

### Test Create Error Log

```bash
curl -X POST http://localhost/rentease/backend/error_logs.php \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d "{\"error_code\":\"TEST_001\",\"error_message\":\"Test error\"}"
```

### Test Get Reservations

```bash
curl -X GET "http://localhost/rentease/backend/reservations.php" \
  -H "Cookie: session_id=YOUR_SESSION_ID"
```

## Database Testing

### Verify Tables Created

1. Open http://localhost/phpmyadmin
2. Select **rentease_db** database
3. Verify tables exist:
   - `users`
   - `boarding_houses`
   - `rooms`
   - `reservations`
   - `payments`
   - `feedback`
   - `error_logs`
   - `activity_logs`
   - `uploads`
   - `account_links`

### Check Sample Data

```sql
-- Check users
SELECT * FROM users;

-- Check properties
SELECT * FROM boarding_houses;

-- Check reservations
SELECT * FROM reservations;
```

## Security Testing

### Test 1: Unauthorized Access

```bash
# Try accessing admin endpoint without login
curl -X GET "http://localhost/rentease/backend/users.php"
# Expected: 401 Unauthorized
```

### Test 2: Role-Based Access

1. Login as **tenant**
2. Try accessing admin-only pages
3. Verify access denied

### Test 3: SQL Injection Prevention

```bash
# Try SQL injection in login
curl -X POST http://localhost/rentease/backend/auth.php \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin' OR '1'='1\",\"password\":\"anything\"}"
# Expected: Login failed
```

### Test 4: XSS Prevention

1. Try submitting `<script>alert('XSS')</script>` in forms
2. Verify script doesn't execute
3. Check data is escaped in database

## Performance Testing

### Test 1: Load Time

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Load main page
4. Verify page loads under 3 seconds

### Test 2: API Response Time

```bash
# Measure API response time
curl -w "@-" -o /dev/null -s http://localhost/rentease/backend/users.php \
  -H "Cookie: session_id=YOUR_SESSION_ID" <<'EOF'
time_total: %{time_total}s
EOF
```

## Error Handling Testing

### Test 1: Invalid Input

1. Submit forms with empty required fields
2. Verify validation errors display
3. Check error messages are user-friendly

### Test 2: Database Errors

1. Stop MySQL in XAMPP
2. Try accessing any page
3. Verify graceful error handling
4. Check error logged in `error_logs` table

### Test 3: File Upload Errors

1. Try uploading file > 10MB
2. Try uploading invalid file type
3. Verify appropriate error messages

## Browser Compatibility Testing

Test on multiple browsers:
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (if available)

## Mobile Responsiveness Testing

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

## Common Issues & Solutions

### Issue: Registration HTTP 500 Error

**Solution:**
Apply Phase 11 database schema:
```powershell
cd C:\xampp\mysql\bin
mysql.exe -u root rentease_db < "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\database\phase11_email_verification_schema.sql"
```

Or re-run the updated setup script:
```powershell
.\scripts\phase8-local-setup.ps1
```

### Issue: Port 80 Already in Use

**Solution:**
- Stop IIS: `net stop was /y`
- Or change Apache port in XAMPP config

### Issue: MySQL Won't Start

**Solution:**
- Check port 3306 not in use
- Check XAMPP logs: `C:\xampp\mysql\data\mysql_error.log`

### Issue: Frontend Won't Start

**Solution:**
```powershell
# Clear node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: 404 on Backend API

**Solution:**
- Verify XAMPP Apache is running
- Check junction exists: `C:\xampp\htdocs\rentease`
- Verify URL: `http://localhost/rentease/backend/auth.php`

### Issue: Database Connection Failed

**Solution:**
- Check `backend/config.php` database credentials
- Verify MySQL running in XAMPP
- Test connection in phpMyAdmin

## Test Checklist

- [ ] XAMPP services running
- [ ] Database setup completed
- [ ] Frontend server running
- [ ] Can access all URLs
- [ ] User login works (all roles)
- [ ] Property listing displays
- [ ] Reservations can be created
- [ ] Payments process correctly
- [ ] File uploads work
- [ ] Admin dashboard accessible
- [ ] Error logs recording
- [ ] Activity logs recording
- [ ] Feedback submission works
- [ ] API endpoints respond correctly
- [ ] Security measures working
- [ ] Mobile responsive
- [ ] Browser compatible

## Next Steps

After testing:
1. Review error logs for issues
2. Check activity logs for user actions
3. Optimize slow queries
4. Fix any bugs found
5. Document any new features
6. Prepare for deployment

## Support

For issues or questions:
- Check `backend/storage/logs/` for error logs
- Review `error_logs` table in database
- Check browser console for JavaScript errors
- Review XAMPP logs for server errors
