import React, { useRef, useState } from 'react'
import { formatInputRupiah, cn, getCategories, getCategoriesConfig, formatRupiah, getWalletName } from '../lib/utils'

interface TransactionFormProps {
  walletBalances?: Record<string, number>
  kategori: string
  setKategori: (v: string) => void
  sumberDana: string
  setSumberDana: (v: string) => void
  tujuanDana: string
  setTujuanDana: (v: string) => void
  nominal: string
  setNominal: (v: string) => void
  admin: string
  setAdmin: (v: string) => void
  keterangan: string
  setKeterangan: (v: string) => void
  onSave: () => void
  isSaving?: boolean
  presets?: any[]
  inputMode: 'NOMINAL_ADMIN' | 'MODAL_JUAL'
  setInputMode: (v: 'NOMINAL_ADMIN' | 'MODAL_JUAL') => void
  adminNonTunai: boolean
  setAdminNonTunai: (v: boolean) => void
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  walletBalances, kategori, setKategori, sumberDana, setSumberDana, tujuanDana, setTujuanDana, nominal, setNominal, admin, setAdmin, keterangan, setKeterangan, onSave, isSaving, presets,
  inputMode, setInputMode, adminNonTunai, setAdminNonTunai
}) => {
  const [showAutoTextModal, setShowAutoTextModal] = useState(false)
  const [autoTextSearchQuery, setAutoTextSearchQuery] = useState('')

  const keteranganRef = useRef<HTMLTextAreaElement>(null)
  const nominalRef = useRef<HTMLInputElement>(null)
  const adminRef = useRef<HTMLInputElement>(null)
  const submitBtnRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (nextRef.current) {
        nextRef.current.focus()
      }
    }
  }
  const wallets = getCategories() // returns IDs
  const configs = getCategoriesConfig()
  const isModalJual = inputMode === 'MODAL_JUAL'
  
  const handleCategoryChange = (kat: string) => {
    setKategori(kat)
    const findWallet = (search: string) => wallets.find(w => getWalletName(w).toUpperCase().includes(search.toUpperCase())) || ''
    const laciKasir = findWallet('LACI KASIR')
    const dompetPenampung = findWallet('DOMPET PENAMPUNG') || findWallet('NON TUNAI')
    const bankBri = findWallet('BANK BRI') || wallets.find(w => !getWalletName(w).toUpperCase().includes('KASIR') && !getWalletName(w).toUpperCase().includes('PENAMPUNG')) || ''

    if (kat === 'Transfer') {
      setSumberDana(bankBri)
      setTujuanDana(laciKasir)
    } else if (kat === 'Tarik Tunai') {
      setSumberDana(laciKasir)
      setTujuanDana(dompetPenampung)
    } else if (kat === 'Aksesoris') {
      setSumberDana('')
      setTujuanDana(laciKasir)
    }
  }

  React.useEffect(() => {
    // If user changes category initially, preset the nominal and admin
    if (!kategori) handleCategoryChange('Transfer')
  }, [])

  // Effect for handling Non Tunai changes for Aksesoris
  React.useEffect(() => {
    if (kategori === 'Aksesoris') {
      const findWallet = (search: string) => wallets.find(w => getWalletName(w).toUpperCase().includes(search.toUpperCase())) || ''
      setTujuanDana(adminNonTunai ? (findWallet('DOMPET PENAMPUNG') || findWallet('NON TUNAI')) : findWallet('LACI KASIR'));
    }
  }, [adminNonTunai, kategori])

  React.useEffect(() => {
    // If user types without picking auto-text, we no longer automatically inject text for nominals. 
    // This allows them to manually type descriptions.
  }, []);
  
  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target;
    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }

  const valModal = parseInt(nominal.replace(/[^0-9]/g, ''), 10) || 0
  const valJual = parseInt(admin.replace(/[^0-9]/g, ''), 10) || 0
  const labaCalculated = valJual - valModal

  const isUangDigital = kategori === 'Transfer' || (!['Tarik Tunai', 'Aksesoris'].includes(kategori) && kategori !== '')

  const filteredAutoTexts = React.useMemo(() => {
    if (!presets) return [];
    if (!autoTextSearchQuery.trim()) return presets;
    const query = autoTextSearchQuery.toLowerCase().trim();
    return presets.filter(item => 
      (item.keterangan || '').toLowerCase().includes(query)
    );
  }, [presets, autoTextSearchQuery]);

  const inlineMatchingAutoTexts = React.useMemo(() => {
    if (!presets || !keterangan.trim()) return [];
    const query = keterangan.toLowerCase().trim();
    return presets.filter(item => 
      (item.keterangan || '').toLowerCase().includes(query) && 
      (item.keterangan || '').toLowerCase() !== query
    );
  }, [presets, keterangan]);

  const handleSelectAutoTextPreset = (preset: any) => {
    setInputMode('MODAL_JUAL');
    setKeterangan(preset.keterangan);
    if (preset.modal) setNominal(formatInputRupiah(preset.modal.toString()));
    if (preset.jual) setAdmin(formatInputRupiah(preset.jual.toString()));
    setShowAutoTextModal(false);
    setAutoTextSearchQuery('');
  };

  return (
    <>
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col pt-6 relative" style={{ zIndex: 10 }}>
      {/* Main Form Fields */}
      <div className="space-y-4 pt-1">
        {/* Detail Category */}
        <div className="animate-in fade-in duration-200">
          <label className="block text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
            <i className="fa-solid fa-tags"></i> Kategori Layanan / Transaksi
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange('Transfer')}
              className={cn(
                "py-2.5 px-1 rounded-xl transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 border",
                isUangDigital ? "bg-indigo-500 text-yellow-300 border-indigo-600 shadow-md scale-[1.02]" : "bg-white text-slate-500 border-gray-100 hover:bg-indigo-50"
              )}
            >
              <i className="fa-solid fa-money-bill-transfer text-xs block mb-0.5"></i>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Uang Digital</span>
              {isUangDigital && <span className="text-[7px] font-bold mt-0.5 px-1 uppercase tracking-tighter text-indigo-100">Transfer, Topup, Pembayaran</span>}
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('Tarik Tunai')}
              className={cn(
                "py-2.5 px-1 rounded-xl transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 border",
                kategori === 'Tarik Tunai' ? "bg-indigo-500 text-yellow-300 border-indigo-600 shadow-md scale-[1.02]" : "bg-white text-slate-500 border-gray-100 hover:bg-indigo-50"
              )}
            >
              <i className="fa-solid fa-hand-holding-dollar text-xs block mb-0.5"></i>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Tarik Tunai</span>
              {kategori === 'Tarik Tunai' && <span className="text-[7px] font-bold mt-0.5 px-1 uppercase tracking-tighter text-indigo-100">Tarik Tunai Uang Nasabah</span>}
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('Aksesoris')}
              className={cn(
                "py-2.5 px-1 rounded-xl transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 border",
                kategori === 'Aksesoris' ? "bg-indigo-500 text-yellow-300 border-indigo-600 shadow-md scale-[1.02]" : "bg-white text-slate-500 border-gray-100 hover:bg-indigo-50"
              )}
            >
              <i className="fa-solid fa-box text-xs block mb-0.5"></i>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Aksesoris</span>
              {kategori === 'Aksesoris' && <span className="text-[7px] font-bold mt-0.5 px-1 uppercase tracking-tighter text-indigo-100">Penjualan Barang Fisik</span>}
            </button>
          </div>
        </div>

        {/* Sumber & Tujuan Row */}
        <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 shadow-inner">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[7px]"><i className="fa-solid fa-minus"></i></div>
                Uang Keluar Dari
              </label>
              <div className="relative mt-2">
                <select
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                  className="w-full form-input-modern bg-white border-red-100 text-red-950 text-[11px] appearance-none cursor-pointer focus:ring-red-500/20 focus:border-red-400 uppercase tracking-wide font-black shadow-sm"
                >
                  <option value="">- TAK ADA KELUAR -</option>
                  {wallets.map(w => <option key={w} value={w}>{getWalletName(w)}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-red-400 pointer-events-none"></i>
              </div>
            </div>
          
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[7px]"><i className="fa-solid fa-plus"></i></div>
              Uang Masuk Ke
            </label>
            <div className="relative mt-2">
              <select
                value={tujuanDana}
                onChange={(e) => setTujuanDana(e.target.value)}
                className="w-full form-input-modern bg-white border-emerald-100 text-emerald-950 text-[11px] appearance-none cursor-pointer focus:ring-emerald-500/20 focus:border-emerald-400 uppercase tracking-wide font-black shadow-sm"
              >
                <option value="">- TAK ADA MASUK -</option>
                {wallets.map(w => <option key={w} value={w}>{getWalletName(w)}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 pointer-events-none"></i>
            </div>
          </div>
        </div>

        {/* Keterangan & Presets */}
        <div className="relative group">
          <div className="flex justify-between items-center mb-1">
             <label className="text-[9px] font-black text-slate-400 tracking-wider uppercase">KETERANGAN / JURNAL</label>
              <button 
                type="button"
                onClick={() => setShowAutoTextModal(true)}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black text-[9px] uppercase px-2.5 py-1 rounded-lg border border-emerald-100 transition-all select-none active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i> Auto Teks
              </button>
          </div>
          <div className="relative">
            <textarea 
              ref={keteranganRef}
              rows={2} 
              placeholder="Contoh: Transfer Mandiri, Tarik Tunai BCA" 
              value={keterangan}
              onFocus={(e) => handleInputFocus(e as any)}
              onChange={(e) => setKeterangan(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, nominalRef)}
              className="w-full form-input-modern resize-none text-[11px] tracking-wide"
            ></textarea>
            
            {/* CUSTOM AUTO-TEKS INLINE SUGGESTIONS */}
            {inlineMatchingAutoTexts.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-emerald-50/75 border border-emerald-100/40 rounded-2xl space-y-2 animate-in fade-in max-h-48 overflow-y-auto select-none z-10 relative">
                <div className="flex items-center gap-1.5 px-0.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[8.5px] font-black text-emerald-700 uppercase tracking-widest">Saran Auto-Teks ({inlineMatchingAutoTexts.length}):</span>
                </div>
                <div className="grid grid-cols-1 divide-y divide-emerald-100/40 bg-white rounded-xl overflow-hidden border border-emerald-100/40">
                  {inlineMatchingAutoTexts.map((item: any, i: number) => {
                    const mVal = item.modal || 0;
                    const jVal = item.jual || 0;
                    const laba = jVal - mVal;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAutoTextPreset(item)}
                        className="w-full text-left p-2.5 hover:bg-emerald-50/40 flex justify-between items-center transition-all cursor-pointer select-none active:scale-[0.98]"
                      >
                        <div className="pr-2 text-left">
                          <p className="text-[10.5px] font-bold text-slate-800">{item.keterangan}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                            MODAL: {formatRupiah(mVal).replace('Rp ', '')} | JUAL: {formatRupiah(jVal).replace('Rp ', '')}
                          </span>
                          {laba > 0 && (
                            <p className="text-[7.5px] font-extrabold text-emerald-600 mt-0.5 uppercase tracking-wide font-mono">
                              LABA: +{formatRupiah(laba).replace('Rp ', '')}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex flex-1 rounded-xl bg-slate-100 p-1">
            <button 
              type="button"
              onClick={() => setInputMode('NOMINAL_ADMIN')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${inputMode === 'NOMINAL_ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              NOMINAL & ADMIN
            </button>
            <button 
              type="button"
              onClick={() => setInputMode('MODAL_JUAL')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${inputMode === 'MODAL_JUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              MODAL & JUAL
            </button>
          </div>
        </div>

        {/* Nominal & Admin Row */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative group w-[55%]">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
              {isModalJual ? 'Harga Modal (Nominal)' : 'Nominal'}
            </label>
            <div className="absolute left-3.5 top-[34px] flex items-center justify-center p-0.5 rounded-md">
              <span className="text-[12px] font-black text-gray-400 select-none leading-none">Rp</span>
            </div>
            <input 
              ref={nominalRef}
              type="text" 
              inputMode="numeric" 
              placeholder="0" 
              value={nominal}
              onFocus={handleInputFocus as any}
              onChange={(e) => setNominal(formatInputRupiah(e.target.value))}
              onKeyDown={(e) => handleKeyDown(e, adminRef)}
              className="w-full form-input-modern text-right pr-4 pl-10 text-[14px]"
            />
          </div>
          <div className="relative group w-[45%]">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 flex items-center justify-between">
              <span className="truncate">{isModalJual ? 'Harga Jual' : 'Admin'}</span>
              <label className="flex items-center gap-1 cursor-pointer bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                <input 
                  type="checkbox" 
                  checked={adminNonTunai} 
                  onChange={(e) => setAdminNonTunai(e.target.checked)} 
                  className="rounded text-purple-600 focus:ring-purple-500 w-2.5 h-2.5 bg-white border-purple-200" 
                />
                <span className="text-[7.5px] text-purple-600 font-bold uppercase tracking-wider">Non Tunai</span>
              </label>
            </label>
            <div className="absolute left-3.5 top-[34px] flex items-center justify-center p-0.5 rounded-md">
              <span className="text-[12px] font-black text-gray-400 select-none leading-none">Rp</span>
            </div>
            <input 
              ref={adminRef}
              type="text" 
              inputMode="numeric" 
              placeholder="0" 
              value={admin}
              onFocus={handleInputFocus as any}
              onChange={(e) => setAdmin(formatInputRupiah(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitBtnRef.current?.focus();
                }
              }}
              className="w-full form-input-modern text-right pr-4 pl-10 text-[14px]"
            />
          </div>
        </div>

        {/* Dynamic Profit Calculation Info */}
        {isModalJual && (
          <div className="px-1 -mt-2">
            {valJual > 0 && labaCalculated > 0 ? (
              <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1 animate-pulse">
                <i className="fa-solid fa-circle-check"></i> Estimasi Keuntungan / Laba: +{formatRupiah(labaCalculated)}
              </p>
            ) : valJual > 0 ? (
              <p className="text-[10px] font-black text-red-500 flex items-center gap-1">
                <i className="fa-solid fa-triangle-exclamation"></i> Harga Jual harus lebih besar dari Modal!
              </p>
            ) : null}
          </div>
        )}


        {/* Submit */}
        <button 
          ref={submitBtnRef}
          onClick={() => onSave()} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave();
            }
          }}
          disabled={isSaving}
          className="w-full mt-4 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white text-[10px] sm:text-xs font-black py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane animate-bounce-slow"></i>}
          {isSaving ? 'MEMPROSES...' : 'PROSES TRANSAKSI'}
        </button>
      </div>
      </div>
      
      {/* MODAL AUTO-TEKS SEARCH POPUP */}
      {showAutoTextModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <div className="bg-emerald-600 p-5 text-white relative shrink-0">
              <button 
                onClick={() => {
                  setShowAutoTextModal(false);
                  setAutoTextSearchQuery('');
                }} 
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full w-6 h-6 flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md">
                 <i className="fa-solid fa-wand-magic-sparkles text-white text-lg"></i>
              </div>
              <h3 className="font-black text-xs tracking-widest uppercase">CARI AUTO-TEKS</h3>
              <p className="text-[10px] text-emerald-100/90 font-medium mt-1">Pilih preset untuk menginput Keterangan, Modal, & Harga Jual otomatis.</p>
            </div>
            
            {/* Input pencarian */}
            <div className="p-3 border-b border-slate-150 bg-slate-50 flex items-center gap-2.5 shrink-0">
              <i className="fa-solid fa-search text-emerald-500 shrink-0"></i>
              <input 
                type="text"
                autoFocus
                value={autoTextSearchQuery}
                onChange={(e) => setAutoTextSearchQuery(e.target.value)}
                placeholder="Cari preset auto-teks..."
                className="w-full text-xs font-bold bg-transparent outline-none border-none text-slate-800 placeholder:text-slate-400"
              />
              {autoTextSearchQuery && (
                <button 
                  onClick={() => setAutoTextSearchQuery('')} 
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Hasil list */}
            <div className="p-2 divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[40vh] bg-white font-sans">
              {filteredAutoTexts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <p className="font-bold">Tidak ada preset auto-teks.</p>
                  <button 
                    onClick={() => {
                      setShowAutoTextModal(false);
                      // User should configure in settings
                    }}
                    className="mt-3 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
                  >
                    Atur Auto-Teks di Pengaturan
                  </button>
                </div>
              ) : (
                filteredAutoTexts.map((item: any, i: number) => {
                  const mVal = item.modal || 0;
                  const jVal = item.jual || 0;
                  const laba = jVal - mVal;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectAutoTextPreset(item)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 rounded-2xl flex justify-between items-center transition-all cursor-pointer select-none active:scale-[0.98] mt-0.5"
                    >
                      <div className="pr-2 text-left">
                        <p className="text-[10px] font-extrabold text-slate-800 leading-tight">{item.keterangan}</p>
                        {laba > 0 && (
                          <p className="text-[8px] font-black text-emerald-600 mt-1 uppercase tracking-wider font-mono">
                            LABA: +{formatRupiah(laba).replace('Rp ', '')}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex flex-col gap-0.5 font-mono">
                        <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded leading-none text-center">
                          M: {formatRupiah(mVal).replace('Rp ', '')}
                        </span>
                        <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded leading-none text-center mt-0.5">
                          J: {formatRupiah(jVal).replace('Rp ', '')}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100/60 flex items-center justify-between shrink-0 text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">
              <span>Total: {filteredAutoTexts.length} preset</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TransactionForm
