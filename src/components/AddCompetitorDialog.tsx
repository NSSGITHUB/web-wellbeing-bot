import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddCompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  onSuccess: () => void;
}

const AddCompetitorDialog = ({ 
  open, 
  onOpenChange, 
  websiteId,
  onSuccess 
}: AddCompetitorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [competitorKeywords, setCompetitorKeywords] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const competitorUrl = formData.get("competitor-url") as string;
    const competitorName = formData.get("competitor-name") as string;

    try {
      // Insert competitor
      const { data: competitor, error: competitorError } = await supabase
        .from("competitors")
        .insert({
          website_id: websiteId,
          competitor_url: competitorUrl,
          competitor_name: competitorName || null,
        })
        .select()
        .single();

      if (competitorError) throw competitorError;

      // Insert competitor keywords if provided
      if (competitorKeywords.trim()) {
        const keywordList = competitorKeywords.split(",").map(k => k.trim()).filter(k => k);
        const keywordInserts = keywordList.map(keyword => ({
          competitor_id: competitor.id,
          keyword,
        }));

        const { error: keywordError } = await supabase
          .from("competitor_keywords")
          .insert(keywordInserts);

        if (keywordError) throw keywordError;
      }

      toast.success("競爭對手已新增");
      onOpenChange(false);
      onSuccess();
      setCompetitorKeywords("");
    } catch (error: any) {
      toast.error("新增失敗：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增競爭對手</DialogTitle>
          <DialogDescription>
            新增競爭對手網站以追蹤其 SEO 表現
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="competitor-url">競爭對手網址 *</Label>
              <Input
                id="competitor-url"
                name="competitor-url"
                type="url"
                placeholder="https://competitor.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitor-name">競爭對手名稱</Label>
              <Input
                id="competitor-name"
                name="competitor-name"
                type="text"
                placeholder="競爭對手公司名稱"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitor-keywords">追蹤關鍵字</Label>
              <Input
                id="competitor-keywords"
                value={competitorKeywords}
                onChange={(e) => setCompetitorKeywords(e.target.value)}
                placeholder="關鍵字1, 關鍵字2, 關鍵字3"
              />
              <p className="text-sm text-muted-foreground">用逗號分隔多個關鍵字</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "新增中..." : "新增競爭對手"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompetitorDialog;
