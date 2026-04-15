-- Fix: allow production roles to delete production orders.
-- Run this script in Supabase SQL Editor on environments that already have RLS policies applied.

DROP POLICY IF EXISTS "Strategic can delete production orders" ON production.t_produksi_order;
DROP POLICY IF EXISTS "Produksi and strategic can delete production orders" ON production.t_produksi_order;

CREATE POLICY "Produksi and strategic can delete production orders"
ON production.t_produksi_order FOR DELETE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);
