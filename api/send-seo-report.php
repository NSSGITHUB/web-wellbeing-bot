<?php
/**
 * 發送 SEO 報告郵件 API
 * URL: /api/send-seo-report.php
 * 
 * 需要先安裝 PHPMailer: composer require phpmailer/phpmailer
 */

require_once 'config.php';

// 引入 PHPMailer（如果使用 composer autoload）
// require_once '../vendor/autoload.php';

// 或手動引入 PHPMailer 文件
// require_once '../vendor/phpmailer/phpmailer/src/PHPMailer.php';
// require_once '../vendor/phpmailer/phpmailer/src/SMTP.php';
// require_once '../vendor/phpmailer/phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

    // 獲取最新的 SEO 報告
    $stmt = $db->prepare("
        SELECT * FROM seo_reports 
        WHERE website_id = ? 
        ORDER BY report_date DESC 
        LIMIT 1
    ");
    $stmt->execute([$websiteId]);
    $report = $stmt->fetch();

    if (!$report) {
        errorResponse('找不到 SEO 報告，請先生成報告', 404);
    }

    // 獲取關鍵字排名歷史（過去30天）
    $stmt = $db->prepare("
        SELECT k.keyword, k.current_ranking, k.previous_ranking,
               GROUP_CONCAT(
                   CONCAT(DATE_FORMAT(krh.checked_at, '%Y-%m-%d'), ':', krh.ranking)
                   ORDER BY krh.checked_at
                   SEPARATOR '|'
               ) as history
        FROM keywords k
        LEFT JOIN keyword_ranking_history krh ON k.id = krh.keyword_id
            AND krh.checked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE k.website_id = ?
        GROUP BY k.id, k.keyword, k.current_ranking, k.previous_ranking
    ");
    $stmt->execute([$websiteId]);
    $keywords = $stmt->fetchAll();

    // 獲取競爭對手關鍵字排名歷史
    $stmt = $db->prepare("
        SELECT c.competitor_name, c.competitor_url,
               ck.keyword, ck.current_ranking, ck.previous_ranking,
               GROUP_CONCAT(
                   CONCAT(DATE_FORMAT(krh.checked_at, '%Y-%m-%d'), ':', krh.ranking)
                   ORDER BY krh.checked_at
                   SEPARATOR '|'
               ) as history
        FROM competitors c
        JOIN competitor_keywords ck ON c.id = ck.competitor_id
        LEFT JOIN keyword_ranking_history krh ON ck.id = krh.competitor_keyword_id
            AND krh.checked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE c.website_id = ?
        GROUP BY c.id, c.competitor_name, c.competitor_url, ck.id, ck.keyword, 
                 ck.current_ranking, ck.previous_ranking
    ");
    $stmt->execute([$websiteId]);
    $competitorKeywords = $stmt->fetchAll();

    // 構建郵件內容
    $emailBody = buildEmailHTML($website, $report, $keywords, $competitorKeywords);

    // 發送郵件
    $mail = new PHPMailer(true);
    
    try {
        // SMTP 設定
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8';

        // 收發件人
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($website['notification_email']); // 使用資料庫中的收件信箱
        
        // 郵件內容
        $mail->isHTML(true);
        $mail->Subject = "SEO 監控報告 - {$website['website_name']}";
        $mail->Body = $emailBody;
        $mail->AltBody = strip_tags($emailBody);

        $mail->send();

        jsonResponse([
            'success' => true,
            'message' => '報告已成功發送至 ' . $website['notification_email']
        ]);

    } catch (Exception $e) {
        error_log("郵件發送失敗: " . $mail->ErrorInfo);
        errorResponse('郵件發送失敗: ' . $mail->ErrorInfo, 500);
    }

} catch (Exception $e) {
    error_log("Error in send-seo-report: " . $e->getMessage());
    errorResponse('發送報告時發生錯誤: ' . $e->getMessage(), 500);
}

/**
 * 構建郵件 HTML 內容
 */
function buildEmailHTML($website, $report, $keywords, $competitorKeywords) {
    $reportDate = date('Y年m月d日', strtotime($report['report_date']));
    
    // 構建關鍵字排名趨勢表格
    $keywordRows = '';
    foreach ($keywords as $kw) {
        $trend = $kw['current_ranking'] < $kw['previous_ranking'] ? '↑' : 
                 ($kw['current_ranking'] > $kw['previous_ranking'] ? '↓' : '→');
        $trendColor = $kw['current_ranking'] < $kw['previous_ranking'] ? 'green' : 
                      ($kw['current_ranking'] > $kw['previous_ranking'] ? 'red' : 'gray');
        
        $keywordRows .= "<tr>
            <td style='padding: 8px; border: 1px solid #ddd;'>{$kw['keyword']}</td>
            <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{$kw['current_ranking']}</td>
            <td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: {$trendColor};'>{$trend}</td>
        </tr>";
    }

    // 構建競爭對手關鍵字表格
    $competitorRows = '';
    foreach ($competitorKeywords as $ck) {
        $trend = $ck['current_ranking'] < $ck['previous_ranking'] ? '↑' : 
                 ($ck['current_ranking'] > $ck['previous_ranking'] ? '↓' : '→');
        $trendColor = $ck['current_ranking'] < $ck['previous_ranking'] ? 'green' : 
                      ($ck['current_ranking'] > $ck['previous_ranking'] ? 'red' : 'gray');
        
        $competitorRows .= "<tr>
            <td style='padding: 8px; border: 1px solid #ddd;'>{$ck['competitor_name']}</td>
            <td style='padding: 8px; border: 1px solid #ddd;'>{$ck['keyword']}</td>
            <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{$ck['current_ranking']}</td>
            <td style='padding: 8px; border: 1px solid #ddd; text-align: center; color: {$trendColor};'>{$trend}</td>
        </tr>";
    }

    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
            .score-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #667eea; color: white; padding: 12px; text-align: left; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🎯 SEO 監控報告</h1>
                <p><strong>網站：</strong>{$website['website_name']}</p>
                <p><strong>報告日期：</strong>{$reportDate}</p>
            </div>

            <h2>📊 整體評分</h2>
            <div class='score-card'>
                <p><strong>綜合評分：</strong>{$report['overall_score']} / 100</p>
                <p><strong>速度評分：</strong>{$report['speed_score']} / 100</p>
                <p><strong>外部連結數：</strong>{$report['backlinks_count']}</p>
                <p><strong>結構問題數：</strong>{$report['structure_issues_count']}</p>
            </div>

            <h2>🔑 關鍵字排名（過去30天趨勢）</h2>
            <table>
                <thead>
                    <tr>
                        <th>關鍵字</th>
                        <th style='text-align: center;'>當前排名</th>
                        <th style='text-align: center;'>趨勢</th>
                    </tr>
                </thead>
                <tbody>
                    {$keywordRows}
                </tbody>
            </table>

            <h2>🏆 競爭對手關鍵字排名</h2>
            <table>
                <thead>
                    <tr>
                        <th>競爭對手</th>
                        <th>關鍵字</th>
                        <th style='text-align: center;'>當前排名</th>
                        <th style='text-align: center;'>趨勢</th>
                    </tr>
                </thead>
                <tbody>
                    {$competitorRows}
                </tbody>
            </table>

            <div class='footer'>
                <p>此報告由 SEO 監控系統自動生成</p>
                <p>如需修改收件信箱，請聯繫系統管理員</p>
            </div>
        </div>
    </body>
    </html>
    ";
}
