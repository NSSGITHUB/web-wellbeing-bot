# SEO 監控系統部署指南

## 📋 系統需求

- **伺服器**: AlmaLinux 9.6 或類似系統
- **資料庫**: MariaDB 10.5+
- **PHP**: 7.4+ (建議 8.0+)
- **Node.js**: 16+ (用於前端構建)
- **Composer**: PHP 依賴管理工具

## 🚀 快速開始（已配置好的環境）

您的伺服器已配置：
- **專案路徑**: `/var/www/vhosts/seoreport.ai.com.tw/httpdocs`
- **網站根目錄**: `/var/www/vhosts/seoreport.ai.com.tw/httpdocs/dist`
- **資料庫**: nssreport (已配置在 `api/config.php`)
- **郵件伺服器**: mail.nss.com.tw (已配置)

## 🚀 部署步驟

### 1. 資料庫設定

```bash
# 登入 MariaDB
mysql -u nssreport -p

# 導入資料庫結構
USE nssreport;
SOURCE /var/www/vhosts/seoreport.ai.com.tw/httpdocs/database/mariadb-schema.sql;
```

資料庫配置已設定在 `api/config.php`：
- DB_NAME: nssreport
- DB_USER: nssreport
- DB_PASS: 95Gzc56k*

### 2. 安裝 PHPMailer

```bash
# 進入專案目錄
cd /var/www/vhosts/seoreport.ai.com.tw/httpdocs

# 安裝 PHPMailer（如果尚未安裝）
composer require phpmailer/phpmailer
```

**API 配置已完成：**
- 資料庫、SMTP、收件信箱都已在 `api/config.php` 中配置好
- API 資料夾會在 build 時自動複製到 `dist/api`

### 3. 前端構建與部署

```bash
# 進入專案目錄
cd /var/www/vhosts/seoreport.ai.com.tw/httpdocs

# 安裝依賴（首次或更新時）
npm install

# 構建生產版本
npm run build
```

**重要說明：**
- `npm run build` 會自動將 `api` 資料夾複製到 `dist/api`
- 網站根目錄已指向 `dist`，所以 API 會在 `https://seoreport.ai.com.tw/api/` 可訪問
- 不需要手動複製檔案

### 4. 網站伺服器配置

**您的環境（AlmaLinux + Plesk）：**

由於網站根目錄已設為 `/var/www/vhosts/seoreport.ai.com.tw/httpdocs/dist`，配置應該已經完成。

**確認 PHP 處理 API 請求：**

在 Plesk 中確認：
1. PHP 版本為 7.4 或以上
2. 確保 `.htaccess` 或伺服器配置允許處理 `/api/*.php` 請求

**Apache .htaccess（如需要）：**

在 `dist` 資料夾中創建 `.htaccess`：

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # API 路由
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^api/(.+)\.php$ api/$1.php [L]
    
    # 前端路由
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### 5. 設定定時任務（Cron）

```bash
# 編輯 crontab
crontab -e

# 添加定時任務（使用您的實際路徑）
# 每天早上 8:00 執行報告生成和發送
0 8 * * * /usr/bin/php /var/www/vhosts/seoreport.ai.com.tw/httpdocs/scripts/daily-report.php

# 每週一早上 8:00 執行
0 8 * * 1 /usr/bin/php /var/www/vhosts/seoreport.ai.com.tw/httpdocs/scripts/weekly-report.php

# 每月 1 號早上 8:00 執行
0 8 1 * * /usr/bin/php /var/www/vhosts/seoreport.ai.com.tw/httpdocs/scripts/monthly-report.php
```

### 6. 創建定時腳本

創建 `scripts/daily-report.php`:

```php
<?php
require_once __DIR__ . '/../api/config.php';

$db = getDBConnection();

// 獲取所有每日報告的網站
$stmt = $db->query("SELECT id FROM websites WHERE is_active = 1 AND report_frequency = 'daily'");
$websites = $stmt->fetchAll();

foreach ($websites as $website) {
    // 生成報告
    $ch = curl_init("https://seoreport.ai.com.tw/api/generate-seo-report.php");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['website_id' => $website['id']]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    
    // 發送報告
    $ch = curl_init("https://seoreport.ai.com.tw/api/send-seo-report.php");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['website_id' => $website['id']]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    
    echo "報告已發送給網站 ID: {$website['id']}\n";
}
```

## 📧 如何修改寄件/收件信箱

### 修改寄件信箱（發送郵件的信箱）

編輯 `api/config.php`:

```php
define('SMTP_FROM_EMAIL', 'new-sender@nss.com.tw');  // 改為新的寄件信箱
define('SMTP_USERNAME', 'new-sender@nss.com.tw');   // 同時更新 SMTP 用戶名
define('SMTP_PASSWORD', 'new-password');             // 更新對應密碼
```

### 修改收件信箱（接收報告的信箱）

**方法 1：修改預設收件信箱**

編輯 `api/config.php`:

```php
define('DEFAULT_RECIPIENT_EMAIL', 'new-recipient@nss.com.tw');
```

**方法 2：為每個網站單獨設定**

在資料庫中修改：

```sql
UPDATE websites 
SET notification_email = 'new-recipient@nss.com.tw' 
WHERE id = 'website-id';
```

或在前端管理介面中修改網站設定。

## ⚙️ 更新與維護流程

**更新代碼後的部署流程：**

```bash
# 1. 拉取最新代碼（如使用 Git）
cd /var/www/vhosts/seoreport.ai.com.tw/httpdocs
git pull origin main

# 2. 安裝新依賴（如有更新）
npm install

# 3. 重新構建
npm run build

# 完成！dist 資料夾會自動更新，包含最新的前端和 API 文件
```

## 🔍 測試部署

```bash
# 測試 API
curl -X POST https://seoreport.ai.com.tw/api/generate-seo-report.php \
  -H "Content-Type: application/json" \
  -d '{"website_id":"test-id"}'

# 測試郵件發送
curl -X POST https://seoreport.ai.com.tw/api/send-seo-report.php \
  -H "Content-Type: application/json" \
  -d '{"website_id":"test-id"}'
```

## 🔒 安全建議

1. **更改 API 金鑰**：使用強隨機字符串
2. **HTTPS**：使用 Let's Encrypt 配置 SSL
3. **資料庫權限**：最小權限原則
4. **文件權限**：設定正確的文件權限
   ```bash
   chmod 644 api/config.php
   chmod 755 api/*.php
   ```

## 📝 維護

- **日誌查看**: `/var/log/nginx/` 或 `/var/log/httpd/`
- **資料庫備份**: 
  ```bash
  mysqldump -u seo_user -p seo_monitor > backup_$(date +%Y%m%d).sql
  ```
- **更新代碼**:
  ```bash
  git pull origin main
  npm run build
  ```

## 🆘 常見問題

### 郵件發送失敗

1. 檢查 SMTP 連接：`telnet mail.nss.com.tw 587`
2. 確認防火牆允許 587 端口
3. 查看 PHP 錯誤日誌

### API 無法訪問

1. 檢查 PHP-FPM 狀態：`systemctl status php-fpm`
2. 檢查 Nginx/Apache 配置
3. 查看錯誤日誌

### 資料庫連接失敗

1. 檢查 MariaDB 狀態：`systemctl status mariadb`
2. 確認用戶權限：`SHOW GRANTS FOR 'seo_user'@'localhost';`
3. 測試連接：`mysql -u seo_user -p seo_monitor`
