import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserSettingsDialog = ({ open, onOpenChange }: UserSettingsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("載入個人資料失敗：", error);
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setCompanyName(data.company_name || "");
      setNotificationEmail(data.email || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("請先登入");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("更新失敗：" + error.message);
    } else {
      toast.success("個人資料已更新");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>個人設定</DialogTitle>
          <DialogDescription>
            更新您的個人資料和通知設定
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">姓名</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="您的姓名"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-name">公司名稱</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="您的公司名稱（選填）"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-email">登入帳號</Label>
            <Input
              id="notification-email"
              value={notificationEmail}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              您的登入帳號，無法修改
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsDialog;
