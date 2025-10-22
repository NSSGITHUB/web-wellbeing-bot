import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, TrendingUp } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const fullName = formData.get("full-name") as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("註冊成功！請登入您的帳戶");
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error("登入失敗：" + error.message);
    } else {
      toast.success("登入成功！");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent-light flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="bg-primary rounded-xl p-3">
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">SEO 健診平台</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            全方位網站SEO分析，助您提升搜尋引擎排名
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">即時排名追蹤</h3>
                <p className="text-sm text-muted-foreground">監控關鍵字在Google台灣的排名變化</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-6 w-6 text-accent mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">競爭對手分析</h3>
                <p className="text-sm text-muted-foreground">深入了解競爭對手的SEO策略</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>歡迎回來</CardTitle>
            <CardDescription>登入或註冊開始使用SEO健診服務</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">登入</TabsTrigger>
                <TabsTrigger value="signup">註冊</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">密碼</Label>
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "登入中..." : "登入"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">姓名</Label>
                    <Input
                      id="full-name"
                      name="full-name"
                      type="text"
                      placeholder="您的姓名"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密碼</Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "註冊中..." : "註冊"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;