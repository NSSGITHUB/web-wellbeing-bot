-- 創建競爭對手關鍵字表
CREATE TABLE public.competitor_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_ranking INTEGER,
  previous_ranking INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 創建關鍵字排名歷史記錄表（包含網站和競爭對手）
CREATE TABLE public.keyword_ranking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE CASCADE,
  competitor_keyword_id UUID REFERENCES public.competitor_keywords(id) ON DELETE CASCADE,
  ranking INTEGER NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_keyword_or_competitor CHECK (
    (keyword_id IS NOT NULL AND competitor_keyword_id IS NULL) OR
    (keyword_id IS NULL AND competitor_keyword_id IS NOT NULL)
  )
);

-- 為 competitor_keywords 啟用 RLS
ALTER TABLE public.competitor_keywords ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看其網站競爭對手的關鍵字
CREATE POLICY "Users can view competitor keywords for their websites"
ON public.competitor_keywords
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM competitors
    JOIN websites ON websites.id = competitors.website_id
    WHERE competitors.id = competitor_keywords.competitor_id
    AND websites.user_id = auth.uid()
  )
);

-- 用戶可以管理其網站競爭對手的關鍵字
CREATE POLICY "Users can manage competitor keywords for their websites"
ON public.competitor_keywords
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM competitors
    JOIN websites ON websites.id = competitors.website_id
    WHERE competitors.id = competitor_keywords.competitor_id
    AND websites.user_id = auth.uid()
  )
);

-- 為 keyword_ranking_history 啟用 RLS
ALTER TABLE public.keyword_ranking_history ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看其關鍵字的排名歷史
CREATE POLICY "Users can view ranking history for their keywords"
ON public.keyword_ranking_history
FOR SELECT
USING (
  (keyword_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM keywords
    JOIN websites ON websites.id = keywords.website_id
    WHERE keywords.id = keyword_ranking_history.keyword_id
    AND websites.user_id = auth.uid()
  ))
  OR
  (competitor_keyword_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM competitor_keywords
    JOIN competitors ON competitors.id = competitor_keywords.competitor_id
    JOIN websites ON websites.id = competitors.website_id
    WHERE competitor_keywords.id = keyword_ranking_history.competitor_keyword_id
    AND websites.user_id = auth.uid()
  ))
);

-- 用戶可以插入其關鍵字的排名歷史
CREATE POLICY "Users can insert ranking history for their keywords"
ON public.keyword_ranking_history
FOR INSERT
WITH CHECK (
  (keyword_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM keywords
    JOIN websites ON websites.id = keywords.website_id
    WHERE keywords.id = keyword_ranking_history.keyword_id
    AND websites.user_id = auth.uid()
  ))
  OR
  (competitor_keyword_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM competitor_keywords
    JOIN competitors ON competitors.id = competitor_keywords.competitor_id
    JOIN websites ON websites.id = competitors.website_id
    WHERE competitor_keywords.id = keyword_ranking_history.competitor_keyword_id
    AND websites.user_id = auth.uid()
  ))
);

-- 創建更新時間觸發器
CREATE TRIGGER update_competitor_keywords_updated_at
BEFORE UPDATE ON public.competitor_keywords
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 創建索引以提升查詢效能
CREATE INDEX idx_competitor_keywords_competitor_id ON public.competitor_keywords(competitor_id);
CREATE INDEX idx_keyword_ranking_history_keyword_id ON public.keyword_ranking_history(keyword_id);
CREATE INDEX idx_keyword_ranking_history_competitor_keyword_id ON public.keyword_ranking_history(competitor_keyword_id);
CREATE INDEX idx_keyword_ranking_history_checked_at ON public.keyword_ranking_history(checked_at);