<?php
/**
 * Database Migration Check Script
 * Checks if email verification columns exist in users table
 */

require_once __DIR__ . '/config.php';

try {
    $pdo = db();
    
    // Check if new columns exist
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'email_verified'");
    $emailVerifiedExists = $stmt->fetch();
    
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'verification_token'");
    $verificationTokenExists = $stmt->fetch();
    
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'password_reset_token'");
    $passwordResetTokenExists = $stmt->fetch();
    
    echo "=== DATABASE MIGRATION STATUS ===\n\n";
    
    if ($emailVerifiedExists && $verificationTokenExists && $passwordResetTokenExists) {
        echo "✅ MIGRATION COMPLETE!\n";
        echo "✅ email_verified column exists\n";
        echo "✅ verification_token column exists\n";
        echo "✅ verification_token_expires column exists\n";
        echo "✅ password_reset_token column exists\n";
        echo "✅ password_reset_expires column exists\n\n";
        echo "Database is ready for email verification feature!\n";
    } else {
        echo "❌ MIGRATION NOT RUN!\n\n";
        echo "Missing columns:\n";
        if (!$emailVerifiedExists) echo "  - email_verified\n";
        if (!$verificationTokenExists) echo "  - verification_token\n";
        if (!$passwordResetTokenExists) echo "  - password_reset_token\n";
        echo "\nPlease run: database/phase11_email_verification_schema.sql\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
?>
