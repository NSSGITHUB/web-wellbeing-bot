# SEO 監控系統部署指南

## 📋 系統需求

- **伺服器**: AlmaLinux 9.6 或類似系統
- **資料庫**: MariaDB 10.5+
- **PHP**: 7.4+ (建議 8.0+)
- **Node.js**: 16+ (用於前端構建)
- **Composer**: PHP 依賴管理工具

## 🚀 部署步驟

### 1. 資料庫設定

```bash
# 登入 MariaDB
mysql -u root -p

# 創建資料庫
CREATE DATABASE seo_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 創建用戶並授權
CREATE USER 'seo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON seo_monitor.* TO 'seo_user'@'localhost';
FLUSH PRIVILEGES;

# 導入資料庫結構
USE seo_monitor;
SOURCE /path/to/database/mariadb-schema.sql;
```

### 2. 後端 API 部署

```bash
# 進入專案目錄
cd /var/www/html/your-project

# 安裝 PHPMailer
composer require phpmailer/phpmailer

# 配置 API
cd api
cp config.php config.php.backup
nano config.php
```

**修改 `api/config.php` 中的配置：**

```php
// 資料庫配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'seo_monitor');
define('DB_USER', 'seo_user');
define('DB_PASS', 'your_secure_password');

// SMTP 郵件配置（已配置好）
define('SMTP_HOST', 'mail.nss.com.tw');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'leo.yen@nss.com.tw');
define('SMTP_PASSWORD', 'Aselia0419');
define('SMTP_FROM_EMAIL', 'leo.yen@nss.com.tw');

// 預設收件信箱
define('DEFAULT_RECIPIENT_EMAIL', 'leo.yen@nss.com.tw');

// API 安全金鑰（請改為複雜字符串）
define('API_SECRET_KEY', 'your-random-secret-key-here');
```

### 3. 前端部署

```bash
# 從 GitHub 克隆專案
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 安裝依賴
npm install

# 配置環境變數
nano .env.production
```

**創建 `.env.production` 文件：**

```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_API_SECRET_KEY=your-random-secret-key-here
```

**構建前端：**

```bash
# 構建生產版本
npm run build

# 部署到網站根目錄
cp -r dist/* /var/www/html/your-project/
```

### 4. Nginx/Apache 配置

**Nginx 配置示例：**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/your-project;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 路由
    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        try_files $uri $uri/ /api/$1.php;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php-fpm/php-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
}
```

**Apache 配置示例 (.htaccess)：**

```apache
# 放在專案根目錄
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # API 重寫規則
    RewriteRule ^api/(.*)$ api/$1.php [L]
    
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

# 添加定時任務
# 每天早上 8:00 執行報告生成和發送
0 8 * * * /usr/bin/php /var/www/html/your-project/scripts/daily-report.php

# 每週一早上 8:00 執行
0 8 * * 1 /usr/bin/php /var/www/html/your-project/scripts/weekly-report.php

# 每月 1 號早上 8:00 執行
0 8 1 * * /usr/bin/php /var/www/html/your-project/scripts/monthly-report.php
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
    $ch = curl_init("https://your-domain.com/api/generate-seo-report.php");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['website_id' => $website['id']]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    
    // 發送報告
    $ch = curl_init("https://your-domain.com/api/send-seo-report.php");
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

## ⚙️ 前端配置修改

如果 API URL 改變，需要修改前端配置：

1. 編輯 `.env.production`
2. 修改 `VITE_API_BASE_URL`
3. 重新構建：`npm run build`
4. 重新部署

## 🔍 測試部署

```bash
# 測試 API
curl -X POST https://your-domain.com/api/generate-seo-report.php \
  -H "Content-Type: application/json" \
  -d '{"website_id":"test-id"}'

# 測試郵件發送
curl -X POST https://your-domain.com/api/send-seo-report.php \
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
