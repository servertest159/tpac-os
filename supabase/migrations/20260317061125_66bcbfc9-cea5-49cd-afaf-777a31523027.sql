
-- Table for AAR form links (MS Forms links tracked in the feedback list)
CREATE TABLE public.aar_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  response_count integer NOT NULL DEFAULT 0,
  participant_count integer NOT NULL DEFAULT 0,
  average_rating numeric(3,1) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aar_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select aar_forms" ON public.aar_forms FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert aar_forms" ON public.aar_forms FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update aar_forms" ON public.aar_forms FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete aar_forms" ON public.aar_forms FOR DELETE TO public USING (true);

-- Table for full AAR reports filed via the AarForm
CREATE TABLE public.aar_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_title text NOT NULL,
  reporter_name text NOT NULL,
  date_of_programme date NOT NULL,
  location text NOT NULL,
  participants text NOT NULL,
  objectives_met text NOT NULL,
  what_went_well text NOT NULL,
  what_could_be_improved text NOT NULL,
  lessons_learned text NOT NULL,
  recommendations text,
  additional_comments text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aar_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select aar_reports" ON public.aar_reports FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert aar_reports" ON public.aar_reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update aar_reports" ON public.aar_reports FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete aar_reports" ON public.aar_reports FOR DELETE TO public USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.aar_forms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aar_reports;

-- Also ensure gear table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gear'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gear;
  END IF;
END $$;
