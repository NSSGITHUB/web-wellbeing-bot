import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Globe, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent-light">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">SEO 健診平台</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>
            登入 / 註冊
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              全方位 SEO 健診
              <span className="block text-primary mt-2">提升您的搜尋排名</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              專業的SEO分析工具，幫助您監測網站表現、追蹤關鍵字排名、分析競爭對手，並定期收到詳細的SEO健診報表
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              立即開始
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="bg-primary/10 rounded-lg p-3 w-fit mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">關鍵字排名追蹤</h3>
            <p className="text-muted-foreground">即時監控您的關鍵字在Google台灣的排名變化</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="bg-success/10 rounded-lg p-3 w-fit mb-4">
              <Zap className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-semibold text-lg mb-2">網站速度分析</h3>
            <p className="text-muted-foreground">檢測網站在移動和桌面設備上的加載速度</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="bg-accent/10 rounded-lg p-3 w-fit mb-4">
              <Globe className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">競爭對手分析</h3>
            <p className="text-muted-foreground">深入了解競爭對手的SEO策略和表現</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="bg-warning/10 rounded-lg p-3 w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-semibold text-lg mb-2">定期Email報表</h3>
            <p className="text-muted-foreground">每日/每週/每月自動收到詳細的SEO分析報表</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            準備好提升您的網站排名了嗎？
          </h2>
          <p className="text-primary-foreground/90 mb-8 text-lg">
            立即註冊，開始監測您的第一個網站
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg px-8">
            免費開始使用
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
