import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditNotificationEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  currentEmail: string;
  onSuccess: () => void;
}

const EditNotificationEmailDialog = ({ 
  open, 
  onOpenChange, 
  websiteId,
  currentEmail,
  onSuccess 
}: EditNotificationEmailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(currentEmail);

  useEffect(() => {
    setEmail(currentEmail);
  }, [currentEmail, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("websites")
        .update({ notification_email: email })
        .eq("id", websiteId);

      if (error) throw error;

      toast.success("收信信箱已更新");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("更新失敗：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改收信信箱</DialogTitle>
          <DialogDescription>
            修改接收 SEO 報表的 Email 地址
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email 地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              目前設定：{currentEmail}
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

export default EditNotificationEmailDialog;
