-- ============================================
-- MariaDB ALTER 腳本
-- 為現有的 profiles 表添加 notification_email 欄位
-- ============================================

-- 注意：此腳本需要具有 ALTER 權限的資料庫用戶執行
-- 如果遇到權限錯誤，請聯繫資料庫管理員或使用 root 用戶執行

-- 為 profiles 表添加 notification_email 欄位
ALTER TABLE profiles 
ADD COLUMN notification_email VARCHAR(255);

-- 驗證欄位是否成功添加
DESCRIBE profiles;
