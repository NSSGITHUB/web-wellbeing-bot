-- ============================================
-- MariaDB 資料庫創建腳本
-- SEO監控系統
-- ============================================

-- 1. 創建 profiles 表
CREATE TABLE profiles (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 創建 websites 表
CREATE TABLE websites (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    website_url TEXT NOT NULL,
    website_name VARCHAR(255),
    notification_email VARCHAR(255) NOT NULL,
    report_frequency VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 創建 keywords 表
CREATE TABLE keywords (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    website_id CHAR(36) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    current_ranking INT,
    previous_ranking INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_website_id (website_id),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 創建 competitors 表
CREATE TABLE competitors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    website_id CHAR(36) NOT NULL,
    competitor_url TEXT NOT NULL,
    competitor_name VARCHAR(255),
    overall_score INT,
    speed_score INT,
    backlinks_count INT,
    last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_website_id (website_id),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 創建 competitor_keywords 表
CREATE TABLE competitor_keywords (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    competitor_id CHAR(36) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    current_ranking INT,
    previous_ranking INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_competitor_id (competitor_id),
    FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 創建 seo_reports 表
CREATE TABLE seo_reports (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    website_id CHAR(36) NOT NULL,
    report_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    overall_score INT,
    speed_score INT,
    backlinks_count INT,
    structure_issues_count INT,
    report_data JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_website_id (website_id),
    INDEX idx_report_date (report_date),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 創建 keyword_ranking_history 表
CREATE TABLE keyword_ranking_history (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    keyword_id CHAR(36),
    competitor_keyword_id CHAR(36),
    ranking INT NOT NULL,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_keyword_id (keyword_id),
    INDEX idx_competitor_keyword_id (competitor_keyword_id),
    INDEX idx_checked_at (checked_at),
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
    FOREIGN KEY (competitor_keyword_id) REFERENCES competitor_keywords(id) ON DELETE CASCADE,
    CHECK ((keyword_id IS NOT NULL AND competitor_keyword_id IS NULL) OR (keyword_id IS NULL AND competitor_keyword_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
