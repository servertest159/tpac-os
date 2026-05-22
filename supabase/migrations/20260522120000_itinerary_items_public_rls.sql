-- Access-code app: allow anon/authenticated clients to manage programme itinerary
-- (same pattern as gear / access_codes — gating is in the app layer.)

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read itinerary_items" ON public.itinerary_items;
CREATE POLICY "Public can read itinerary_items"
  ON public.itinerary_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert itinerary_items" ON public.itinerary_items;
CREATE POLICY "Public can insert itinerary_items"
  ON public.itinerary_items FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update itinerary_items" ON public.itinerary_items;
CREATE POLICY "Public can update itinerary_items"
  ON public.itinerary_items FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete itinerary_items" ON public.itinerary_items;
CREATE POLICY "Public can delete itinerary_items"
  ON public.itinerary_items FOR DELETE TO public USING (true);
