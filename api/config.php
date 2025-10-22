<?php
/**
 * API 配置文件
 * 修改此文件來更改數據庫連接和郵件設定
 */

// 數據庫配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'nssreport');
define('DB_USER', 'nssreport');
define('DB_PASS', '95Gzc56k*');
define('DB_CHARSET', 'utf8mb4');

// SMTP 郵件配置
define('SMTP_HOST', 'mail.nss.com.tw');
define('SMTP_PORT', 587); // 或 465 for SSL
define('SMTP_USERNAME', 'leo.yen@nss.com.tw');
define('SMTP_PASSWORD', 'Aselia0419');
define('SMTP_FROM_EMAIL', 'leo.yen@nss.com.tw');  // 修改此處更改寄件信箱
define('SMTP_FROM_NAME', 'SEO 監控系統');

// 預設收件信箱（可在資料庫中為每個網站單獨設定）
define('DEFAULT_RECIPIENT_EMAIL', 'leo.yen@nss.com.tw');  // 修改此處更改預設收件信箱

// API 安全金鑰（建議使用環境變數或更安全的方式存儲）
define('API_SECRET_KEY', 'your-secret-key-here');  // 請修改為複雜的隨機字符串

// CORS 配置
define('ALLOW_CORS', true);
define('CORS_ORIGIN', '*');  // 生產環境建議改為你的域名

// 時區設定
date_default_timezone_set('Asia/Taipei');

/**
 * 獲取數據庫連接
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception("資料庫連接失敗");
    }
}

/**
 * 設定 CORS 標頭
 */
function setCorsHeaders() {
    if (ALLOW_CORS) {
        header("Access-Control-Allow-Origin: " . CORS_ORIGIN);
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 86400");
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit();
        }
    }
}

/**
 * 驗證 API 請求
 */
function validateAPIRequest() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return false;
    }
    
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    return $token === API_SECRET_KEY;
}

/**
 * 返回 JSON 響應
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * 錯誤響應
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}
