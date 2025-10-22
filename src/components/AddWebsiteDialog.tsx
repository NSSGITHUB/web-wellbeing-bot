import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddWebsiteDialog = ({ open, onOpenChange, onSuccess }: AddWebsiteDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const websiteUrl = formData.get("website-url") as string;
    const websiteName = formData.get("website-name") as string;
    const notificationEmail = formData.get("notification-email") as string;
    const reportFrequency = formData.get("report-frequency") as string;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登入");

      // Insert website
      const { data: website, error: websiteError } = await supabase
        .from("websites")
        .insert({
          user_id: user.id,
          website_url: websiteUrl,
          website_name: websiteName,
          notification_email: notificationEmail,
          report_frequency: reportFrequency,
        })
        .select()
        .single();

      if (websiteError) throw websiteError;

      // Insert keywords
      if (keywords.trim()) {
        const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k);
        const keywordInserts = keywordList.map(keyword => ({
          website_id: website.id,
          keyword,
        }));

        const { error: keywordError } = await supabase
          .from("keywords")
          .insert(keywordInserts);

        if (keywordError) throw keywordError;
      }

      // Insert competitors
      if (competitors.trim()) {
        const competitorList = competitors.split(",").map(c => c.trim()).filter(c => c);
        const competitorInserts = competitorList.map(url => ({
          website_id: website.id,
          competitor_url: url,
        }));

        const { error: competitorError } = await supabase
          .from("competitors")
          .insert(competitorInserts);

        if (competitorError) throw competitorError;
      }

      toast.success("網站新增成功！");
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setKeywords("");
      setCompetitors("");
    } catch (error: any) {
      toast.error("新增失敗：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增網站監測</DialogTitle>
          <DialogDescription>
            設定您要監測的網站和關鍵字，我們將定期為您生成SEO健診報表
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website-url">網站網址 *</Label>
              <Input
                id="website-url"
                name="website-url"
                type="url"
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website-name">網站名稱</Label>
              <Input
                id="website-name"
                name="website-name"
                type="text"
                placeholder="我的網站"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-email">通知Email *</Label>
              <Input
                id="notification-email"
                name="notification-email"
                type="email"
                placeholder="your@email.com"
                required
              />
              <p className="text-sm text-muted-foreground">報表將發送至此Email</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-frequency">報表頻率 *</Label>
              <Select name="report-frequency" defaultValue="weekly" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">每日</SelectItem>
                  <SelectItem value="weekly">每週</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">關鍵字</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="關鍵字1, 關鍵字2, 關鍵字3"
              />
              <p className="text-sm text-muted-foreground">用逗號分隔多個關鍵字</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitors">競爭對手網址</Label>
              <Input
                id="competitors"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="https://competitor1.com, https://competitor2.com"
              />
              <p className="text-sm text-muted-foreground">用逗號分隔多個競爭對手網址</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "新增中..." : "新增網站"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWebsiteDialog;