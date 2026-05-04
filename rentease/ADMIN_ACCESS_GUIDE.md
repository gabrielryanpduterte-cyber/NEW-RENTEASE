# Admin Access Guide

## 🔐 Admin Role - Hidden from Public

The admin role is **NOT available** in the public registration or login dropdowns for security reasons.

## 👤 How Admins Access the System

### Method 1: Direct URL Access (Recommended)
Admins who know their credentials can access directly:

1. Go to: `http://localhost:5173/login`
2. Open browser console (F12)
3. In console, type:
   ```javascript
   document.querySelector('#role').innerHTML += '<option value="admin">Admin</option>';
   document.querySelector('#role').value = 'admin';
   ```
4. Enter admin email and password
5. Click Login
6. Access admin dashboard

### Method 2: Create Admin Account via Database
Admins must be created directly in the database:

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select database: `rentease_db`
3. Go to `users` table
4. Click "Insert"
5. Fill in:
   - `full_name`: Admin Name
   - `email`: admin@rentease.com
   - `password_hash`: (use PHP to generate)
   - `role`: `admin`
   - `contact_number`: 09123456789
   - `account_status`: `active`
   - `email_verified`: `1`
   - `created_at`: NOW()
6. Click "Go"

### Method 3: Generate Password Hash
To create password hash for admin:

1. Create file: `backend/generate-password.php`
```php
<?php
$password = 'YourAdminPassword123';
echo password_hash($password, PASSWORD_DEFAULT);
?>
```

2. Visit: `http://localhost/rentease/backend/generate-password.php`
3. Copy the hash
4. Use it in database insert
5. Delete the file after use (security)

## 🎯 Admin Login Flow

1. Admin manually adds admin option to dropdown (via console)
2. Enters email: `admin@rentease.com`
3. Enters password: `YourAdminPassword123`
4. Selects role: `admin`
5. Clicks Login
6. Redirects to: `/admin/dashboard`

## 🔒 Security Features

- ✅ Admin option hidden from UI
- ✅ Cannot register as admin via form
- ✅ Cannot create admin via Google OAuth
- ✅ Only database-created admins can login
- ✅ Admins must know the system to access

## 📋 Admin Capabilities

Once logged in, admins can:
- View all users
- Manage boarding houses
- View all reservations
- Access reports
- Manage system settings
- View activity logs
- Handle user accounts

## ⚠️ Important Notes

1. **Never share admin credentials** with regular users
2. **Admin accounts should be created manually** in database only
3. **Regular users cannot see admin option** in dropdowns
4. **Admins must know how to access** the system (intentional security)
5. **Use strong passwords** for admin accounts

## 🧪 Test Admin Access

### Create Test Admin:
```sql
INSERT INTO users (
    full_name, 
    email, 
    password_hash, 
    role, 
    contact_number, 
    account_status, 
    email_verified, 
    created_at
) VALUES (
    'System Admin',
    'admin@rentease.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'admin',
    '09123456789',
    'active',
    1,
    NOW()
);
```

### Login as Admin:
1. Go to login page
2. Open console (F12)
3. Add admin option to dropdown
4. Email: `admin@rentease.com`
5. Password: `password`
6. Role: `admin`
7. Login

## ✅ Why This Approach?

**Security by Obscurity + Access Control:**
- Regular users don't even know admin role exists
- Prevents unauthorized admin access attempts
- Only authorized personnel know how to access
- Reduces attack surface
- Admin accounts fully controlled by system administrators

This is a common pattern for admin access in web applications where admin functionality should be completely hidden from regular users.
