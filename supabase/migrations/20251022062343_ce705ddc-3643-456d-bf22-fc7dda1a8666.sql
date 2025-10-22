-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create websites table
CREATE TABLE public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  website_name TEXT,
  report_frequency TEXT NOT NULL CHECK (report_frequency IN ('daily', 'weekly', 'monthly')),
  notification_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own websites"
  ON public.websites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own websites"
  ON public.websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites"
  ON public.websites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites"
  ON public.websites FOR DELETE
  USING (auth.uid() = user_id);

-- Create keywords table
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_ranking INTEGER,
  previous_ranking INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view keywords for their websites"
  ON public.keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = keywords.website_id
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage keywords for their websites"
  ON public.keywords FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = keywords.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create competitors table
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  competitor_url TEXT NOT NULL,
  competitor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitors for their websites"
  ON public.competitors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = competitors.website_id
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage competitors for their websites"
  ON public.competitors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = competitors.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create seo_reports table
CREATE TABLE public.seo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  report_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_score INTEGER,
  speed_score INTEGER,
  backlinks_count INTEGER,
  structure_issues_count INTEGER,
  report_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their websites"
  ON public.seo_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = seo_reports.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_websites
  BEFORE UPDATE ON public.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_keywords
  BEFORE UPDATE ON public.keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();