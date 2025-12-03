import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Use service role key for scheduled tasks (no user auth)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('開始執行排程 SEO 報告生成...');

    // Get all active websites
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select('id, website_name, website_url, report_frequency')
      .eq('is_active', true);

    if (websitesError) {
      console.error('獲取網站列表錯誤:', websitesError);
      throw new Error('無法獲取網站列表');
    }

    if (!websites || websites.length === 0) {
      console.log('沒有需要處理的網站');
      return new Response(
        JSON.stringify({ success: true, message: '沒有需要處理的網站', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`找到 ${websites.length} 個網站需要處理`);

    const results = [];

    for (const website of websites) {
      try {
        console.log(`處理網站: ${website.website_name || website.website_url}`);

        // Get keywords for this website
        const { data: keywords } = await supabase
          .from('keywords')
          .select('*')
          .eq('website_id', website.id);

        // Get competitors for this website
        const { data: competitors } = await supabase
          .from('competitors')
          .select('*')
          .eq('website_id', website.id);

        // Get competitor keywords
        const competitorIds = competitors?.map(c => c.id) || [];
        const { data: competitorKeywords } = await supabase
          .from('competitor_keywords')
          .select('*')
          .in('competitor_id', competitorIds);

        // Generate simulated SEO metrics
        const overallScore = Math.floor(Math.random() * 30) + 70;
        const speedScore = Math.floor(Math.random() * 30) + 70;
        const backlinksCount = Math.floor(Math.random() * 500) + 50;
        const structureIssuesCount = Math.floor(Math.random() * 10);

        // Update keyword rankings
        if (keywords && keywords.length > 0) {
          for (const keyword of keywords) {
            const newRanking = Math.floor(Math.random() * 50) + 1;
            
            await supabase
              .from('keywords')
              .update({
                previous_ranking: keyword.current_ranking,
                current_ranking: newRanking,
                updated_at: new Date().toISOString()
              })
              .eq('id', keyword.id);

            await supabase
              .from('keyword_ranking_history')
              .insert({
                keyword_id: keyword.id,
                ranking: newRanking,
                checked_at: new Date().toISOString()
              });
          }
        }

        // Update competitor keyword rankings
        if (competitorKeywords && competitorKeywords.length > 0) {
          for (const ck of competitorKeywords) {
            const newRanking = Math.floor(Math.random() * 50) + 1;
            
            await supabase
              .from('competitor_keywords')
              .update({
                previous_ranking: ck.current_ranking,
                current_ranking: newRanking,
                updated_at: new Date().toISOString()
              })
              .eq('id', ck.id);

            await supabase
              .from('keyword_ranking_history')
              .insert({
                competitor_keyword_id: ck.id,
                ranking: newRanking,
                checked_at: new Date().toISOString()
              });
          }
        }

        // Update competitor metrics
        if (competitors && competitors.length > 0) {
          for (const competitor of competitors) {
            await supabase
              .from('competitors')
              .update({
                overall_score: Math.floor(Math.random() * 30) + 70,
                speed_score: Math.floor(Math.random() * 30) + 70,
                backlinks_count: Math.floor(Math.random() * 500) + 50,
                last_checked_at: new Date().toISOString()
              })
              .eq('id', competitor.id);
          }
        }

        // Create SEO report
        const { data: report, error: reportError } = await supabase
          .from('seo_reports')
          .insert({
            website_id: website.id,
            overall_score: overallScore,
            speed_score: speedScore,
            backlinks_count: backlinksCount,
            structure_issues_count: structureIssuesCount,
            report_data: {
              keywords_count: keywords?.length || 0,
              competitors_count: competitors?.length || 0,
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (reportError) {
          console.error(`網站 ${website.id} 報告生成錯誤:`, reportError);
          results.push({ website_id: website.id, success: false, error: reportError.message });
        } else {
          console.log(`網站 ${website.id} 報告生成成功: ${report.id}`);
          results.push({ website_id: website.id, success: true, report_id: report.id });
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`處理網站 ${website.id} 時發生錯誤:`, err);
        results.push({ website_id: website.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`排程完成: ${successCount}/${websites.length} 個網站處理成功`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `處理完成: ${successCount}/${websites.length} 個網站`,
        processed: successCount,
        total: websites.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('排程執行錯誤:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '排程執行時發生錯誤'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
