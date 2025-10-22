-- 在 competitors 表添加 SEO 數據欄位
ALTER TABLE public.competitors
ADD COLUMN overall_score integer,
ADD COLUMN speed_score integer,
ADD COLUMN backlinks_count integer,
ADD COLUMN last_checked_at timestamp with time zone DEFAULT now();

-- 更新 seo_reports 表的 RLS 政策，允許用戶為自己的網站插入報告
CREATE POLICY "Users can insert reports for their websites"
ON public.seo_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM websites
    WHERE websites.id = seo_reports.website_id
    AND websites.user_id = auth.uid()
  )
);