-- Jalankan SQL ini di Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS pos_products (
  id          TEXT PRIMARY KEY,
  store_id    TEXT NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Aksesoris',
  sell_price  BIGINT NOT NULL DEFAULT 0,
  cost_price  BIGINT NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index agar query per-toko cepat
CREATE INDEX IF NOT EXISTS idx_pos_products_store_id ON pos_products(store_id);

-- Row Level Security (opsional tapi dianjurkan)
ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;

-- Policy: semua user authenticated bisa baca & tulis
CREATE POLICY "Allow all for authenticated" ON pos_products
  FOR ALL USING (true) WITH CHECK (true);
