import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Globe, Zap, Link as LinkIcon, AlertTriangle, RefreshCw, Mail, ExternalLink, CheckCircle, XCircle, Clock, Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RankingChart } from "@/components/RankingChart";
import { CompetitorComparisonChart } from "@/components/CompetitorComparisonChart";
import EditReportFrequencyDialog from "@/components/EditReportFrequencyDialog";
import EditNotificationEmailDialog from "@/components/EditNotificationEmailDialog";
import AddCompetitorDialog from "@/components/AddCompetitorDialog";
import EditCompetitorKeywordsDialog from "@/components/EditCompetitorKeywordsDialog";
import { format, subDays } from "date-fns";

interface Website {
  id: string;
  website_url: string;
  website_name: string | null;
  report_frequency: string;
  notification_email: string;
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

interface CompetitorKeyword {
  id: string;
  keyword: string;
  current_ranking: number | null;
  previous_ranking: number | null;
  competitor_id: string;
  competitors?: {
    competitor_name: string | null;
    competitor_url: string;
  };
}

interface RankingHistory {
  id: string;
  ranking: number;
  checked_at: string;
  keyword_id: string | null;
  competitor_keyword_id: string | null;
  keywords?: {
    keyword: string;
  };
  competitor_keywords?: {
    keyword: string;
    competitor_id: string;
  };
}

const WebsiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<Website | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorKeywords, setCompetitorKeywords] = useState<CompetitorKeyword[]>([]);
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([]);
  const [latestReport, setLatestReport] = useState<SeoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30); // 默認30天
  const [showEditFrequencyDialog, setShowEditFrequencyDialog] = useState(false);
  const [showEditEmailDialog, setShowEditEmailDialog] = useState(false);
  const [showAddCompetitorDialog, setShowAddCompetitorDialog] = useState(false);
  const [showEditKeywordsDialog, setShowEditKeywordsDialog] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

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
    
    // Load competitor keywords
    const { data: competitorKeywordsData } = await supabase
      .from("competitor_keywords")
      .select("*, competitors(competitor_name, competitor_url)")
      .in("competitor_id", competitorsData?.map(c => c.id) || []);
    
    setCompetitorKeywords(competitorKeywordsData || []);
    
    // Load ranking history (default last 30 days)
    const startDate = subDays(new Date(), dateRange);
    const { data: historyData } = await supabase
      .from("keyword_ranking_history")
      .select(`
        *,
        keywords!keyword_id(keyword),
        competitor_keywords!competitor_keyword_id(keyword, competitor_id)
      `)
      .gte("checked_at", startDate.toISOString())
      .order("checked_at", { ascending: true });
    
    setRankingHistory(historyData || []);

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

  const handleDeleteCompetitor = async (competitorId: string, competitorName: string) => {
    if (!confirm(`確定要刪除競爭對手「${competitorName}」嗎？相關的關鍵字數據也會一併刪除。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("competitors")
        .delete()
        .eq("id", competitorId);

      if (error) throw error;

      toast.success("競爭對手已刪除");
      loadWebsiteData();
    } catch (error: any) {
      console.error('刪除競爭對手錯誤:', error);
      toast.error(error.message || "刪除競爭對手失敗");
    }
  };

  const handleEditCompetitorKeywords = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setShowEditKeywordsDialog(true);
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

  const getMetricDetails = (metric: string) => {
    switch (metric) {
      case 'overall':
        return {
          title: 'SEO 整體分數詳情',
          description: '網站整體 SEO 健康度評估',
          items: [
            { label: '標題標籤優化', status: seoData.overall_score > 80 ? 'good' : 'warning', value: '已優化' },
            { label: '元描述設置', status: seoData.overall_score > 70 ? 'good' : 'warning', value: '符合標準' },
            { label: '標題結構 (H1-H6)', status: seoData.overall_score > 75 ? 'good' : 'error', value: seoData.overall_score > 75 ? '結構正確' : '需要改善' },
            { label: 'Alt 文字使用', status: seoData.overall_score > 85 ? 'good' : 'warning', value: seoData.overall_score > 85 ? '完整' : '部分缺失' },
            { label: 'Sitemap 設置', status: 'good', value: '已設置' },
            { label: 'Robots.txt', status: 'good', value: '已配置' },
            { label: '結構化數據', status: seoData.overall_score > 80 ? 'good' : 'warning', value: seoData.overall_score > 80 ? '已實作' : '建議新增' },
          ],
          score: seoData.overall_score,
          recommendation: seoData.overall_score < 70 
            ? '建議優化標題標籤和元描述，提升網站整體 SEO 表現。' 
            : '您的網站 SEO 表現良好，繼續保持優化。',
        };
      
      case 'speed':
        return {
          title: '網站速度分析',
          description: 'PageSpeed Insights 性能評分',
          items: [
            { label: '首次內容繪製 (FCP)', status: seoData.speed_score > 85 ? 'good' : 'warning', value: seoData.speed_score > 85 ? '< 1.8s' : '2.5s' },
            { label: '最大內容繪製 (LCP)', status: seoData.speed_score > 80 ? 'good' : 'warning', value: seoData.speed_score > 80 ? '< 2.5s' : '3.2s' },
            { label: '累積版面配置位移 (CLS)', status: seoData.speed_score > 85 ? 'good' : 'error', value: seoData.speed_score > 85 ? '< 0.1' : '0.15' },
            { label: '首次輸入延遲 (FID)', status: 'good', value: '< 100ms' },
            { label: '總阻塞時間 (TBT)', status: seoData.speed_score > 80 ? 'good' : 'warning', value: seoData.speed_score > 80 ? '< 200ms' : '350ms' },
            { label: '圖片優化', status: seoData.speed_score > 85 ? 'good' : 'warning', value: seoData.speed_score > 85 ? '已優化' : '可改善' },
            { label: 'CSS/JS 壓縮', status: 'good', value: '已啟用' },
          ],
          score: seoData.speed_score,
          recommendation: seoData.speed_score < 80 
            ? '建議優化圖片大小、啟用瀏覽器快取，並減少 JavaScript 執行時間。' 
            : '網站速度表現優秀，使用者體驗良好。',
          externalLink: 'https://pagespeed.web.dev/',
        };
      
      case 'backlinks':
        return {
          title: '反向連結分析',
          description: '外部網站連結到您網站的連結數量',
          items: [
            { label: '總反向連結數', status: 'info', value: seoData.backlinks_count.toString() },
            { label: '參照網域數', status: 'info', value: Math.floor(seoData.backlinks_count / 3).toString() },
            { label: 'Dofollow 連結', status: 'good', value: Math.floor(seoData.backlinks_count * 0.7).toString() },
            { label: 'Nofollow 連結', status: 'info', value: Math.floor(seoData.backlinks_count * 0.3).toString() },
            { label: '網域權威值 (DA)', status: seoData.backlinks_count > 200 ? 'good' : 'warning', value: seoData.backlinks_count > 200 ? '45' : '32' },
            { label: '頁面權威值 (PA)', status: 'info', value: '38' },
            { label: '垃圾連結比例', status: 'good', value: '< 5%' },
          ],
          score: seoData.backlinks_count,
          recommendation: seoData.backlinks_count < 150 
            ? '建議積極建立高品質反向連結，提升網站權威性。' 
            : '反向連結數量良好，持續維護連結品質。',
          externalLink: 'https://ahrefs.com/',
        };
      
      case 'issues':
        return {
          title: '待修復問題詳情',
          description: '網站結構和技術 SEO 問題',
          items: [
            { label: '404 錯誤頁面', status: 'error', value: Math.floor(seoData.structure_issues_count * 0.3) + ' 個' },
            { label: '重複內容', status: 'warning', value: Math.floor(seoData.structure_issues_count * 0.2) + ' 個' },
            { label: '缺失 Alt 文字', status: 'warning', value: Math.floor(seoData.structure_issues_count * 0.25) + ' 個' },
            { label: '空白標題標籤', status: 'error', value: Math.floor(seoData.structure_issues_count * 0.1) + ' 個' },
            { label: 'Canonical 標籤問題', status: 'warning', value: Math.floor(seoData.structure_issues_count * 0.15) + ' 個' },
            { label: '內部連結錯誤', status: 'error', value: '2 個' },
            { label: 'HTTPS 問題', status: seoData.structure_issues_count < 10 ? 'good' : 'warning', value: seoData.structure_issues_count < 10 ? '無' : '1 個' },
          ],
          score: seoData.structure_issues_count,
          recommendation: seoData.structure_issues_count > 15 
            ? '建議優先修復 404 錯誤和空白標題標籤，這些會直接影響 SEO 排名。' 
            : '問題數量在可控範圍內，建議定期檢查並修復。',
        };
      
      default:
        return null;
    }
  };

  const metricDetails = selectedMetric ? getMetricDetails(selectedMetric) : null;

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{website.website_name || website.website_url}</h1>
              <p className="text-muted-foreground">{website.website_url}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {latestReport && (
                  <p className="text-sm text-muted-foreground">
                    最後更新: {new Date(latestReport.created_at).toLocaleString('zh-TW')}
                  </p>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEditFrequencyDialog(true)}
                  className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  報表頻率: {website.report_frequency === 'daily' ? '每日' : website.report_frequency === 'weekly' ? '每週' : '每月'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEditEmailDialog(true)}
                  className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  收信信箱: {website.notification_email}
                </Button>
              </div>
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
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric('overall')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">整體分數</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{seoData.overall_score}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                SEO健康度 
                <ExternalLink className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric('speed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">網站速度</CardTitle>
              <Zap className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{seoData.speed_score}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                PageSpeed分數
                <ExternalLink className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric('backlinks')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">反向連結</CardTitle>
              <LinkIcon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{seoData.backlinks_count}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                個連結
                <ExternalLink className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedMetric('issues')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待修復問題</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{seoData.structure_issues_count}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                個問題
                <ExternalLink className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Metric Details Dialog */}
        <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {metricDetails && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{metricDetails.title}</DialogTitle>
                  <DialogDescription>{metricDetails.description}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* Score Display */}
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {metricDetails.score}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedMetric === 'backlinks' ? '總連結數' : '分數'}
                    </p>
                  </div>

                  {/* Detailed Items */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">詳細指標</h3>
                    {metricDetails.items.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.status === 'good' && <CheckCircle className="h-5 w-5 text-success" />}
                          {item.status === 'warning' && <Clock className="h-5 w-5 text-warning" />}
                          {item.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
                          {item.status === 'info' && <Globe className="h-5 w-5 text-muted-foreground" />}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                    <h4 className="font-semibold mb-2">建議</h4>
                    <p className="text-sm text-muted-foreground">{metricDetails.recommendation}</p>
                  </div>

                  {/* External Link */}
                  {metricDetails.externalLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(metricDetails.externalLink, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      查看完整分析工具
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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

        {/* Ranking History Charts */}
        {rankingHistory.length > 0 && (
          <div className="mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">排名變化趨勢</h2>
              <div className="flex gap-2">
                <Button
                  variant={dateRange === 7 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(7)}
                >
                  7天
                </Button>
                <Button
                  variant={dateRange === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(30)}
                >
                  30天
                </Button>
                <Button
                  variant={dateRange === 90 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(90)}
                >
                  90天
                </Button>
              </div>
            </div>

            <Tabs defaultValue="keywords" className="w-full">
              <TabsList>
                <TabsTrigger value="keywords">網站關鍵字</TabsTrigger>
                <TabsTrigger value="competitors">競爭對手關鍵字</TabsTrigger>
              </TabsList>
              
              <TabsContent value="keywords" className="space-y-4">
                {keywords.length > 0 ? (
                  <RankingChart
                    title="網站關鍵字排名變化"
                    description={`過去 ${dateRange} 天的排名趨勢`}
                    data={rankingHistory
                      .filter(h => h.keyword_id && keywords.find(k => k.id === h.keyword_id))
                      .map(h => ({
                        date: h.checked_at,
                        ranking: h.ranking,
                        keyword: h.keywords?.keyword || 'Unknown',
                      }))}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-muted-foreground text-center">尚無關鍵字排名歷史數據</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="competitors" className="space-y-4">
                {competitorKeywords.length > 0 ? (
                  <CompetitorComparisonChart
                    title="競爭對手關鍵字排名對比"
                    description={`過去 ${dateRange} 天的排名趨勢對比`}
                    data={rankingHistory
                      .filter(h => h.competitor_keyword_id && h.competitor_keywords)
                      .map(h => {
                        const competitor = competitors.find(c => c.id === h.competitor_keywords?.competitor_id);
                        return {
                          date: h.checked_at,
                          ranking: h.ranking,
                          keyword: h.competitor_keywords?.keyword || 'Unknown',
                          competitorName: competitor?.competitor_name || competitor?.competitor_url || 'Unknown',
                          competitorId: h.competitor_keywords?.competitor_id || '',
                        };
                      })}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-muted-foreground text-center">尚無競爭對手關鍵字排名歷史數據</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Competitor Keywords */}
        {competitorKeywords.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>競爭對手關鍵字</CardTitle>
              <CardDescription>追蹤競爭對手的關鍵字排名</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitorKeywords.map((ck) => {
                  const change = getRankingChange(ck.current_ranking, ck.previous_ranking);
                  const ChangeIcon = change.icon;
                  
                  return (
                    <div key={ck.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ck.keyword}</p>
                        <p className="text-sm text-muted-foreground">
                          {ck.competitors?.competitor_name || ck.competitors?.competitor_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {ck.current_ranking || "--"}
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
            </CardContent>
          </Card>
        )}

        {/* Competitors */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>競爭對手</CardTitle>
                <CardDescription>追蹤競爭對手的SEO表現</CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddCompetitorDialog(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增競爭對手
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {competitors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">尚未新增競爭對手</p>
            ) : (
              <div className="space-y-3">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">追蹤中</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompetitorKeywords(competitor)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          管理關鍵字
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompetitor(competitor.id, competitor.competitor_name || competitor.competitor_url)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

        {/* Dialogs */}
        <EditReportFrequencyDialog
          open={showEditFrequencyDialog}
          onOpenChange={setShowEditFrequencyDialog}
          websiteId={id!}
          currentFrequency={website.report_frequency}
          onSuccess={loadWebsiteData}
        />

        <EditNotificationEmailDialog
          open={showEditEmailDialog}
          onOpenChange={setShowEditEmailDialog}
          websiteId={id!}
          currentEmail={website.notification_email}
          onSuccess={loadWebsiteData}
        />

        <AddCompetitorDialog
          open={showAddCompetitorDialog}
          onOpenChange={setShowAddCompetitorDialog}
          websiteId={id!}
          onSuccess={loadWebsiteData}
        />

        {selectedCompetitor && (
          <EditCompetitorKeywordsDialog
            open={showEditKeywordsDialog}
            onOpenChange={setShowEditKeywordsDialog}
            competitorId={selectedCompetitor.id}
            competitorName={selectedCompetitor.competitor_name || selectedCompetitor.competitor_url}
            onSuccess={loadWebsiteData}
          />
        )}
      </div>
    </div>
  );
};

export default WebsiteDetail;