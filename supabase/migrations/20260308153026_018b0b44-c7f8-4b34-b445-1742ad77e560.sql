INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculum', 'curriculum', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for curriculum"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'curriculum');