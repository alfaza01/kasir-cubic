-- Run this in Supabase SQL Editor for the NEW project

CREATE TABLE public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    owner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    cashiers JSONB,
    presets JSONB,
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

-- Turn off RLS for now so it works without complex policies
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.izin DISABLE ROW LEVEL SECURITY;
