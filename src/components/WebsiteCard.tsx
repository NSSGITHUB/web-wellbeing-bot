import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Website {
  id: string;
  website_url: string;
  website_name: string | null;
  report_frequency: string;
  is_active: boolean;
  created_at: string;
}

interface WebsiteCardProps {
  website: Website;
  onUpdate: () => void;
}

const WebsiteCard = ({ website }: WebsiteCardProps) => {
  const navigate = useNavigate();

  const frequencyMap: Record<string, string> = {
    daily: "每日",
    weekly: "每週",
    monthly: "每月",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">
              {website.website_name || website.website_url}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <ExternalLink className="h-3 w-3" />
              <a 
                href={website.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline line-clamp-1"
              >
                {website.website_url}
              </a>
            </CardDescription>
          </div>
          <Badge variant={website.is_active ? "default" : "secondary"}>
            {website.is_active ? "監測中" : "已暫停"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>報表頻率：{frequencyMap[website.report_frequency]}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="font-medium">最新分數：--</span>
          </div>

          <Button 
            className="w-full mt-4" 
            onClick={() => navigate(`/website/${website.id}`)}
          >
            查看報表
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebsiteCard;