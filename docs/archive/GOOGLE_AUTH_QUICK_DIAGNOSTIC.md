# 🔍 Quick Diagnostic - Run This First

## Copy and paste this in your browser console (F12 → Console tab):

```javascript
console.log('🔍 RENTEASE Google Auth Diagnostic\n');

// Test 1: Check if backend is reachable
console.log('Test 1: Checking backend...');
fetch('/backend/google-auth.php')
  .then(response => {
    console.log('✅ Backend Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Backend Response:', data);
    console.log('✅ Backend is working!');
  })
  .catch(error => {
    console.error('❌ Backend Error:', error);
    console.error('❌ Backend is NOT reachable!');
    console.log('\n📋 Possible causes:');
    console.log('1. Apache is not running in XAMPP');
    console.log('2. Backend files are not in C:\\xampp\\htdocs\\rentease\\backend\\');
    console.log('3. Vite proxy is not configured correctly');
  });

// Test 2: Check current location
console.log('\nTest 2: Current page info');
console.log('URL:', window.location.href);
console.log('Origin:', window.location.origin);

// Test 3: Check if on complete profile page
if (window.location.pathname === '/complete-profile') {
  console.log('\n✅ You are on the Complete Profile page');
  console.log('Google data in state:', window.history.state);
} else {
  console.log('\n⚠️ You are NOT on the Complete Profile page');
  console.log('Current path:', window.location.pathname);
}

console.log('\n📊 Diagnostic complete!');
console.log('Check the results above ☝️');
```

---

## 🎯 What to Look For:

### ✅ Good Result:
```
✅ Backend Status: 200
✅ Backend Response: {success: false, message: "Invalid action.", ...}
✅ Backend is working!
```

### ❌ Bad Result:
```
❌ Backend Error: TypeError: Failed to fetch
❌ Backend is NOT reachable!
```

---

## 🔧 If Backend is NOT Reachable:

### Step 1: Check XAMPP
1. Open XAMPP Control Panel
2. Look at Apache - is it green and says "Running"?
3. If not, click "Start"

### Step 2: Check Backend Files
1. Open File Explorer
2. Go to: `C:\xampp\htdocs\`
3. Is there a `rentease` folder?
4. Inside `rentease`, is there a `backend` folder?
5. Inside `backend`, is there a `google-auth.php` file?

### Step 3: Test Direct URL
Open in browser:
```
http://localhost/rentease/backend/google-auth.php
```

Should show JSON response (not 404)

### Step 4: Restart Vite
In your terminal:
```bash
# Stop Vite (Ctrl+C)
# Then start again:
npm run dev
```

---

## 🆘 Quick Fix Commands

### If backend folder is not in htdocs:

**Option A: Copy folder**
```powershell
# Copy your backend to htdocs
Copy-Item -Path "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease\backend" -Destination "C:\xampp\htdocs\rentease\backend" -Recurse
```

**Option B: Create symbolic link**
```powershell
# Run as Administrator
New-Item -ItemType SymbolicLink -Path "C:\xampp\htdocs\rentease" -Target "C:\Users\gabri\OneDrive\Desktop\NEW RENTEASE\rentease"
```

---

## 📞 Share These Results

If still not working, share:
1. The console output from the diagnostic script above
2. Screenshot of XAMPP Control Panel
3. Screenshot of browser Network tab (F12 → Network)

---

**Run the diagnostic script first, then we can fix the specific issue!** 🔍
