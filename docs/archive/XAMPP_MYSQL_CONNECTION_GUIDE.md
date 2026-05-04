# How Backend Connects to XAMPP (MySQL)

## 🔌 Your Backend is Already Connected!

Your `backend/config.php` file handles the MySQL connection automatically.

## 📋 Current Configuration

### Default Settings (Already Working):
```php
Host: localhost
Database: rentease_db
User: rentease_user
Password: (empty string)
```

## 🎯 How It Works

### Step 1: XAMPP MySQL Running
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL (should turn green)
3. MySQL is now running on `localhost:3306`

### Step 2: Database Created
Your database `rentease_db` should already exist with tables:
- `users`
- `boarding_houses`
- `rooms`
- `reservations`
- `payments`
- `activity_logs`
- `error_logs`
- `feedback`
- `account_links`

### Step 3: Backend Connects Automatically
When any PHP file runs (like `auth.php`), it:
1. Includes `config.php`
2. Calls `db()` function
3. Creates PDO connection to MySQL
4. Returns database connection object

### Example:
```php
// In auth.php
require_once __DIR__ . '/config.php';

// Get database connection
$pdo = db();

// Now you can query
$query = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$query->execute([':email' => 'test@example.com']);
$user = $query->fetch();
```

## 🔧 Connection Details

### The `db()` Function:
```php
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo; // Reuse existing connection
    }

    // Get config (with defaults)
    $host = 'localhost';
    $name = 'rentease_db';
    $user = 'rentease_user';
    $pass = '';

    // Create connection string
    $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";

    try {
        // Connect to MySQL
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $exception) {
        // Connection failed
        database_unavailable();
    }

    return $pdo;
}
```

## 🗄️ Database User Setup

### Option 1: Using Default Root User (Current Setup)
Your system uses `rentease_user` with no password, which likely falls back to MySQL root user.

### Option 2: Create Dedicated User (Recommended for Production)

**Via phpMyAdmin:**
1. Open: http://localhost/phpmyadmin
2. Click "User accounts" tab
3. Click "Add user account"
4. Fill in:
   - Username: `rentease_user`
   - Host: `localhost`
   - Password: (leave empty or set one)
5. Check "Create database with same name"
6. Grant all privileges
7. Click "Go"

**Via SQL:**
```sql
-- Create user
CREATE USER 'rentease_user'@'localhost' IDENTIFIED BY '';

-- Grant privileges
GRANT ALL PRIVILEGES ON rentease_db.* TO 'rentease_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

## 🔐 Using Environment Variables (Optional)

Instead of hardcoded values, you can use environment variables:

### Create `.env` file in backend folder:
```env
RENTEASE_DB_HOST=localhost
RENTEASE_DB_NAME=rentease_db
RENTEASE_DB_USER=rentease_user
RENTEASE_DB_PASS=
```

### The config.php already supports this:
```php
$host = db_config('RENTEASE_DB_HOST', 'localhost'); // Reads from env or uses default
$name = db_config('RENTEASE_DB_NAME', 'rentease_db');
$user = db_config('RENTEASE_DB_USER', 'rentease_user');
$pass = db_config('RENTEASE_DB_PASS', '');
```

## ✅ Verify Connection

### Method 1: Check Backend Response
1. Open browser
2. Go to: http://localhost/rentease/backend/auth.php?action=me
3. Should see JSON response (not database error)

### Method 2: Create Test File
Create `backend/test-db.php`:
```php
<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = db();
    echo "✅ Database connected successfully!\n";
    
    // Test query
    $result = $pdo->query('SELECT COUNT(*) as count FROM users');
    $count = $result->fetch();
    echo "Total users: " . $count['count'];
} catch (Exception $e) {
    echo "❌ Connection failed: " . $e->getMessage();
}
?>
```

Visit: http://localhost/rentease/backend/test-db.php

## 🚨 Common Connection Issues

### Issue 1: "Database connection failed"
**Cause**: MySQL not running or wrong credentials

**Fix**:
1. Open XAMPP Control Panel
2. Start MySQL (click "Start")
3. Check it turns green
4. Try again

### Issue 2: "Access denied for user"
**Cause**: Wrong username or password

**Fix**:
1. Open phpMyAdmin
2. Check user exists: User accounts tab
3. Update `config.php` with correct credentials

### Issue 3: "Unknown database 'rentease_db'"
**Cause**: Database doesn't exist

**Fix**:
1. Open phpMyAdmin
2. Click "New" to create database
3. Name it: `rentease_db`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"
6. Import your SQL schema

### Issue 4: "SQLSTATE[HY000] [2002] No connection"
**Cause**: MySQL service not running

**Fix**:
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for green status
4. Try again

## 📁 File Locations

### Backend Files:
```
C:\xampp\htdocs\rentease\backend\
├── config.php          ← Database connection
├── auth.php            ← Uses db()
├── users.php           ← Uses db()
├── boarding_house.php  ← Uses db()
└── ...
```

### Database Location:
```
C:\xampp\mysql\data\rentease_db\
├── users.frm
├── users.ibd
└── ... (table files)
```

## 🎯 Connection Flow Diagram

```
Frontend (React)
    ↓
    HTTP Request
    ↓
Backend PHP File (auth.php)
    ↓
    require_once 'config.php'
    ↓
    $pdo = db()
    ↓
PDO Connection
    ↓
XAMPP MySQL (localhost:3306)
    ↓
rentease_db Database
    ↓
Query Results
    ↓
JSON Response
    ↓
Frontend (React)
```

## 🔒 Security Notes

1. **Never commit database passwords** to Git
2. **Use environment variables** for production
3. **Create dedicated database user** (not root)
4. **Use strong passwords** in production
5. **Limit user privileges** to only what's needed

## ✅ Your Current Setup is Working!

Your backend is already properly connected to XAMPP MySQL. Every time you:
- Login
- Register
- Fetch data
- Update records

The backend automatically connects to MySQL through the `db()` function in `config.php`.

**No additional setup needed - it's already working!**
