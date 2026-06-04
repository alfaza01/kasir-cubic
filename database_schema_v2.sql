-- Hapus tabel lama jika ada agar tidak bentrok
DROP TABLE IF EXISTS public.absensi CASCADE;
DROP TABLE IF EXISTS public.izin CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.digital_assets CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- Buat ulang tabel dengan kolom yang BENAR

CREATE TABLE public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    user_id TEXT,
    subtext TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    cashiers JSONB,
    presets JSONB,
    running_texts JSONB,
    main_announcement TEXT,
    is_pin_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id)
);

CREATE TABLE public.digital_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id TEXT,
    saldo_bank NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id)
);

CREATE TABLE public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    kasir_id TEXT,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    kategori TEXT,
    sumber_dana TEXT,
    tujuan_dana TEXT,
    nominal NUMERIC,
    admin_fee NUMERIC,
    keterangan TEXT,
    timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.absensi (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    username TEXT,
    tanggal TEXT,
    waktu TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.izin (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    nama TEXT,
    tanggal TEXT,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matikan RLS agar aplikasi bebas membaca/menulis data
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.izin DISABLE ROW LEVEL SECURITY;
