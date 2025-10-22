<?php
/**
 * 生成 SEO 報告 API
 * URL: /api/generate-seo-report.php
 */

require_once 'config.php';

setCorsHeaders();

try {
    // 驗證請求方法
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        errorResponse('僅支援 POST 請求', 405);
    }

    // 讀取請求數據
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['website_id'])) {
        errorResponse('缺少 website_id 參數', 400);
    }

    $websiteId = $input['website_id'];
    $db = getDBConnection();

    // 獲取網站資訊
    $stmt = $db->prepare("SELECT * FROM websites WHERE id = ?");
    $stmt->execute([$websiteId]);
    $website = $stmt->fetch();

    if (!$website) {
        errorResponse('找不到該網站', 404);
    }

    // 獲取關鍵字
    $stmt = $db->prepare("SELECT * FROM keywords WHERE website_id = ?");
    $stmt->execute([$websiteId]);
    $keywords = $stmt->fetchAll();

    // 獲取競爭對手
    $stmt = $db->prepare("SELECT * FROM competitors WHERE website_id = ?");
    $stmt->execute([$websiteId]);
    $competitors = $stmt->fetchAll();

    // 模擬 SEO 分析（實際應該調用真實的 SEO API）
    $overallScore = rand(60, 95);
    $speedScore = rand(50, 100);
    $backlinksCount = rand(100, 5000);
    $structureIssuesCount = rand(0, 20);

    // 為每個關鍵字生成模擬排名並記錄歷史
    foreach ($keywords as $keyword) {
        $newRanking = rand(1, 100);
        
        // 更新關鍵字排名
        $stmt = $db->prepare("
            UPDATE keywords 
            SET previous_ranking = current_ranking, 
                current_ranking = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$newRanking, $keyword['id']]);

        // 記錄排名歷史
        $stmt = $db->prepare("
            INSERT INTO keyword_ranking_history (keyword_id, ranking, checked_at, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$keyword['id'], $newRanking]);
    }

    // 為競爭對手關鍵字生成模擬排名
    foreach ($competitors as $competitor) {
        // 更新競爭對手分數
        $compOverallScore = rand(60, 95);
        $compSpeedScore = rand(50, 100);
        $compBacklinks = rand(100, 5000);
        
        $stmt = $db->prepare("
            UPDATE competitors 
            SET overall_score = ?,
                speed_score = ?,
                backlinks_count = ?,
                last_checked_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$compOverallScore, $compSpeedScore, $compBacklinks, $competitor['id']]);

        // 獲取競爭對手關鍵字
        $stmt = $db->prepare("SELECT * FROM competitor_keywords WHERE competitor_id = ?");
        $stmt->execute([$competitor['id']]);
        $compKeywords = $stmt->fetchAll();

        foreach ($compKeywords as $compKeyword) {
            $newRanking = rand(1, 100);
            
            // 更新競爭對手關鍵字排名
            $stmt = $db->prepare("
                UPDATE competitor_keywords 
                SET previous_ranking = current_ranking,
                    current_ranking = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$newRanking, $compKeyword['id']]);

            // 記錄排名歷史
            $stmt = $db->prepare("
                INSERT INTO keyword_ranking_history (competitor_keyword_id, ranking, checked_at, created_at)
                VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([$compKeyword['id'], $newRanking]);
        }
    }

    // 創建報告數據
    $reportData = [
        'keywords' => $keywords,
        'competitors' => $competitors,
        'analysis_date' => date('Y-m-d H:i:s'),
        'url' => $website['website_url']
    ];

    // 儲存 SEO 報告
    $stmt = $db->prepare("
        INSERT INTO seo_reports (
            website_id, 
            report_date, 
            overall_score, 
            speed_score, 
            backlinks_count, 
            structure_issues_count,
            report_data,
            created_at
        ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ");
    
    $stmt->execute([
        $websiteId,
        $overallScore,
        $speedScore,
        $backlinksCount,
        $structureIssuesCount,
        json_encode($reportData, JSON_UNESCAPED_UNICODE)
    ]);

    $reportId = $db->lastInsertId();

    jsonResponse([
        'success' => true,
        'report_id' => $reportId,
        'data' => [
            'overall_score' => $overallScore,
            'speed_score' => $speedScore,
            'backlinks_count' => $backlinksCount,
            'structure_issues_count' => $structureIssuesCount
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in generate-seo-report: " . $e->getMessage());
    errorResponse('生成報告時發生錯誤: ' . $e->getMessage(), 500);
}
