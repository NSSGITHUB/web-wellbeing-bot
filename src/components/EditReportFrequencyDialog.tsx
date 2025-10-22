import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditReportFrequencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  currentFrequency: string;
  onSuccess: () => void;
}

const EditReportFrequencyDialog = ({ 
  open, 
  onOpenChange, 
  websiteId,
  currentFrequency,
  onSuccess 
}: EditReportFrequencyDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [frequency, setFrequency] = useState(currentFrequency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("websites")
        .update({ report_frequency: frequency })
        .eq("id", websiteId);

      if (error) throw error;

      toast.success("報表頻率已更新");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("更新失敗：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const frequencyMap: Record<string, string> = {
    daily: "每日",
    weekly: "每週",
    monthly: "每月",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改報表頻率</DialogTitle>
          <DialogDescription>
            選擇您希望接收 SEO 報表的頻率
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="frequency">報表頻率</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">每日</SelectItem>
                <SelectItem value="weekly">每週</SelectItem>
                <SelectItem value="monthly">每月</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              目前設定：{frequencyMap[currentFrequency]}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "更新中..." : "確認更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditReportFrequencyDialog;
