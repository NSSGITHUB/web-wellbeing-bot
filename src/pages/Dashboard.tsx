import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Plus, LogOut, TrendingUp, AlertCircle, Globe } from "lucide-react";
import { toast } from "sonner";
import AddWebsiteDialog from "@/components/AddWebsiteDialog";
import WebsiteCard from "@/components/WebsiteCard";

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
    }
    setLoading(false);
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
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
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
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">SEO健康度</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待處理問題</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
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
    </div>
  );
};

export default Dashboard;