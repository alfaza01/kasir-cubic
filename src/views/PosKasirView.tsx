import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { printReceiptToRawBT } from '../lib/utils';

interface PosProduct {
  id: string;
  store_id: string;
  name: string;
  category: string;
  sell_price: number;
  cost_price: number;
  stock: number;
  is_active: boolean;
  created_at?: string;
}

interface CartItem {
  product: PosProduct;
  qty: number;
}

type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer';
type ActivePage = 'pos' | 'produk' | 'tambah' | 'edit' | 'riwayat';

interface Props {
  active: boolean;
  isPc: boolean;
  setActiveView: (v: string) => void;
  showToast: (msg: string) => void;
  onConfirm: (title: string, msg: string, cb: () => void) => void;
  activeStoreId: string;
  kasirName: string;
  onSaveAksesorisTx: (items: { name: string; qty: number; total: number }[], grandTotal: number, paymentMethod: string) => void;
  storeName?: string;
  storeAddress?: string;
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const fmtDate = (d: string) => new Date(d).toLocaleString('id-ID', {day: '2-digit', month:'short', hour:'2-digit', minute:'2-digit'});

export default function PosKasirView({ active, isPc, setActiveView, showToast, onConfirm, activeStoreId, kasirName, onSaveAksesorisTx, storeName, storeAddress }: Props) {
  const [page, setPage] = useState<ActivePage>('pos');
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [selCat, setSelCat] = useState('Semua');
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Tunai');
  const [discount, setDiscount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Form tambah/edit produk
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState('');
  const [fCat, setFCat] = useState('Aksesoris');
  const [fSell, setFSell] = useState('');
  const [fCost, setFCost] = useState('');
  const [fStock, setFStock] = useState('');
  const [fMinStock, setFMinStock] = useState('5');
  const [saving, setSaving] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [tambahTab, setTambahTab] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  
  const [searchProd, setSearchProd] = useState('');
  
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isNewCat, setIsNewCat] = useState(false);

  const [showManual, setShowManual] = useState(false);
  const [manName, setManName] = useState('');
  const [manPrice, setManPrice] = useState('');
  const [lastTx, setLastTx] = useState<any>(null);

  useEffect(() => {
    if (page === 'riwayat') fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', activeStoreId)
      .ilike('keterangan', '[POS]%')
      .order('timestamp', { ascending: false })
      .limit(50);
    if (data) setHistory(data);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (active && activeStoreId && activeStoreId !== 'all') fetchProducts();
  }, [active, activeStoreId]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pos_products')
      .select('*')
      .eq('store_id', activeStoreId)
      .order('name', { ascending: true });
    if (!error && data) setProducts(data as PosProduct[]);
    setLoading(false);
  };

  const categories = useMemo(() => ['Semua', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()) || p.category.toLowerCase().includes(searchProd.toLowerCase()));
  }, [products, searchProd]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (!p.is_active) return false;
      const matchSearch = p.name.toLowerCase().includes(searchQ.toLowerCase());
      const matchCat = selCat === 'Semua' || p.category === selCat;
      return matchSearch && matchCat;
    });
  }, [products, searchQ, selCat]);

  const addToCart = (product: PosProduct) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) {
        if (ex.qty >= product.stock) { showToast('Stok habis!'); return prev; }
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      if (product.stock < 1) { showToast('Stok kosong!'); return prev; }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === id);
      if (ex && ex.qty > 1) return prev.map(i => i.product.id === id ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.product.id !== id);
    });
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.qty * i.product.sell_price, 0);
  const discNum = Number(discount) || 0;
  const grandTotal = Math.max(0, totalPrice - discNum);
  const paid = Number(amountPaid) || 0;
  const change = Math.max(0, paid - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (payMethod === 'Tunai' && paid < grandTotal) { showToast('Uang kurang!'); return; }

    // Update stok di Supabase
    for (const item of cart) {
      await supabase
        .from('pos_products')
        .update({ stock: item.product.stock - item.qty })
        .eq('id', item.product.id);
    }

    onSaveAksesorisTx(
      cart.map(i => ({ name: i.product.name, qty: i.qty, total: i.qty * i.product.sell_price })),
      grandTotal,
      payMethod
    );

    setLastTx({
      id: `TRX-${Date.now()}`,
      items: cart.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.sell_price })),
      grandTotal, paid, change, payMethod, timestamp: new Date().toISOString(),
      kasirName
    });

    showToast('Transaksi berhasil! ✅');
    setCart([]);
    setDiscount('');
    setAmountPaid('');
    fetchProducts();
  };

  const formatNumberInput = (val: string) => {
    const numberStr = val.replace(/[^0-9]/g, '');
    if (!numberStr) return '';
    return parseInt(numberStr, 10).toLocaleString('id-ID');
  };

  const openTambah = () => {
    setIsNewCat(false);
    setEditId(null); setFName(''); setFCat('Aksesoris'); setFSell(''); setFCost(''); setFStock('');
    setPage('tambah');
  };

  const openEdit = (p: PosProduct) => {
    setEditId(p.id); setFName(p.name); setFCat(p.category);
    setFSell(p.sell_price.toLocaleString('id-ID')); setFCost(p.cost_price.toLocaleString('id-ID')); setFStock(p.stock.toString());
    setPage('edit');
  };

  const handleSaveProduk = async (andAdd = false) => {
    if (!fName.trim() || !fSell || !fStock) { showToast('Lengkapi nama, harga jual, dan stok!'); return; }
    setSaving(true);
    const payload = {
      store_id: activeStoreId,
      name: fName.trim(),
      category: fCat.trim() || 'Aksesoris',
      sell_price: Number(fSell.replace(/[^0-9]/g, '')),
      cost_price: Number(fCost.replace(/[^0-9]/g, '')) || 0,
      stock: Number(fStock),
      is_active: true,
    };
    if (editId) {
      await supabase.from('pos_products').update(payload).eq('id', editId);
      showToast('Produk diperbarui!');
    } else {
      await supabase.from('pos_products').insert({ ...payload, id: `pos_${Date.now()}` });
      showToast(andAdd ? 'Tersimpan! Tambah lagi.' : 'Produk ditambahkan!');
    }
    await fetchProducts();
    setSaving(false);
    if (andAdd) { setFName(''); setFSell(''); setFCost(''); setFStock(''); setFMinStock('5'); }
    else setPage('produk');
  };

  const handleSaveBulk = async () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter(l => l.trim());
    const rows: any[] = [];
    for (const line of lines) {
      const clean = line.replace(/^\d+[.)\-]?\s*/, '');
      let parts = clean.split(',');
      if (parts.length < 2) parts = clean.split('|');
      parts = parts.map(s => s.trim());
      if (parts.length >= 3) {
        rows.push({
          id: `pos_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          store_id: activeStoreId,
          name: parts[0],
          category: fCat.trim() || 'Aksesoris',
          cost_price: Number(parts[1].replace(/[^0-9]/g, '')) || 0,
          sell_price: Number(parts[2].replace(/[^0-9]/g, '')) || 0,
          stock: Number((parts[3] || '0').replace(/[^0-9]/g, '')) || 0,
          is_active: true,
        });
      }
    }
    if (rows.length === 0) { showToast('Format tidak dikenali!'); return; }
    setSaving(true);
    await supabase.from('pos_products').insert(rows);
    await fetchProducts();
    setSaving(false);
    setBulkText('');
    showToast(`${rows.length} produk berhasil ditambahkan!`);
    setPage('produk');
  };

  const handleDeleteProduk = (p: PosProduct) => onConfirm('Konfirmasi', `Hapus produk "${p.name}"?`, async () => {
      await supabase.from('pos_products').delete().eq('id', p.id);
      showToast('Produk dihapus');
      fetchProducts();
    });

  const toggleActive = async (p: PosProduct) => {
    await supabase.from('pos_products').update({ is_active: !p.is_active }).eq('id', p.id);
    fetchProducts();
  };

  if (!active) return null;

  // ── HALAMAN FORM TAMBAH / EDIT ──
  if (page === 'tambah' || page === 'edit') {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setPage('produk')} className="text-white/80 hover:text-white">
              <i className="fa-solid fa-arrow-left text-lg" />
            </button>
            <h1 className="font-black text-sm uppercase tracking-wide">{editId ? 'Edit Produk' : 'Tambah Produk'}</h1>
          </div>
          {/* Tab hanya tampil saat Tambah baru */}
          {!editId && (
            <div className="flex bg-indigo-700/50 p-1 rounded-xl">
              <button onClick={() => setTambahTab('single')} className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${tambahTab === 'single' ? 'bg-white text-indigo-700 shadow' : 'text-indigo-200'}`}>Satu-satu</button>
              <button onClick={() => setTambahTab('bulk')} className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${tambahTab === 'bulk' ? 'bg-white text-indigo-700 shadow' : 'text-indigo-200'}`}><i className="fa-solid fa-list" /> Massal</button>
            </div>
          )}
        </div>

        {/* FORM SATU-SATU */}
        {(editId || tambahTab === 'single') && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {[
              { label: 'Nama Produk *', val: fName, set: setFName, type: 'text', ph: 'Cth: Kabel Data Type-C' },
              { label: 'Kategori', val: fCat, set: setFCat, type: 'text', ph: 'Aksesoris, Charger, Kabel...' },
              { label: 'Harga Jual (Rp) *', val: fSell, set: (val: string) => setFSell(formatNumberInput(val)), type: 'text', ph: '0' },
              { label: 'Harga Modal (Rp)', val: fCost, set: (val: string) => setFCost(formatNumberInput(val)), type: 'text', ph: '0' },
              { label: 'Stok Awal *', val: fStock, set: setFStock, type: 'number', ph: '0' },
              { label: 'Minimum Stok', val: fMinStock, set: setFMinStock, type: 'number', ph: '5' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{f.label}</label>
                {f.label === 'Kategori' ? (
                  isNewCat ? (
                    <div className="flex gap-2">
                      <input type="text" value={fCat} onChange={e => setFCat(e.target.value)} placeholder="Nama Kategori Baru"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 bg-white" />
                      <button onClick={() => { setIsNewCat(false); setFCat('Aksesoris'); }} className="px-3 py-2 bg-slate-200 rounded-xl text-xs font-bold text-slate-700">Batal</button>
                    </div>
                  ) : (
                    <select value={fCat} onChange={e => {
                      if (e.target.value === 'NEW') { setIsNewCat(true); setFCat(''); }
                      else setFCat(e.target.value);
                    }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 bg-white">
                      {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="NEW">+ Tambah Kategori Baru...</option>
                    </select>
                  )
                ) : (
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 bg-white" />
                )}
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => handleSaveProduk(false)} disabled={saving}
                className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <i className="fa-solid fa-circle-notch fa-spin" /> : <><i className="fa-solid fa-floppy-disk" /> {editId ? 'Simpan Perubahan' : 'Simpan Produk'}</>}
              </button>
              {!editId && (
                <button onClick={() => handleSaveProduk(true)} disabled={saving}
                  className="w-full bg-orange-100 text-orange-700 font-black py-3 rounded-2xl text-sm border border-orange-200 flex items-center justify-center gap-2">
                  <i className="fa-solid fa-plus-circle" /> Simpan & Tambah Lagi
                </button>
              )}
            </div>
          </div>
        )}

        {/* FORM MASSAL */}
        {!editId && tambahTab === 'bulk' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <p className="text-xs font-black text-indigo-700 mb-1 flex items-center gap-1"><i className="fa-solid fa-circle-info" /> Format tiap baris:</p>
              <code className="text-[11px] text-slate-600 block bg-white rounded-xl p-2 mt-1 border border-indigo-100">Nama, Harga Modal, Harga Jual, Stok</code>
              <p className="text-[10px] text-slate-500 mt-2">Contoh:<br/>Kabel Type-C, 15000, 35000, 50<br/>Charger 20W, 40000, 85000, 20</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Kategori untuk semua</label>
              <input type="text" value={fCat} onChange={e => setFCat(e.target.value)} placeholder="Aksesoris"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-indigo-400" />
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
              placeholder="Paste atau ketik daftar produk di sini..."
              rows={10}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 resize-none shadow-inner" />
            <button onClick={handleSaveBulk} disabled={saving || !bulkText.trim()}
              className="w-full bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2">
              {saving ? <i className="fa-solid fa-circle-notch fa-spin" /> : <><i className="fa-solid fa-upload" /> Proses & Simpan Massal</>}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── HALAMAN CETAK PREVIEW ──
  if (showPrintPreview && lastTx) {
    const renderReceipt = () => (
      <div className="bg-white text-black font-mono text-[12px] leading-[1.2] w-[58mm] p-[2mm] mx-auto">
         <div className="text-center mb-2">
            <h2 className="font-bold text-[14px] leading-tight">{storeName || 'POS KASIR'}</h2>
            <p className="text-[10px] whitespace-pre-wrap">{storeAddress || 'Toko Anda'}</p>
         </div>
         <div className="text-[10px] mb-2 border-b border-black border-dashed pb-2">
            <div className="flex justify-between"><span>Waktu:</span><span>{new Date().toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}</span></div>
            <div className="flex justify-between"><span>Kasir:</span><span>{kasirName}</span></div>
            <div className="flex justify-between"><span>Trx ID:</span><span>{lastTx.id ? lastTx.id.slice(0, 8) : 'NEW'}</span></div>
         </div>
         <div className="border-b border-dashed border-black mb-1 pb-1">
            {lastTx.items.map((it: any, idx: number) => (
               <div key={idx} className="mb-1">
                  <div className="font-bold">{it.name}</div>
                  <div className="flex justify-between">
                     <span>{it.qty}x {fmt(it.price)}</span>
                     <span>{fmt(it.qty * it.price)}</span>
                  </div>
               </div>
            ))}
         </div>
         <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{fmt(lastTx.grandTotal)}</span>
         </div>
         <div className="flex justify-between">
            <span>TUNAI</span>
            <span>{fmt(lastTx.paid)}</span>
         </div>
         <div className="flex justify-between">
            <span>KEMBALI</span>
            <span>{fmt(lastTx.change)}</span>
         </div>
         <div className="text-center mt-3 text-[10px]">
            <p>Terima Kasih</p>
         </div>
      </div>
    );

    return (
      <div className="absolute inset-0 z-[100] bg-slate-200 overflow-y-auto pb-20">
        <div className="sticky top-0 left-0 right-0 p-4 flex justify-between z-50 no-print bg-slate-900 shadow-md">
          <button onClick={() => setShowPrintPreview(false)} className="px-5 py-2.5 bg-white/10 text-white rounded-full font-bold flex items-center gap-2 active:scale-95">
            <i className="fa-solid fa-arrow-left"></i> KEMBALI
          </button>
          <button onClick={() => printReceiptToRawBT(storeName || '', storeAddress || '', kasirName, lastTx.id, lastTx.items, lastTx.grandTotal, lastTx.paid, lastTx.change, new Date().toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' }))} className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-black shadow-xl flex items-center gap-2 active:scale-95">
            <i className="fa-solid fa-print"></i> CETAK
          </button>
        </div>
        <div className="pt-8 px-4 flex justify-center no-print">
           <div className="shadow-2xl">{renderReceipt()}</div>
        </div>
        <div className="hidden print:block w-full thermal-print-area">
           {renderReceipt()}
        </div>
        <style>{`
          @media print {
            @page { margin: 20mm; size: auto; }
            body { margin: 0; padding: 0; background: white !important; display: flex !important; justify-content: center !important; align-items: flex-start !important; }
            body * { visibility: hidden; }
            .thermal-print-area, .thermal-print-area * { visibility: visible; }
            .thermal-print-area {
              position: static !important;
              transform: none !important;
              margin: 0 auto;
              padding: 0;
              width: auto;
              display: block;
            }
          }
        `}</style>
      </div>
    );
  }

  // ── HALAMAN DAFTAR PRODUK ──
  if (page === 'produk') {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <button onClick={() => setPage('pos')} className="text-white/80 hover:text-white">
              <i className="fa-solid fa-arrow-left text-lg" />
            </button>
            <h1 className="font-black text-sm uppercase tracking-wide">Kelola Produk</h1>
          </div>
          <button onClick={openTambah} className="bg-white text-indigo-600 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
            <i className="fa-solid fa-plus" /> Tambah
          </button>
        </div>
        
        <div className="bg-white border-b border-slate-100 px-3 py-2 shrink-0">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Cari nama atau kategori..."
              value={searchProd}
              onChange={e => setSearchProd(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-24">
          {loading && <p className="text-center text-slate-400 text-xs py-8">Memuat...</p>}
          {!loading && products.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <i className="fa-solid fa-box-open text-3xl mb-2 block" />
              <p className="text-xs">Belum ada produk. Tambah dulu!</p>
            </div>
          )}
          {!loading && products.length > 0 && filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <i className="fa-solid fa-search text-3xl mb-2 block text-slate-300" />
              <p className="text-xs">Produk tidak ditemukan</p>
            </div>
          )}
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black truncate ${!p.is_active ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{p.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.category} · Stok: <span className={p.stock < 5 ? 'text-red-500' : 'text-emerald-600'}>{p.stock}</span></p>
                <p className="text-xs font-black text-indigo-600 mt-0.5">{fmt(p.sell_price)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(p)} className={`text-[10px] font-black px-2 py-1 rounded-lg border ${p.is_active ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-slate-50'}`}>
                  {p.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl">
                  <i className="fa-solid fa-pen text-xs" />
                </button>
                <button onClick={() => handleDeleteProduk(p)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl">
                  <i className="fa-solid fa-trash text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── HALAMAN RIWAYAT ──
  if (page === 'riwayat') {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
          <button onClick={() => setPage('pos')} className="text-white/80 hover:text-white">
            <i className="fa-solid fa-arrow-left text-lg" />
          </button>
          <h1 className="font-black text-sm uppercase tracking-wide">Riwayat Penjualan POS</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-24">
          {loadingHistory && <p className="text-center text-slate-400 text-xs py-8">Memuat riwayat...</p>}
          {!loadingHistory && history.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <i className="fa-solid fa-history text-3xl mb-2 block" />
              <p className="text-xs">Belum ada transaksi POS</p>
            </div>
          )}
          {history.map(tx => (
            <div key={tx.id} className="bg-white rounded-2xl p-3 border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-indigo-500">{fmtDate(tx.timestamp)}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{tx.keterangan}</p>
                </div>
                <p className="text-sm font-black text-emerald-600">{fmt(tx.nominal)}</p>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                <span className="text-[10px] font-bold text-slate-400">Kasir: {tx.kasir_id}</span>
                <button onClick={() => {
                  // Reconstruct lastTx from history for printing
                  const itemsStr = tx.keterangan.replace('[POS] ', '').split(' | ')[0];
                  const payMethod = tx.keterangan.split(' | ')[1] || 'Tunai';
                  const items = itemsStr.split(', ').map((i: string) => {
                    const match = i.match(/(.+)\((\d+)\)/);
                    return match ? { name: match[1], qty: Number(match[2]), price: 0 } : { name: i, qty: 1, price: 0 };
                  });
                  setLastTx({
                    id: tx.id, items: tx.items, grandTotal: tx.total, paid: tx.payment_amount, change: tx.change_amount
                  });
                  setShowPrintPreview(true);
                }} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-black px-2 py-1 rounded-md flex items-center gap-1">
                  <i className="fa-solid fa-print" /> Cetak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── HALAMAN POS KASIR (UTAMA) ──
  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveView('view-beranda')} className="text-white/70 hover:text-white">
              <i className="fa-solid fa-arrow-left" />
            </button>
            <div>
              <h1 className="font-black text-sm tracking-wide uppercase flex items-center gap-2">
                <i className="fa-solid fa-cash-register" /> POS Kasir
              </h1>
              <p className="text-[10px] text-indigo-200">Penjualan Aksesoris · {kasirName}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setPage('riwayat')} className="bg-white/15 hover:bg-white/25 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
              <i className="fa-solid fa-history" /> Riwayat
            </button>
            <button onClick={() => setPage('produk')} className="bg-white/15 hover:bg-white/25 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors">
              <i className="fa-solid fa-boxes-stacked" /> Kelola
            </button>
          </div>
        </div>
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full bg-white/15 border-none text-white text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none placeholder-indigo-200 focus:bg-white/20"
          />
        </div>
      </div>

      {/* Kategori */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-white border-b border-slate-100 shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelCat(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-colors ${selCat === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Produk */}
      <div className="flex-1 overflow-y-auto p-3 pb-28">
        {loading && <p className="text-center text-slate-400 text-xs py-8">Memuat produk...</p>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <i className="fa-solid fa-box-open text-3xl mb-2 block" />
            <p className="text-xs font-semibold">Tidak ada produk aktif</p>
            <button onClick={() => setPage('produk')} className="mt-3 text-indigo-600 font-black text-xs underline">Tambah Produk</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowManual(true)}
            className="p-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-center flex flex-col items-center justify-center min-h-[6rem] transition-all"
          >
            <i className="fa-solid fa-plus-circle text-indigo-400 text-xl mb-1" />
            <p className="text-[10px] font-black text-indigo-700 uppercase">Item Manual</p>
          </button>
          {filtered.map(p => {
            const qty = cart.find(i => i.product.id === p.id)?.qty || 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className={`relative p-3 rounded-2xl border bg-white text-left transition-all ${qty > 0 ? 'border-indigo-400 ring-1 ring-indigo-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
              >
                {qty > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {qty}
                  </span>
                )}
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{p.category}</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-2 leading-tight min-h-[2.5em]">{p.name}</p>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700">{fmt(p.sell_price)}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    Stok: {p.stock}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {totalItems > 0 && !showCheckout && (
        <div className="absolute bottom-24 left-4 right-4 z-30">
          <div className="bg-slate-900 rounded-2xl p-3 shadow-xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/20 p-2 rounded-xl">
                <i className="fa-solid fa-cart-shopping text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">{totalItems} item</p>
                <p className="text-sm font-black text-white">{fmt(totalPrice)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCart([])} className="p-2 text-slate-400 hover:text-red-400">
                <i className="fa-solid fa-trash text-sm" />
              </button>
              <button
                onClick={() => { setAmountPaid(totalPrice.toString()); setShowCheckout(true); }}
                className="bg-indigo-600 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                Bayar <i className="fa-solid fa-bolt" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer & Success Screen */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex flex-col justify-end" onClick={e => { if (e.target === e.currentTarget && cart.length > 0) setShowCheckout(false); }}>
          <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {lastTx && cart.length === 0 ? (
              <div className="p-6 flex flex-col items-center text-center space-y-4 my-6">
                <i className="fa-solid fa-check-circle text-6xl text-emerald-500 mb-2 drop-shadow-sm" />
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pembayaran Berhasil</h2>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold uppercase tracking-widest mb-0.5">Kembalian</p>
                  <p className="text-xl font-black">{fmt(lastTx.change)}</p>
                </div>
                <div className="flex w-full gap-3 mt-6">
                  <button onClick={() => setShowPrintPreview(true)} className="flex-1 bg-blue-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                    <i className="fa-solid fa-print" /> Cetak Struk
                  </button>
                  <button onClick={() => { setLastTx(null); setShowCheckout(false); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3.5 rounded-2xl">
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <p className="font-black text-sm text-slate-800 flex items-center gap-2"><i className="fa-solid fa-receipt text-indigo-600" /> Pembayaran</p>
                  <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold px-3 py-1 hover:bg-slate-100 rounded-xl">Batal</button>
                </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Item list */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Item Belanja</p>
                <div className="space-y-1.5">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center">
                      <span className="text-xs text-slate-700 flex-1 pr-2 truncate">{item.product.name} <span className="text-slate-400">×{item.qty}</span></span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{fmt(item.qty * item.product.sell_price)}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 text-xs">
                          <i className="fa-solid fa-minus-circle" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diskon */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diskon (Rp)</label>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center py-2 border-t border-b border-dashed border-slate-200">
                <span className="text-sm text-slate-500 font-semibold">Total Bayar</span>
                <span className="text-xl font-black text-indigo-600">{fmt(grandTotal)}</span>
              </div>

              {/* Metode */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'QRIS', 'Transfer'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${payMethod === m ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500'}`}
                    >
                      <i className={`fa-solid ${m === 'Tunai' ? 'fa-money-bill' : m === 'QRIS' ? 'fa-qrcode' : 'fa-credit-card'} text-base`} />
                      <span className="text-[10px] font-black">{m.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Uang Tunai */}
              {payMethod === 'Tunai' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Uang Diterima (Rp)</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[grandTotal, 20000, 50000, 100000].filter((v, i, a) => a.indexOf(v) === i && v >= grandTotal).slice(0, 4).map(v => (
                      <button key={v} onClick={() => setAmountPaid(v.toString())} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 text-[10px] font-black rounded-xl border border-slate-200 hover:border-indigo-300">
                        {fmt(v)}{v === grandTotal ? ' (Pas)' : ''}
                      </button>
                    ))}
                  </div>
                  {paid >= grandTotal && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-xs font-black text-emerald-700 uppercase">Kembalian</span>
                      <span className="text-base font-black text-emerald-700">{fmt(change)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Selesaikan */}
            <div className="p-4 pb-10 border-t border-slate-100">
              <button
                onClick={handleCheckout}
                disabled={payMethod === 'Tunai' && paid < grandTotal}
                className="w-full bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-check-circle" /> Selesaikan Transaksi
              </button>
            </div>
          </>
        )}
          </div>
        </div>
      )}

      {/* Manual Item Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowManual(false); }}>
           <div className="bg-white rounded-3xl w-full max-w-[280px] p-5 space-y-4 shadow-2xl">
              <h3 className="font-black text-slate-800 text-center uppercase tracking-wide"><i className="fa-solid fa-pen-to-square text-indigo-500 mr-2" />Item Manual</h3>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nama Item</label>
                <input type="text" placeholder="Cth: Jasa Servis" value={manName} onChange={e => setManName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Harga Jual (Rp)</label>
                <input type="text" placeholder="0" value={manPrice} onChange={e => setManPrice(formatNumberInput(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="flex gap-2 pt-2">
                 <button onClick={() => setShowManual(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase">Batal</button>
                 <button onClick={() => {
                   if (!manName || !manPrice) { showToast('Isi nama dan harga!'); return; }
                   addToCart({ id: 'man_'+Date.now(), store_id: activeStoreId, name: manName, category: 'Manual', sell_price: Number(manPrice.replace(/[^0-9]/g,'')), cost_price: 0, stock: 9999, is_active: true });
                   setShowManual(false); setManName(''); setManPrice('');
                 }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">Tambah</button>
              </div>
           </div>
        </div>
      )}

      {/* PRINT RECEIPT STRUCTURE (HIDDEN UNTIL window.print) */}
      <div className="hidden print:block w-full thermal-print-area">
        {lastTx && (
          <div className="w-[58mm] text-black font-mono text-[12px] leading-[1.2]">
             <div className="text-center mb-2">
                <h2 className="font-bold text-[14px] leading-tight">{storeName || 'POS KASIR'}</h2>
                <p className="text-[10px] whitespace-pre-wrap">{storeAddress || 'Toko Anda'}</p>
             </div>
             <div className="text-[10px] mb-2 border-b border-black border-dashed pb-2">
                <div className="flex justify-between"><span>Waktu:</span><span>{new Date().toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span>{kasirName}</span></div>
                <div className="flex justify-between"><span>Trx ID:</span><span>{lastTx.id ? lastTx.id.slice(0, 8) : 'NEW'}</span></div>
             </div>
             <div className="border-b border-dashed border-black mb-1 pb-1">
                {lastTx.items.map((it: any, idx: number) => (
                   <div key={idx} className="mb-1">
                      <div className="font-bold">{it.name}</div>
                      <div className="flex justify-between">
                         <span>{it.qty}x {fmt(it.price)}</span>
                         <span>{fmt(it.qty * it.price)}</span>
                      </div>
                   </div>
                ))}
             </div>
             <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>{fmt(lastTx.grandTotal)}</span>
             </div>
             <div className="flex justify-between">
                <span>TUNAI</span>
                <span>{fmt(lastTx.paid)}</span>
             </div>
             <div className="flex justify-between">
                <span>KEMBALI</span>
                <span>{fmt(lastTx.change)}</span>
             </div>
             <div className="text-center mt-3 text-[10px]">
                <p>Terima Kasih</p>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          body * { visibility: hidden; }
          .thermal-print-area, .thermal-print-area * { visibility: visible; }
          .thermal-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            padding: 2mm;
            margin: 0;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
