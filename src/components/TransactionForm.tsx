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
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  walletBalances, kategori, setKategori, sumberDana, setSumberDana, tujuanDana, setTujuanDana, nominal, setNominal, admin, setAdmin, keterangan, setKeterangan, onSave, isSaving
}) => {
  const [isKetAuto, setIsKetAuto] = useState(true)
  const [isNonTunai, setIsNonTunai] = useState(false)
  const wallets = getCategories() // returns IDs
  const configs = getCategoriesConfig()
  const isModalJual = configs[kategori] === 'modal_jual'
  
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
      const findWallet = (search: string) => wallets.find(w => w.toUpperCase().includes(search.toUpperCase())) || ''
      setTujuanDana(isNonTunai ? (findWallet('DOMPET PENAMPUNG') || findWallet('NON TUNAI')) : findWallet('LACI KASIR'));
    }
  }, [isNonTunai, kategori])

  React.useEffect(() => {
    if (isKetAuto) {
      let autoText = `${kategori} `;
      if (nominal && nominal !== '0') {
        if (isModalJual) {
          autoText += `MODAL ${nominal} JUAL ${admin || '0'}`;
        } else {
          autoText += `${nominal}`;
        }
      }
      if (isNonTunai) {
        autoText += ' [NON_TUNAI]';
      }
      setKeterangan(autoText.toUpperCase());
    }
  }, [isKetAuto, kategori, nominal, admin, isModalJual, setKeterangan, isNonTunai]);
  
  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target;
    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }

  const valModal = parseInt(nominal.replace(/[^0-9]/g, ''), 10) || 0
  const valJual = parseInt(admin.replace(/[^0-9]/g, ''), 10) || 0
  const labaCalculated = valJual - valModal

  return (
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
                kategori === 'Transfer' || (!['Tarik Tunai', 'Aksesoris'].includes(kategori) && kategori !== '') ? "bg-indigo-500 text-white border-indigo-600 shadow-md scale-[1.02]" : "bg-white text-slate-500 border-gray-100 hover:bg-indigo-50"
              )}
            >
              <i className="fa-solid fa-money-bill-transfer text-xs block mb-0.5"></i>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Uang Digital</span>
              <span className={cn("text-[7px] font-bold mt-0.5 px-1 uppercase tracking-tighter", kategori === 'Transfer' || (!['Tarik Tunai', 'Aksesoris'].includes(kategori) && kategori !== '') ? "text-indigo-100" : "text-slate-400")}>Transfer, Topup, Pembayaran</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('Tarik Tunai')}
              className={cn(
                "py-2.5 px-1 rounded-xl transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 border",
                kategori === 'Tarik Tunai' ? "bg-indigo-500 text-white border-indigo-600 shadow-md scale-[1.02]" : "bg-white text-slate-500 border-gray-100 hover:bg-indigo-50"
              )}
            >
              <i className="fa-solid fa-hand-holding-dollar text-xs block mb-0.5"></i>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Tarik Tunai</span>
              <span className={cn("text-[7px] font-bold mt-0.5 px-1 uppercase tracking-tighter", kategori === 'Tarik Tunai' ? "text-indigo-100" : "text-slate-400")}>Tarik Tunai Uang Nasabah</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('Aksesoris')}
              className={cn(
                "py-2.5 px-1 rounded-xl transition-all duration-300 text-center flex flex-col items-center justify-center gap-1 border",
                kategori === 'Aksesoris' ? "bg-indigo-500 text-white border-indigo-600 shadow-md scale-[1.02]" : "bg-white text-slate-500 border-gray-100 hover:bg-indigo-50"
              )}
            >
              <i className="fa-solid fa-box text-xs block mb-0.5"></i>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Aksesoris</span>
              <span className={cn("text-[7px] font-bold mt-0.5 px-1 uppercase tracking-tighter", kategori === 'Aksesoris' ? "text-indigo-100" : "text-slate-400")}>Penjualan Barang Fisik</span>
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
              type="text" 
              inputMode="numeric" 
              placeholder="0" 
              value={nominal}
              onFocus={handleInputFocus}
              onChange={(e) => setNominal(formatInputRupiah(e.target.value))}
              className="w-full form-input-modern text-right pr-4 pl-10 text-[14px]"
            />
          </div>
          <div className="relative group w-[45%]">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 flex items-center justify-between">
              <span className="truncate">{isModalJual ? 'Harga Jual' : 'Admin'}</span>
              <label className="flex items-center gap-1 cursor-pointer bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                <input 
                  type="checkbox" 
                  checked={isNonTunai} 
                  onChange={(e) => setIsNonTunai(e.target.checked)} 
                  className="rounded text-purple-600 focus:ring-purple-500 w-2.5 h-2.5 bg-white border-purple-200" 
                />
                <span className="text-[7.5px] text-purple-600 font-bold uppercase tracking-wider">Non Tunai</span>
              </label>
            </label>
            <div className="absolute left-3.5 top-[34px] flex items-center justify-center p-0.5 rounded-md">
              <span className="text-[12px] font-black text-gray-400 select-none leading-none">Rp</span>
            </div>
            <input 
              type="text" 
              inputMode="numeric" 
              placeholder="0" 
              value={admin}
              onFocus={handleInputFocus}
              onChange={(e) => setAdmin(formatInputRupiah(e.target.value))}
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

        {/* Keterangan */}
        <div className="relative group">
          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-1 flex justify-between items-center">
            <span>Keterangan</span>
            <button 
              onClick={() => setIsKetAuto(!isKetAuto)} 
              className={cn("text-[8px] px-2 py-0.5 rounded-full transition-all flex items-center gap-1", isKetAuto ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}
              tabIndex={-1}
            >
              <i className={cn("fa-solid", isKetAuto ? "fa-robot" : "fa-keyboard")}></i>
              {isKetAuto ? "Auto" : "Manual"}
            </button>
          </label>
          <textarea 
            rows={2} 
            placeholder="Contoh: Transfer Mandiri, Tarik Tunai BCA" 
            value={keterangan}
            onFocus={(e) => { setIsKetAuto(false); handleInputFocus(e); }}
            onChange={(e) => setKeterangan(e.target.value)}
            className="w-full form-input-modern resize-none text-[11px] tracking-wide"
          ></textarea>
        </div>

        {/* Submit */}
        <button 
          onClick={() => onSave()} 
          disabled={isSaving}
          className="w-full mt-4 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white text-[10px] sm:text-xs font-black py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane animate-bounce-slow"></i>}
          {isSaving ? 'MEMPROSES...' : 'PROSES TRANSAKSI'}
        </button>
      </div>
    </div>
  )
}

export default TransactionForm
