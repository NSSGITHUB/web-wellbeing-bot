import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Plus, LogOut, TrendingUp, AlertCircle, Globe, Settings } from "lucide-react";
import { toast } from "sonner";
import AddWebsiteDialog from "@/components/AddWebsiteDialog";
import WebsiteCard from "@/components/WebsiteCard";
import UserSettingsDialog from "@/components/UserSettingsDialog";

interface Website {
  id: string;
  website_url: string;
  website_name: string | null;
  report_frequency: string;
  is_active: boolean;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        loadWebsites();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadWebsites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("載入網站失敗：" + error.message);
    } else {
      setWebsites(data || []);
      await loadStatistics(data || []);
    }
    setLoading(false);
  };

  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [totalIssues, setTotalIssues] = useState<number>(0);

  const loadStatistics = async (websiteList: Website[]) => {
    if (websiteList.length === 0) return;

    // Load latest reports for all websites
    const { data: reports } = await supabase
      .from("seo_reports")
      .select("website_id, overall_score, structure_issues_count")
      .in("website_id", websiteList.map(w => w.id))
      .order("created_at", { ascending: false });

    if (reports && reports.length > 0) {
      // Get latest report for each website
      const latestReports = websiteList.map(website => {
        return reports.find(r => r.website_id === website.id);
      }).filter(Boolean);

      // Calculate average score
      const scoresWithData = latestReports.filter(r => r?.overall_score);
      if (scoresWithData.length > 0) {
        const avg = scoresWithData.reduce((sum, r) => sum + (r?.overall_score || 0), 0) / scoresWithData.length;
        setAverageScore(Math.round(avg));
      }

      // Calculate total issues
      const total = latestReports.reduce((sum, r) => sum + (r?.structure_issues_count || 0), 0);
      setTotalIssues(total);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("已登出");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">SEO 健診平台</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              個人設定
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">監測網站</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{websites.length}</div>
              <p className="text-xs text-muted-foreground">正在監測中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均分數</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {averageScore !== null ? averageScore : "--"}
              </div>
              <p className="text-xs text-muted-foreground">SEO健康度</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待處理問題</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{totalIssues}</div>
              <p className="text-xs text-muted-foreground">需要關注</p>
            </CardContent>
          </Card>
        </div>

        {/* Websites section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">我的網站</h2>
            <p className="text-muted-foreground">管理您的SEO監測網站</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增網站
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">載入中...</p>
          </div>
        ) : websites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">尚未新增網站</h3>
              <p className="text-muted-foreground mb-4">開始監測您的第一個網站</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增網站
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <WebsiteCard key={website.id} website={website} onUpdate={loadWebsites} />
            ))}
          </div>
        )}
      </main>

      <AddWebsiteDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={loadWebsites}
      />
      <UserSettingsDialog 
        open={showSettingsDialog} 
        onOpenChange={setShowSettingsDialog}
      />
    </div>
  );
};

export default Dashboard;