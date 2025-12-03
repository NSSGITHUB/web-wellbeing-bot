import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReportRequest {
  website_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { website_id }: SendReportRequest = await req.json();

    if (!website_id) {
      throw new Error('網站 ID 為必填');
    }

    // 獲取網站資料
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', website_id)
      .single();

    if (websiteError || !website) {
      throw new Error('找不到網站');
    }

    // 獲取最新報告
    const { data: latestReport, error: reportError } = await supabase
      .from('seo_reports')
      .select('*')
      .eq('website_id', website_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reportError || !latestReport) {
      throw new Error('找不到報告，請先生成報告');
    }

    // 獲取關鍵字數據
    const { data: keywords } = await supabase
      .from('keywords')
      .select('*')
      .eq('website_id', website_id);

    // 獲取競爭對手數據
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('website_id', website_id);
    
    // 獲取競爭對手關鍵字數據
    const { data: competitorKeywords } = await supabase
      .from('competitor_keywords')
      .select('*, competitors(competitor_name, competitor_url)')
      .in('competitor_id', competitors?.map(c => c.id) || []);
    
    // 獲取過去30天的關鍵字排名歷史
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: rankingHistory } = await supabase
      .from('keyword_ranking_history')
      .select(`
        *,
        keywords!keyword_id(keyword),
        competitor_keywords!competitor_keyword_id(keyword, competitor_id)
      `)
      .gte('checked_at', thirtyDaysAgo.toISOString())
      .order('checked_at', { ascending: true });

    // 構建郵件內容
    const keywordsHtml = keywords && keywords.length > 0
      ? keywords.map(k => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${k.keyword}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${k.current_ranking || '--'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${k.previous_ranking || '--'}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 8px; text-align: center;">無關鍵字數據</td></tr>';

    const competitorsHtml = competitors && competitors.length > 0
      ? competitors.map(c => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${c.competitor_name || c.competitor_url}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.overall_score || '--'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.speed_score || '--'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.backlinks_count || '--'}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" style="padding: 8px; text-align: center;">無競爭對手數據</td></tr>';
    
    // 競爭對手關鍵字 HTML
    const competitorKeywordsHtml = competitorKeywords && competitorKeywords.length > 0
      ? competitorKeywords.map(ck => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${ck.competitors?.competitor_name || ck.competitors?.competitor_url || '--'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${ck.keyword}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ck.current_ranking || '--'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${ck.previous_ranking || '--'}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" style="padding: 8px; text-align: center;">無競爭對手關鍵字數據</td></tr>';
    
    // 生成排名趨勢圖表說明 (簡化版，實際圖表需要在前端生成)
    let chartSummary = '<p style="color: #666;">過去30天排名變化趨勢已包含在報告中。</p>';
    if (rankingHistory && rankingHistory.length > 0) {
      const keywordChanges = keywords?.map(k => {
        const history = rankingHistory.filter(h => h.keyword_id === k.id);
        if (history.length >= 2) {
          const firstRank = history[0].ranking;
          const lastRank = history[history.length - 1].ranking;
          const change = firstRank - lastRank;
          return `<li>${k.keyword}: ${change > 0 ? '上升' + change : change < 0 ? '下降' + Math.abs(change) : '無變化'}</li>`;
        }
        return null;
      }).filter(Boolean).join('');
      
      if (keywordChanges) {
        chartSummary = `<ul style="list-style: none; padding: 0;">${keywordChanges}</ul>`;
      }
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SEO 健康檢測報告</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; margin-bottom: 30px;">
    <h1 style="margin: 0;">SEO 健康檢測報告</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${website.website_name || website.website_url}</p>
  </div>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="margin-top: 0;">整體評分</h2>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="font-size: 14px; color: #666;">SEO 整體分數</div>
        <div style="font-size: 32px; font-weight: bold; color: #667eea;">${latestReport.overall_score}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="font-size: 14px; color: #666;">網站速度</div>
        <div style="font-size: 32px; font-weight: bold; color: #10b981;">${latestReport.speed_score}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="font-size: 14px; color: #666;">反向連結數</div>
        <div style="font-size: 32px; font-weight: bold; color: #06b6d4;">${latestReport.backlinks_count}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="font-size: 14px; color: #666;">待修復問題</div>
        <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${latestReport.structure_issues_count}</div>
      </div>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h2>關鍵字排名</h2>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #667eea; color: white;">
          <th style="padding: 12px; text-align: left;">關鍵字</th>
          <th style="padding: 12px; text-align: center;">當前排名</th>
          <th style="padding: 12px; text-align: center;">前次排名</th>
        </tr>
      </thead>
      <tbody>
        ${keywordsHtml}
      </tbody>
    </table>
  </div>

  <div style="margin-bottom: 30px;">
    <h2>排名變化趨勢（過去30天）</h2>
    <div style="background: white; padding: 20px; border-radius: 8px;">
      ${chartSummary}
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <h2>競爭對手分析</h2>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #667eea; color: white;">
          <th style="padding: 12px; text-align: left;">競爭對手</th>
          <th style="padding: 12px; text-align: center;">整體分數</th>
          <th style="padding: 12px; text-align: center;">速度分數</th>
          <th style="padding: 12px; text-align: center;">反向連結</th>
        </tr>
      </thead>
      <tbody>
        ${competitorsHtml}
      </tbody>
    </table>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h2>競爭對手關鍵字排名</h2>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #667eea; color: white;">
          <th style="padding: 12px; text-align: left;">競爭對手</th>
          <th style="padding: 12px; text-align: left;">關鍵字</th>
          <th style="padding: 12px; text-align: center;">當前排名</th>
          <th style="padding: 12px; text-align: center;">前次排名</th>
        </tr>
      </thead>
      <tbody>
        ${competitorKeywordsHtml}
      </tbody>
    </table>
  </div>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-top: 40px;">
    <p style="margin: 0; color: #666; font-size: 14px;">
      此報告由 SEO 健康檢測系統自動生成<br>
      報告時間: ${new Date(latestReport.created_at).toLocaleString('zh-TW')}
    </p>
  </div>
</body>
</html>
    `;

    // 使用 SMTP 發送郵件
    const client = new SMTPClient({
      connection: {
        hostname: "sp8.coowo.com",
        port: 465,
        tls: true,
        auth: {
          username: "no-reply@seoreport.ai.com.tw",
          password: "516aU$n8y",
        },
      },
    });

    // Use ASCII-safe subject to avoid encoding issues
    const siteName = website.website_name || website.website_url;
    const subject = `SEO Report - ${siteName}`;

    await client.send({
      from: "no-reply@seoreport.ai.com.tw",
      to: website.notification_email,
      subject: subject,
      content: "Please use an HTML-capable email client to view this report.",
      html: htmlContent,
    });

    await client.close();

    console.log('郵件發送成功至:', website.notification_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '報告已發送至 ' + website.notification_email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('發送報告錯誤:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '發送報告時發生錯誤'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});