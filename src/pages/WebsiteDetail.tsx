import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Globe, Zap, Link as LinkIcon, AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";

interface Website {
  id: string;
  website_url: string;
  website_name: string | null;
  report_frequency: string;
}

interface Keyword {
  id: string;
  keyword: string;
  current_ranking: number | null;
  previous_ranking: number | null;
}

interface Competitor {
  id: string;
  competitor_url: string;
  competitor_name: string | null;
  overall_score: number | null;
  speed_score: number | null;
  backlinks_count: number | null;
  last_checked_at: string | null;
}

interface SeoReport {
  overall_score: number;
  speed_score: number;
  backlinks_count: number;
  structure_issues_count: number;
  created_at: string;
}

const WebsiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<Website | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [latestReport, setLatestReport] = useState<SeoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadWebsiteData();
  }, [id]);

  const loadWebsiteData = async () => {
    if (!id) return;

    setLoading(true);
    
    // Load website
    const { data: websiteData, error: websiteError } = await supabase
      .from("websites")
      .select("*")
      .eq("id", id)
      .single();

    if (websiteError) {
      toast.error("載入網站失敗");
      navigate("/dashboard");
      return;
    }

    setWebsite(websiteData);

    // Load keywords
    const { data: keywordsData } = await supabase
      .from("keywords")
      .select("*")
      .eq("website_id", id);

    setKeywords(keywordsData || []);

    // Load competitors
    const { data: competitorsData } = await supabase
      .from("competitors")
      .select("*")
      .eq("website_id", id);

    setCompetitors(competitorsData || []);

    // Load latest SEO report
    const { data: reportData } = await supabase
      .from("seo_reports")
      .select("*")
      .eq("website_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setLatestReport(reportData);

    setLoading(false);
  };

  const handleGenerateReport = async () => {
    if (!id) return;

    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-seo-report', {
        body: { website_id: id }
      });

      if (error) throw error;

      toast.success("SEO 報告已生成！");
      // 重新載入數據
      await loadWebsiteData();
    } catch (error: any) {
      console.error('生成報告錯誤:', error);
      toast.error(error.message || "生成報告失敗");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReport = async () => {
    if (!id) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-seo-report', {
        body: { website_id: id }
      });

      if (error) throw error;

      toast.success("報告已發送至您的郵箱！");
    } catch (error: any) {
      console.error('發送報告錯誤:', error);
      toast.error(error.message || "發送報告失敗");
    } finally {
      setSending(false);
    }
  };

  const getRankingChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return { icon: Minus, color: "text-muted-foreground", text: "-" };
    const change = previous - current;
    if (change > 0) return { icon: TrendingUp, color: "text-success", text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: "text-destructive", text: `${change}` };
    return { icon: Minus, color: "text-muted-foreground", text: "0" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  if (!website) return null;

  // Use latest report or default data
  const seoData = latestReport || {
    overall_score: 0,
    speed_score: 0,
    backlinks_count: 0,
    structure_issues_count: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回儀表板
        </Button>

        {/* Website header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{website.website_name || website.website_url}</h1>
              <p className="text-muted-foreground">{website.website_url}</p>
              {latestReport && (
                <p className="text-sm text-muted-foreground mt-2">
                  最後更新: {new Date(latestReport.created_at).toLocaleString('zh-TW')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleGenerateReport}
                disabled={generating}
                variant="default"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? '生成中...' : '生成報告'}
              </Button>
              <Button 
                onClick={handleSendReport}
                disabled={sending || !latestReport}
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sending ? '發送中...' : '發送報告'}
              </Button>
            </div>
          </div>
        </div>

        {/* SEO Score Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">整體分數</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{seoData.overall_score}</div>
              <p className="text-xs text-muted-foreground mt-1">SEO健康度</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">網站速度</CardTitle>
              <Zap className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{seoData.speed_score}</div>
              <p className="text-xs text-muted-foreground mt-1">PageSpeed分數</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">反向連結</CardTitle>
              <LinkIcon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{seoData.backlinks_count}</div>
              <p className="text-xs text-muted-foreground mt-1">個連結</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待修復問題</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{seoData.structure_issues_count}</div>
              <p className="text-xs text-muted-foreground mt-1">個問題</p>
            </CardContent>
          </Card>
        </div>

        {/* Keywords Rankings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>關鍵字排名</CardTitle>
            <CardDescription>追蹤您的關鍵字在Google台灣的排名變化</CardDescription>
          </CardHeader>
          <CardContent>
            {keywords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">尚未設定關鍵字</p>
            ) : (
              <div className="space-y-3">
                {keywords.map((keyword) => {
                  const change = getRankingChange(keyword.current_ranking, keyword.previous_ranking);
                  const ChangeIcon = change.icon;
                  
                  return (
                    <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{keyword.keyword}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {keyword.current_ranking || "--"}
                          </p>
                          <p className="text-xs text-muted-foreground">當前排名</p>
                        </div>
                        <div className={`flex items-center gap-1 ${change.color}`}>
                          <ChangeIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{change.text}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card>
          <CardHeader>
            <CardTitle>競爭對手</CardTitle>
            <CardDescription>追蹤競爭對手的SEO表現</CardDescription>
          </CardHeader>
          <CardContent>
            {competitors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">尚未新增競爭對手</p>
            ) : (
              <div className="space-y-3">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{competitor.competitor_name || competitor.competitor_url}</p>
                        <a 
                          href={competitor.competitor_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          {competitor.competitor_url}
                        </a>
                      </div>
                      <Badge variant="outline">追蹤中</Badge>
                    </div>
                    
                    {competitor.overall_score ? (
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">整體分數</p>
                          <p className="text-lg font-bold text-primary">{competitor.overall_score}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">速度分數</p>
                          <p className="text-lg font-bold text-success">{competitor.speed_score}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">反向連結</p>
                          <p className="text-lg font-bold">{competitor.backlinks_count}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">尚無數據，請點擊「生成報告」</p>
                    )}
                    
                    {competitor.last_checked_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        最後檢測: {new Date(competitor.last_checked_at).toLocaleString('zh-TW')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebsiteDetail;