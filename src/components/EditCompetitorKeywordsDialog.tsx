import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompetitorKeyword {
  id: string;
  keyword: string;
  current_ranking: number | null;
}

interface EditCompetitorKeywordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitorId: string;
  competitorName: string;
  onSuccess: () => void;
}

const EditCompetitorKeywordsDialog = ({ 
  open, 
  onOpenChange, 
  competitorId,
  competitorName,
  onSuccess 
}: EditCompetitorKeywordsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<CompetitorKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (open) {
      loadKeywords();
    }
  }, [open, competitorId]);

  const loadKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from("competitor_keywords")
        .select("id, keyword, current_ranking")
        .eq("competitor_id", competitorId)
        .order("keyword");

      if (error) throw error;
      setKeywords(data || []);
    } catch (error: any) {
      toast.error("載入關鍵字失敗：" + error.message);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("competitor_keywords")
        .insert({
          competitor_id: competitorId,
          keyword: newKeyword.trim(),
        });

      if (error) throw error;

      toast.success("關鍵字已新增");
      setNewKeyword("");
      loadKeywords();
      onSuccess();
    } catch (error: any) {
      toast.error("新增失敗：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm("確定要刪除此關鍵字嗎？")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("competitor_keywords")
        .delete()
        .eq("id", keywordId);

      if (error) throw error;

      toast.success("關鍵字已刪除");
      loadKeywords();
      onSuccess();
    } catch (error: any) {
      toast.error("刪除失敗：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>管理競爭對手關鍵字</DialogTitle>
          <DialogDescription>
            {competitorName} 的追蹤關鍵字
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Keyword */}
          <div className="space-y-2">
            <Label>新增關鍵字</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="輸入關鍵字"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button 
                onClick={handleAddKeyword} 
                disabled={loading || !newKeyword.trim()}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing Keywords */}
          <div className="space-y-2">
            <Label>現有關鍵字 ({keywords.length})</Label>
            {keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                尚無追蹤關鍵字
              </p>
            ) : (
              <div className="space-y-2">
                {keywords.map((keyword) => (
                  <div 
                    key={keyword.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{keyword.keyword}</span>
                      {keyword.current_ranking && (
                        <Badge variant="secondary">
                          排名: {keyword.current_ranking}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteKeyword(keyword.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              關閉
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompetitorKeywordsDialog;

