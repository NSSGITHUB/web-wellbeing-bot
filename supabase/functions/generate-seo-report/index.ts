import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateReportRequest {
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

    const { website_id }: GenerateReportRequest = await req.json();

    if (!website_id) {
      throw new Error('網站 ID 為必填');
    }

    // 驗證用戶權限
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', website_id)
      .single();

    if (websiteError || !website) {
      throw new Error('找不到網站或無權限訪問');
    }

    // 獲取關鍵字
    const { data: keywords } = await supabase
      .from('keywords')
      .select('*')
      .eq('website_id', website_id);

    // 獲取競爭對手
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('website_id', website_id);

    // 生成模擬 SEO 數據
    const overallScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const speedScore = Math.floor(Math.random() * 20) + 80; // 80-100
    const backlinksCount = Math.floor(Math.random() * 300) + 100; // 100-400
    const structureIssuesCount = Math.floor(Math.random() * 20) + 5; // 5-25

    // 更新關鍵字排名（模擬數據）
    if (keywords && keywords.length > 0) {
      for (const keyword of keywords) {
        const previousRanking = keyword.current_ranking;
        const newRanking = Math.max(1, Math.floor(Math.random() * 100) + 1);
        
        await supabase
          .from('keywords')
          .update({
            previous_ranking: previousRanking,
            current_ranking: newRanking,
            updated_at: new Date().toISOString(),
          })
          .eq('id', keyword.id);
      }
    }

    // 更新競爭對手數據（模擬數據）
    if (competitors && competitors.length > 0) {
      for (const competitor of competitors) {
        await supabase
          .from('competitors')
          .update({
            overall_score: Math.floor(Math.random() * 30) + 70,
            speed_score: Math.floor(Math.random() * 20) + 80,
            backlinks_count: Math.floor(Math.random() * 300) + 100,
            last_checked_at: new Date().toISOString(),
          })
          .eq('id', competitor.id);
      }
    }

    // 創建 SEO 報告記錄
    const { data: report, error: reportError } = await supabase
      .from('seo_reports')
      .insert({
        website_id,
        overall_score: overallScore,
        speed_score: speedScore,
        backlinks_count: backlinksCount,
        structure_issues_count: structureIssuesCount,
        report_data: {
          keywords_count: keywords?.length || 0,
          competitors_count: competitors?.length || 0,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (reportError) {
      console.error('創建報告錯誤:', reportError);
      throw new Error('創建報告失敗');
    }

    console.log('SEO 報告生成成功:', report.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        message: 'SEO 報告已生成'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('生成報告錯誤:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '生成報告時發生錯誤'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});