-- 創建關鍵字追蹤資料表
CREATE TABLE public.keyword_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  website_url TEXT NOT NULL,
  website_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 創建關鍵字追蹤歷史資料表
CREATE TABLE public.keyword_tracking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id UUID NOT NULL REFERENCES public.keyword_tracking(id) ON DELETE CASCADE,
  ranking INTEGER,
  search_volume INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.keyword_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_tracking_history ENABLE ROW LEVEL SECURITY;

-- keyword_tracking 的 RLS 政策
CREATE POLICY "Users can view their own tracking" 
ON public.keyword_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking" 
ON public.keyword_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking" 
ON public.keyword_tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracking" 
ON public.keyword_tracking 
FOR DELETE 
USING (auth.uid() = user_id);

-- keyword_tracking_history 的 RLS 政策
CREATE POLICY "Users can view their tracking history" 
ON public.keyword_tracking_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.keyword_tracking 
  WHERE keyword_tracking.id = keyword_tracking_history.tracking_id 
  AND keyword_tracking.user_id = auth.uid()
));

CREATE POLICY "Users can insert tracking history" 
ON public.keyword_tracking_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.keyword_tracking 
  WHERE keyword_tracking.id = keyword_tracking_history.tracking_id 
  AND keyword_tracking.user_id = auth.uid()
));

-- 創建 updated_at 觸發器
CREATE TRIGGER update_keyword_tracking_updated_at
BEFORE UPDATE ON public.keyword_tracking
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();