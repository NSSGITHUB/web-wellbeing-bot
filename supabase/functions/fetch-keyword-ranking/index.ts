import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SerpApiResult {
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
  }>;
  search_information?: {
    total_results: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serpApiKey) {
      throw new Error('SERPAPI_API_KEY 未設定');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 設定錯誤');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tracking_id, keyword, website_url, manual } = await req.json();

    // 如果是手動觸發，只處理特定追蹤
    if (manual && tracking_id) {
      const result = await fetchRankingForKeyword(serpApiKey, keyword, website_url);
      
      // 儲存結果
      const { error: insertError } = await supabase
        .from('keyword_tracking_history')
        .insert({
          tracking_id,
          ranking: result.ranking,
          search_volume: result.searchVolume,
          checked_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('插入歷史記錄錯誤:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 排程觸發：處理所有啟用的追蹤
    const { data: trackings, error: fetchError } = await supabase
      .from('keyword_tracking')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      throw fetchError;
    }

    const results = [];
    for (const tracking of trackings || []) {
      try {
        const result = await fetchRankingForKeyword(
          serpApiKey, 
          tracking.keyword, 
          tracking.website_url
        );

        await supabase
          .from('keyword_tracking_history')
          .insert({
            tracking_id: tracking.id,
            ranking: result.ranking,
            search_volume: result.searchVolume,
            checked_at: new Date().toISOString()
          });

        results.push({ tracking_id: tracking.id, ...result });
      } catch (err: any) {
        console.error(`追蹤 ${tracking.id} 錯誤:`, err);
        results.push({ tracking_id: tracking.id, error: err?.message || String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Edge Function 錯誤:', error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fetchRankingForKeyword(
  apiKey: string, 
  keyword: string, 
  websiteUrl: string
): Promise<{ ranking: number | null; searchVolume: number | null }> {
  // 使用 SerpAPI 搜尋
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    engine: 'google',
    q: keyword,
    location: 'Taiwan',
    hl: 'zh-TW',
    gl: 'tw',
    num: '100' // 搜尋前100名
  });

  const response = await fetch(`https://serpapi.com/search?${searchParams}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SerpAPI 錯誤:', errorText);
    throw new Error(`SerpAPI 請求失敗: ${response.status}`);
  }

  const data: SerpApiResult = await response.json();
  
  // 解析網站 URL 的域名
  let targetDomain = websiteUrl.toLowerCase();
  try {
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    targetDomain = url.hostname.replace('www.', '');
  } catch {
    targetDomain = websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }

  // 尋找網站排名
  let ranking: number | null = null;
  if (data.organic_results) {
    for (const result of data.organic_results) {
      try {
        const resultUrl = new URL(result.link);
        const resultDomain = resultUrl.hostname.replace('www.', '');
        if (resultDomain.includes(targetDomain) || targetDomain.includes(resultDomain)) {
          ranking = result.position;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  return {
    ranking,
    searchVolume: data.search_information?.total_results || null
  };
}
