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
        hostname: "mail.nss.com.tw",
        port: 587,
        tls: false,
        auth: {
          username: "leo.yen@nss.com.tw",
          password: "Aselia0419",
        },
      },
    });

    await client.send({
      from: "leo.yen@nss.com.tw",
      to: website.notification_email,
      subject: `SEO 健康檢測報告 - ${website.website_name || website.website_url}`,
      content: "請使用支援 HTML 的郵件客戶端查看此報告",
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