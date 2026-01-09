import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, Minus, Clock, Globe } from "lucide-react";
import { KeywordTrackingChart } from "@/components/KeywordTrackingChart";

interface TrackingItem {
  id: string;
  keyword: string;
  website_url: string;
  website_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface TrackingHistory {
  id: string;
  tracking_id: string;
  ranking: number | null;
  checked_at: string;
}

export default function KeywordTracking() {
  const navigate = useNavigate();
  const [trackings, setTrackings] = useState<TrackingItem[]>([]);
  const [histories, setHistories] = useState<Record<string, TrackingHistory[]>>({});
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadTrackings();
  }, []);

  const loadTrackings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: trackingData, error: trackingError } = await supabase
        .from('keyword_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (trackingError) throw trackingError;

      setTrackings(trackingData || []);

      // 載入每個追蹤的歷史記錄
      const historyMap: Record<string, TrackingHistory[]> = {};
      for (const tracking of trackingData || []) {
        const { data: historyData } = await supabase
          .from('keyword_tracking_history')
          .select('*')
          .eq('tracking_id', tracking.id)
          .order('checked_at', { ascending: true });
        
        historyMap[tracking.id] = historyData || [];
      }
      setHistories(historyMap);

    } catch (error: any) {
      console.error('載入追蹤錯誤:', error);
      toast.error(error.message || "載入追蹤資料失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracking = async () => {
    if (!newKeyword.trim() || !newWebsiteUrl.trim()) {
      toast.error("請輸入關鍵字和網站網址");
      return;
    }

    // 檢查是否已達到限制 (2個網站)
    const uniqueWebsites = new Set(trackings.map(t => t.website_url));
    if (!uniqueWebsites.has(newWebsiteUrl) && uniqueWebsites.size >= 2) {
      toast.error("最多只能追蹤 2 個網站");
      return;
    }

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('keyword_tracking')
        .insert({
          user_id: user.id,
          keyword: newKeyword.trim(),
          website_url: newWebsiteUrl.trim(),
          website_name: newWebsiteName.trim() || null
        });

      if (error) throw error;

      toast.success("已新增追蹤項目");
      setNewKeyword("");
      setNewWebsiteUrl("");
      setNewWebsiteName("");
      loadTrackings();

    } catch (error: any) {
      console.error('新增追蹤錯誤:', error);
      toast.error(error.message || "新增追蹤失敗");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTracking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keyword_tracking')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("已刪除追蹤項目");
      loadTrackings();

    } catch (error: any) {
      console.error('刪除追蹤錯誤:', error);
      toast.error(error.message || "刪除追蹤失敗");
    }
  };

  const handleFetchRanking = async (tracking: TrackingItem) => {
    setFetching(tracking.id);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-keyword-ranking', {
        body: {
          tracking_id: tracking.id,
          keyword: tracking.keyword,
          website_url: tracking.website_url,
          manual: true
        }
      });

      if (error) throw error;

      toast.success(`已取得 "${tracking.keyword}" 的排名資料`);
      loadTrackings();

    } catch (error: any) {
      console.error('取得排名錯誤:', error);
      toast.error(error.message || "取得排名失敗");
    } finally {
      setFetching(null);
    }
  };

  const getLatestRanking = (trackingId: string): number | null => {
    const history = histories[trackingId];
    if (!history || history.length === 0) return null;
    return history[history.length - 1].ranking;
  };

  const getRankingChange = (trackingId: string) => {
    const history = histories[trackingId];
    if (!history || history.length < 2) return null;
    
    const latest = history[history.length - 1].ranking;
    const previous = history[history.length - 2].ranking;
    
    if (latest === null || previous === null) return null;
    
    const change = previous - latest; // 排名下降是好事（數字變小）
    
    if (change > 0) {
      return { value: change, direction: 'up' as const };
    } else if (change < 0) {
      return { value: Math.abs(change), direction: 'down' as const };
    }
    return { value: 0, direction: 'same' as const };
  };

  // 準備折線圖資料
  const prepareChartData = () => {
    const allDates = new Set<string>();
    const trackingsByDate: Record<string, Record<string, number | null>> = {};

    // 收集所有日期
    Object.entries(histories).forEach(([trackingId, history]) => {
      history.forEach(h => {
        const date = new Date(h.checked_at).toLocaleDateString('zh-TW');
        allDates.add(date);
        if (!trackingsByDate[date]) {
          trackingsByDate[date] = {};
        }
        trackingsByDate[date][trackingId] = h.ranking;
      });
    });

    // 轉換為折線圖格式
    const sortedDates = Array.from(allDates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    return sortedDates.map(date => {
      const dataPoint: any = { date };
      trackings.forEach(tracking => {
        const key = `${tracking.website_name || tracking.website_url} - ${tracking.keyword}`;
        dataPoint[key] = trackingsByDate[date]?.[tracking.id] ?? null;
      });
      return dataPoint;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = prepareChartData();
  const chartKeys = trackings.map(t => `${t.website_name || t.website_url} - ${t.keyword}`);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回儀表板
        </Button>

        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">關鍵字排名追蹤</h1>
          <p className="text-muted-foreground mt-2">
            追蹤您的網站在搜尋引擎中的關鍵字排名變化（每天早上 8 點台灣時間自動更新）
          </p>
        </div>

        {/* 新增追蹤表單 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新增追蹤
            </CardTitle>
            <CardDescription>
              最多可追蹤 2 個網站，每個網站可追蹤多個關鍵字
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">關鍵字 *</Label>
                <Input
                  id="keyword"
                  placeholder="例如：SEO 優化"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">網站網址 *</Label>
                <Input
                  id="website_url"
                  placeholder="例如：example.com"
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_name">網站名稱（選填）</Label>
                <Input
                  id="website_name"
                  placeholder="例如：我的網站"
                  value={newWebsiteName}
                  onChange={(e) => setNewWebsiteName(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddTracking}
                  disabled={adding || !newKeyword.trim() || !newWebsiteUrl.trim()}
                  className="w-full"
                >
                  {adding ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  新增
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 排名趨勢圖表 */}
        {chartData.length > 0 && chartKeys.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>排名趨勢圖</CardTitle>
              <CardDescription>
                追蹤您的關鍵字排名變化趨勢
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordTrackingChart data={chartData} dataKeys={chartKeys} />
            </CardContent>
          </Card>
        )}

        {/* 追蹤列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackings.map((tracking) => {
            const latestRanking = getLatestRanking(tracking.id);
            const rankingChange = getRankingChange(tracking.id);
            const history = histories[tracking.id] || [];

            return (
              <Card key={tracking.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {tracking.website_name || tracking.website_url}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {tracking.website_url}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTracking(tracking.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 關鍵字 */}
                    <div>
                      <Badge variant="secondary" className="text-sm">
                        {tracking.keyword}
                      </Badge>
                    </div>

                    {/* 排名顯示 */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">目前排名</p>
                        <div className="flex items-center gap-2">
                          {latestRanking !== null ? (
                            <>
                              <span className="text-2xl font-bold">#{latestRanking}</span>
                              {rankingChange && (
                                <span className={`flex items-center text-sm ${
                                  rankingChange.direction === 'up' 
                                    ? 'text-green-500' 
                                    : rankingChange.direction === 'down' 
                                    ? 'text-red-500' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {rankingChange.direction === 'up' && (
                                    <>
                                      <TrendingUp className="h-4 w-4 mr-1" />
                                      +{rankingChange.value}
                                    </>
                                  )}
                                  {rankingChange.direction === 'down' && (
                                    <>
                                      <TrendingDown className="h-4 w-4 mr-1" />
                                      -{rankingChange.value}
                                    </>
                                  )}
                                  {rankingChange.direction === 'same' && (
                                    <>
                                      <Minus className="h-4 w-4 mr-1" />
                                      不變
                                    </>
                                  )}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">尚無資料</span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFetchRanking(tracking)}
                        disabled={fetching === tracking.id}
                      >
                        {fetching === tracking.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* 最後更新時間 */}
                    {history.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        最後更新：{new Date(history[history.length - 1].checked_at).toLocaleString('zh-TW')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {trackings.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">尚無追蹤項目</h3>
              <p className="text-muted-foreground">
                新增關鍵字和網站開始追蹤排名變化
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
