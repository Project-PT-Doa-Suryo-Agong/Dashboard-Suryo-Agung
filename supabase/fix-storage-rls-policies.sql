-- Fix Storage RLS policies to match current role matrix in core.profiles
-- Roles in this project: Developer, CEO, Finance, HR, Produksi, Logistik, Creative, Office
-- Run in Supabase SQL Editor.

-- Ensure buckets exist (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('returns', 'returns', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('reimbursements', 'reimbursements', false)
ON CONFLICT (id) DO NOTHING;

-- App uses bucket "produk-foto" on frontend utility. Keep legacy "products" too.
INSERT INTO storage.buckets (id, name, public)
VALUES ('produk-foto', 'produk-foto', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Keep visibility aligned with app behavior
UPDATE storage.buckets SET public = false WHERE id IN ('returns', 'reimbursements');
UPDATE storage.buckets SET public = true WHERE id IN ('produk-foto', 'products');

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean old policies if present
DROP POLICY IF EXISTS "Authenticated users can upload reimbursement proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own reimbursement proofs or Finance/Strategic can read all" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own reimbursement proofs" ON storage.objects;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Logistik, Produksi, Strategic can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Logistik, Produksi, Strategic can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Strategic can delete product images" ON storage.objects;

DROP POLICY IF EXISTS "Logistik can upload return proofs" ON storage.objects;
DROP POLICY IF EXISTS "Logistik and Produksi can read return proofs" ON storage.objects;
DROP POLICY IF EXISTS "Logistik can update return proofs" ON storage.objects;
DROP POLICY IF EXISTS "Strategic can delete return proofs" ON storage.objects;

-- Reimbursements
CREATE POLICY "Reimbursements upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reimbursements'
);

CREATE POLICY "Reimbursements read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reimbursements'
  AND (
    owner = auth.uid()
    OR core.get_user_role() IN ('Developer', 'CEO', 'Finance')
  )
);

CREATE POLICY "Reimbursements delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reimbursements'
  AND (
    owner = auth.uid()
    OR core.get_user_role() IN ('Developer', 'CEO', 'Finance')
  )
);

-- Product photos (supports both bucket names)
CREATE POLICY "Product photos public read"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('produk-foto', 'products')
);

CREATE POLICY "Product photos upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('produk-foto', 'products')
  AND core.get_user_role() IN ('Developer', 'CEO', 'Office', 'Logistik', 'Produksi')
);

CREATE POLICY "Product photos update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('produk-foto', 'products')
  AND core.get_user_role() IN ('Developer', 'CEO', 'Office', 'Logistik', 'Produksi')
)
WITH CHECK (
  bucket_id IN ('produk-foto', 'products')
  AND core.get_user_role() IN ('Developer', 'CEO', 'Office', 'Logistik', 'Produksi')
);

CREATE POLICY "Product photos delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('produk-foto', 'products')
  AND (
    owner = auth.uid()
    OR core.get_user_role() IN ('Developer', 'CEO')
  )
);

-- Return proofs
CREATE POLICY "Returns upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'returns'
  AND core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
);

CREATE POLICY "Returns read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'returns'
  AND core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Returns update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'returns'
  AND core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
)
WITH CHECK (
  bucket_id = 'returns'
  AND core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
);

CREATE POLICY "Returns delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'returns'
  AND (
    owner = auth.uid()
    OR core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
  )
);
