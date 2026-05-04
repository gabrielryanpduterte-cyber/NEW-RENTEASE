<?php
/**
 * Manual PHPMailer Autoloader
 * Used when Composer installation fails
 */

spl_autoload_register(function ($class) {
    // Check if this is a PHPMailer class
    if (strpos($class, 'PHPMailer\\PHPMailer\\') === 0) {
        $file = __DIR__ . '/phpmailer/phpmailer/src/' . str_replace('PHPMailer\\PHPMailer\\', '', $class) . '.php';
        if (file_exists($file)) {
            require $file;
        }
    }
});
