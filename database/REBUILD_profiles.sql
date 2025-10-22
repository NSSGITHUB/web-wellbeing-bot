-- ============================================
-- MariaDB 完整 profiles 資料表重建腳本
-- 處理外鍵約束問題
-- ============================================

-- 步驟 1: 暫時禁用外鍵檢查（謹慎使用）
SET FOREIGN_KEY_CHECKS = 0;

-- 步驟 2: 刪除現有的 profiles 表
DROP TABLE IF EXISTS profiles;

-- 步驟 3: 創建新的 profiles 表（包含 notification_email 欄位）
CREATE TABLE profiles (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    notification_email VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 步驟 4: 重新啟用外鍵檢查
SET FOREIGN_KEY_CHECKS = 1;

-- 步驟 5: 驗證表結構
DESCRIBE profiles;
