-- Menambahkan kolom bukti pada tabel t_reimbursement
ALTER TABLE finance.t_reimbursement
ADD COLUMN IF NOT EXISTS bukti TEXT;
