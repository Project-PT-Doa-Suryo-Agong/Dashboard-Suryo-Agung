-- Step 1: Eksekusi penambahan tipe enum 'super-admin' (asumsinya nama enum adalah user_role)
-- Jika nama enum berada di skema public/core, sertakan skemanya, misal: ALTER TYPE core.user_role ADD VALUE IF NOT EXISTS 'super-admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super-admin';

-- (Optional) Tambahkan sementara 'developer' agar casting saat WHERE clause di eksekusi SQL tidak gagal, namun seringkali tak masalah jika datanya masih string.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';

-- Step 2: Perbarui referensi statis di tabel core.profiles
UPDATE core.profiles
SET role = 'super-admin'
WHERE role = 'developer';

-- Step 3: Perbarui metadata otentikasi (auth.users) agar selaras dengan skema terbaru
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"super-admin"}'::jsonb
WHERE raw_user_meta_data->>'role' = 'developer';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"super-admin"}'::jsonb
WHERE raw_app_meta_data->>'role' = 'developer';
