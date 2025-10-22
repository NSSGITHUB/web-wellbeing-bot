import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Globe, Zap, Link as LinkIcon, AlertTriangle } from "lucide-react";
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
}

const WebsiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<Website | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

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

    setLoading(false);
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

  // Mock SEO data for demo
  const mockSeoData = {
    overallScore: 78,
    speedScore: 85,
    backlinksCount: 234,
    structureIssues: 12,
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
          <h1 className="text-3xl font-bold mb-2">{website.website_name || website.website_url}</h1>
          <p className="text-muted-foreground">{website.website_url}</p>
        </div>

        {/* SEO Score Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">整體分數</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockSeoData.overallScore}</div>
              <p className="text-xs text-muted-foreground mt-1">SEO健康度</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">網站速度</CardTitle>
              <Zap className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mockSeoData.speedScore}</div>
              <p className="text-xs text-muted-foreground mt-1">PageSpeed分數</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">反向連結</CardTitle>
              <LinkIcon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockSeoData.backlinksCount}</div>
              <p className="text-xs text-muted-foreground mt-1">個連結</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待修復問題</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{mockSeoData.structureIssues}</div>
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
                  <div key={competitor.id} className="flex items-center justify-between p-3 border rounded-lg">
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