import React, { useState, useEffect } from 'react'
import { formatRupiah, cn, getCategories, getCategoriesConfig, getLocalDateString, getWallets, getWalletName, resolveWalletId } from '../lib/utils'
import type { Transaction, WalletNode } from '../types'
import { getKasirAccounts, type KasirAccount } from '../components/LoginScreen'
import { CubicLogo } from '../components/CubicLogo'

interface AturSaldoViewProps {
  active: boolean
  isPc?: boolean
  setActiveView: (v: string) => void
  showToast: (m: string) => void
  handleCreateCustomTransaction: (kategori: string, sumber_dana: string, tujuan_dana: string, nominal: number, admin_fee: number, keterangan: string) => Promise<void>
  storeName?: string
  storeSubtext?: string
  storePhoto?: string
  kasirName?: string
  kasirRole?: string
  setIsSidePanelOpen?: (v: boolean) => void
  transactions: Transaction[]
}

const IsiSaldoView: React.FC<AturSaldoViewProps> = (props) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [walletsFull, setWalletsFull] = useState<WalletNode[]>([])
  
  // Create wallets based on current walletsFull (only active/visible)
  const wallets = walletsFull.filter(w => !w.isHidden).map(w => w.id)

  useEffect(() => {
    if (props.active) {
      setWalletsFull(getWallets())
    }
  }, [props.active])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dayName = currentTime.toLocaleDateString('id-ID', { weekday: 'long' })
  const fullDate = currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const clockStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  // Calculate Balances ONLY for today
  const todayISO = getLocalDateString();
  const todayTxs = props.transactions.filter((t) => t.timestamp.startsWith(todayISO));

  const walletBalances: Record<string, number> = {};
  wallets.forEach(w => walletBalances[w] = 0);

  todayTxs.forEach(tx => {
    // Calculation logic uses core IDs behind the scenes
    if (tx.sumber_dana) {
      const src = resolveWalletId(tx.sumber_dana)
      if (walletBalances[src] !== undefined) {
        walletBalances[src] -= tx.nominal;
      }
    }
    if (tx.tujuan_dana) {
      const dst = resolveWalletId(tx.tujuan_dana)
      if (walletBalances[dst] !== undefined) {
        walletBalances[dst] += (tx.nominal + (tx.adminFee || 0));
      }
    }
  });

  const totalBalance = Object.values(walletBalances).reduce((a, b) => a + b, 0);

  const getIconForWallet = (name: string) => {
    const n = name.toUpperCase()
    if (n.includes('BANK') || n.includes('BRI')) return 'fa-building-columns text-blue-500'
    if (n.includes('DANA')) return 'fa-wallet text-sky-500'
    if (n.includes('SHOPEE')) return 'fa-bag-shopping text-orange-500'
    if (n.includes('KASIR')) return 'fa-cash-register text-emerald-500'
    if (n.includes('NON TUNAI') || n.includes('DOMPET')) return 'fa-qrcode text-purple-500'
    if (n.includes('KUOTA') || n.includes('PPOB')) return 'fa-bolt text-yellow-500'
    return 'fa-vault text-slate-500'
  }

  const [kasirCanModal, setKasirCanModal] = useState(() => localStorage.getItem('alphaPro_kasir_modal_access') !== 'false')
  const [showSettingModal, setShowSettingModal] = useState(false)
  const [showSuntikModal, setShowSuntikModal] = useState(false)
  const [showOperShiftModal, setShowOperShiftModal] = useState(false)
  const [showPindahSaldoModal, setShowPindahSaldoModal] = useState(false)
  const [showRiwayatMutasi, setShowRiwayatMutasi] = useState(false)
  
  const [targetKasir, setTargetKasir] = useState('')
  const [kasirList, setKasirList] = useState<KasirAccount[]>([])

  const [activeTab, setActiveTab] = useState<'dompet' | 'kategori'>('dompet')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatNewName, setEditCatNewName] = useState('')
  const [editCatNewFormat, setEditCatNewFormat] = useState<'nominal_admin' | 'modal_jual'>('nominal_admin')

  const saveWalletsFull = (newW: typeof walletsFull) => {
    localStorage.setItem('alphaPro_wallets_v2', JSON.stringify(newW))
    setWalletsFull(newW)
  }

  const handleSaveEditCategory = () => {
    if (!editingCatId) return
    const val = editCatNewName.trim().toUpperCase()
    if (!val) {
      props.showToast("Nama kategori tidak boleh kosong!")
      return
    }
    
    // update
    const nextW = walletsFull.map(w => {
      if (w.id === editingCatId) {
        return { ...w, name: val, format: editCatNewFormat }
      }
      return w
    })
    saveWalletsFull(nextW)
    setEditingCatId(null)
    props.showToast("Nama/Format Kategori Berhasil Disimpan")
  }

  const handleToggleHideWallet = (id: string, currentlyHidden: boolean) => {
    const nextW = walletsFull.map(w => {
      if (w.id === id) {
        if (w.isLocked) {
          props.showToast("Dompet utama ini tidak dapat disembunyikan!")
          return w
        }
        return { ...w, isHidden: !currentlyHidden }
      }
      return w
    })
    saveWalletsFull(nextW)
    props.showToast(currentlyHidden ? "Dompet ditampilkan kembali" : "Dompet disembunyikan")
  }

  const handleMoveUpCategory = (index: number) => {
    if (index === 0) return
    const newCats = [...walletsFull]
    const temp = newCats[index]
    newCats[index] = newCats[index - 1]
    newCats[index - 1] = temp
    saveWalletsFull(newCats)
    props.showToast("Berhasil dipindah ke atas")
  }

  const handleMoveDownCategory = (index: number) => {
    if (index === walletsFull.length - 1) return
    const newCats = [...walletsFull]
    const temp = newCats[index]
    newCats[index] = newCats[index + 1]
    newCats[index + 1] = temp
    saveWalletsFull(newCats)
    props.showToast("Berhasil dipindah ke bawah")
  }

  useEffect(() => {
    if (props.active) {
      const accounts = getKasirAccounts()
      const kasirArr = Object.values(accounts).filter(k => k.role === 'kasir' || k.role === 'owner') // include owner as they might take over
      setKasirList(kasirArr)
    }
  }, [props.active])

  const toggleKasirModalAccess = () => {
    const newVal = !kasirCanModal;
    setKasirCanModal(newVal);
    localStorage.setItem('alphaPro_kasir_modal_access', String(newVal));
    props.showToast(`Akses Modal Pagi untuk Kasir: ${newVal ? 'DI AKTIFKAN' : 'DI MATIKAN'}`);
  }

  const [modalType, setModalType] = useState('')
  const [modNominal, setModNominal] = useState('')
  const [modSumber, setModSumber] = useState('')
  const [modTujuan, setModTujuan] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Penyesuaian Saldo States
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustWalletId, setAdjustWalletId] = useState<string | null>(null)
  const [adjustType, setAdjustType] = useState<'tambah' | 'kurang'>('tambah')
  const [adjustNominal, setAdjustNominal] = useState('')
  const [adjustKeterangan, setAdjustKeterangan] = useState('')

  const parseNominalStr = (val: string) => {
    return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0
  }

  const handleSaveAdjust = async () => {
    if (!adjustWalletId) return;
    const nom = parseNominalStr(adjustNominal);
    if (nom <= 0) {
      props.showToast("Nominal penyesuaian tidak boleh kosong!");
      return;
    }
    setIsProcessing(true);
    try {
      const walletName = getWalletName(adjustWalletId, walletsFull);
      const direction = adjustType === 'tambah' ? 'Tambah (+)' : 'Kurang (-)';
      const finalKeterangan = adjustKeterangan.trim() || `Penyesuaian Saldo ${walletName} (${direction})`;
      
      if (adjustType === 'tambah') {
        await props.handleCreateCustomTransaction('Penyesuaian Saldo', '', adjustWalletId, nom, 0, finalKeterangan);
      } else {
        await props.handleCreateCustomTransaction('Penyesuaian Saldo', adjustWalletId, '', nom, 0, finalKeterangan);
      }
      props.showToast(`Penyesuaian Saldo ${walletName} Berhasil Diperbarui!`);
      setShowAdjustModal(false);
      setAdjustNominal('');
      setAdjustKeterangan('');
    } catch (e: any) {
      props.showToast("Gagal simpan penyesuaian: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveOperShift = async () => {
    const nom = parseNominalStr(modNominal);
    if (!modSumber || !modTujuan || nom <= 0) {
      props.showToast('Lengkapi Sumber, Tujuan dan Nominal yang valid!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Operan Shift', modSumber, modTujuan, nom, 0, 'OPER SHIFT SALDO');
    setIsProcessing(false);
    setShowOperShiftModal(false);
    setModNominal('');
  }

  const handleSavePindahSaldo = async () => {
    const nom = parseNominalStr(modNominal);
    if (!modSumber || !modTujuan || nom <= 0) {
      props.showToast('Lengkapi Sumber, Tujuan dan Nominal yang valid!')
      return;
    }
    if (modSumber === modTujuan) {
      props.showToast('Sumber dan Tujuan dana tidak boleh sama!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Pindah Saldo', modSumber, modTujuan, nom, 0, 'PINDAH SALDO ANTAR DOMPET');
    setIsProcessing(false);
    setShowPindahSaldoModal(false);
    setModNominal('');
  }

  const handleSaveModalAwal = async () => {
    const nom = parseNominalStr(modNominal);
    if (!modTujuan || nom <= 0) {
      props.showToast('Lengkapi Dompet dan Nominal yang valid!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Modal Awal', '', modTujuan, nom, 0, 'SET MODAL AWAL');
    setIsProcessing(false);
    setShowSettingModal(false);
    setModNominal('');
  }

  const handleSaveSuntikDana = async () => {
    const nom = parseNominalStr(modNominal);
    if (!modTujuan || nom <= 0) {
      props.showToast('Lengkapi Dompet dan Nominal yang valid!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Inject Saldo', '', modTujuan, nom, 0, 'SUNTIK DANA TAMBAHAN');
    setIsProcessing(false);
    setShowSuntikModal(false);
    setModNominal('');
  }

  return (
    <div className={cn("page-view hide-scrollbar bg-gray-50/50", !props.active && "hidden", props.isPc && "flex-grow h-full flex flex-col items-center")}>
      {/* HEADER IDENTIK BERANDA */}
      <div className={cn("relative bg-gradient-to-br from-blue-700 to-blue-800 rounded-b-[2rem] shadow-md w-full flex-shrink-0", props.isPc && "max-w-5xl rounded-b-3xl mb-8")} style={{ paddingBottom: '2.5rem' }}>
        <div className="px-5 pt-12 pb-4 flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {props.storePhoto ? (
                <img src={props.storePhoto} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-white/50 shadow-md" />
              ) : (
                <CubicLogo size={12} className="w-12 h-12" />
              )}
              <div>
                <h1 className="text-[13px] font-black text-white leading-tight uppercase tracking-widest">{props.storeName || 'APLIKASI CUBIC'}</h1>
                <p className="text-blue-200 text-[8px] font-bold uppercase tracking-tighter opacity-80">{props.storeSubtext || 'Pembukuan Agen brilink & Konter'}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-white text-[10px] font-black">{props.kasirName}</span>
                  <span className={cn("text-[7px] px-1.5 py-0.5 rounded-full font-black", props.kasirRole === 'owner' ? "bg-amber-400 text-amber-900" : "bg-white/25 text-white")}>
                    {props.kasirRole === 'owner' ? 'OWNER' : 'KASIR'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-blue-200 text-[8px] font-bold uppercase tracking-widest leading-none mb-1">{dayName}</p>
              <p className="text-white text-[10px] font-black tracking-tight leading-none mb-1">{fullDate}</p>
              <p className="text-blue-100 text-xs font-black tabular-nums tracking-widest">{clockStr}</p>
            </div>
          </div>

          {!props.isPc && (
            <button onClick={() => props.setIsSidePanelOpen?.(true)} className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-90 hover:bg-white/20 transition-all">
              <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
            </button>
          )}
        </div>
      </div>

      <div className={cn("px-4 pb-40 w-full", props.isPc && "max-w-5xl flex-grow")}>
        <div className="bg-gradient-to-br from-indigo-700 to-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 mb-6 relative overflow-hidden" style={{ marginTop: '-2.5rem', zIndex: 10 }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative flex justify-between items-end mb-4">
            <div>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-90"><i className="fa-solid fa-vault mr-1"></i> Total Saldo Keseluruhan</p>
              <h2 className="font-black text-3xl tracking-tight">{formatRupiah(totalBalance)}</h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <i className="fa-solid fa-wallet text-sm"></i>
            </div>
          </div>
          <div className={cn("relative grid gap-3 pt-3 border-t border-white/10 grid-cols-2")}>
            {(props.kasirRole === 'owner' || kasirCanModal) && (
              <button 
                onClick={() => { setShowSettingModal(true); setModTujuan(wallets[0]); setModNominal(''); }}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl py-2.5 px-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all"
              >
                <i className="fa-solid fa-sun text-[10px] sm:text-sm"></i>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Modal Pagi</span>
              </button>
            )}
            
            {props.kasirRole === 'owner' && (
              <button 
                onClick={() => { setShowSuntikModal(true); setModTujuan(wallets[0]); setModNominal(''); }}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-emerald-400 rounded-xl py-2.5 px-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all"
              >
                <i className="fa-solid fa-hand-holding-dollar text-[10px] sm:text-sm"></i>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Suntik Dana</span>
              </button>
            )}

            <button 
              onClick={() => { setShowOperShiftModal(true); setModSumber('Laci Kasir'); setModTujuan(''); setModNominal(''); }}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl py-2.5 px-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all"
            >
              <i className="fa-solid fa-money-bill-transfer text-[10px] sm:text-sm"></i>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Oper Shift</span>
            </button>
            <button 
              onClick={() => { setModalType('Pindah Saldo'); setShowPindahSaldoModal(true); setModSumber(''); setModTujuan(''); setModNominal(''); }}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl py-2.5 px-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all"
            >
              <i className="fa-solid fa-arrow-right-arrow-left text-[10px] sm:text-sm"></i>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Pindah Saldo</span>
            </button>
          </div>
        </div>

        {/* TAB SWITCHER OWNER */}
        {props.kasirRole === 'owner' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-6 border border-slate-200">
            <button 
              onClick={() => setActiveTab('dompet')}
              className={cn(
                "flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2", 
                activeTab === 'dompet' ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <i className="fa-solid fa-wallet text-[13px] text-blue-500"></i> Kelola Dompet & Saldo
            </button>
            <button 
              onClick={() => setActiveTab('kategori')}
              className={cn(
                "flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2", 
                activeTab === 'kategori' ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <i className="fa-solid fa-tags text-[13px] text-indigo-500"></i> Kelola Kategori Transaksi
            </button>
          </div>
        )}

        {(props.kasirRole !== 'owner' || activeTab === 'dompet') && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4 mt-2 px-1">
              <h3 className="font-black text-slate-800 text-[12px] uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-blue-600"></i> Daftar Dompet Digital
              </h3>
              <div className="flex items-center gap-2">
                {props.kasirRole === 'owner' && (
                  <button 
                    onClick={toggleKasirModalAccess}
                    className={cn("text-[9px] font-black px-2 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1", kasirCanModal ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}
                  >
                    <i className={cn("fa-solid", kasirCanModal ? "fa-toggle-on" : "fa-toggle-off")}></i>
                    KASIR MODAL: {kasirCanModal ? 'ON' : 'OFF'}
                  </button>
                )}
              </div>
            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wallets.map((wallet) => {
                const wName = getWalletName(wallet, walletsFull);
                return (
                  <div key={wallet} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <i className={cn("fa-solid text-xl", getIconForWallet(wName))}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 truncate">{wName}</h4>
                        <p className="text-sm font-black text-slate-800 truncate">{formatRupiah(walletBalances[wallet] || 0)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAdjustWalletId(wallet);
                        setAdjustType('tambah');
                        setAdjustNominal('');
                        setAdjustKeterangan('');
                        setShowAdjustModal(true);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all active:scale-95 shrink-0"
                      title="Penyesuaian Saldo"
                    >
                      <i className="fa-solid fa-scale-balanced text-sm"></i>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* RIWAYAT MUTASI TERAKHIR */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <button 
                onClick={() => setShowRiwayatMutasi(!showRiwayatMutasi)}
                className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 hover:bg-blue-50 rounded-xl"
              >
                {showRiwayatMutasi ? <><i className="fa-solid fa-chevron-up"></i> SEMBUNYIKAN 10 MUTASI TERAKHIR</> : <><i className="fa-solid fa-chevron-down"></i> LIHAT 10 MUTASI TERAKHIR</>}
              </button>
              {showRiwayatMutasi && (
                <div className="mt-3 text-left space-y-2 max-h-[300px] overflow-y-auto hide-scrollbar bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                  {(() => {
                    const mutasiTxs = props.transactions.filter(t => !['transfer', 'tarik tunai', 'aksesoris', 'topup', 'pembayaran', 'dana', 'flip', 'order kuota', 'pln', 'pulsa'].some(cat => t.kategori.toLowerCase().includes(cat))).slice(0, 10);
                    if (mutasiTxs.length === 0) return <p className="text-[10px] font-bold text-center text-slate-400 italic py-4">Belum ada riwayat mutasi / aset digital</p>;
                    return mutasiTxs.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-wrap gap-2">
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <i className="fa-solid fa-arrow-right-arrow-left text-slate-400 text-[8px]"></i> {t.kategori}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 max-w-[200px] truncate">{t.keterangan || '-'}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-[11px] font-black", t.kategori.includes('Real Aplikasi') ? 'text-fuchsia-600' : 'text-blue-700')}>
                            {formatRupiah(t.nominal).replace(',00', '')}
                          </span>
                          <p className="text-[8px] font-bold text-slate-400 mt-1">{t.timestamp.split('T')[0]} • {t.timestamp.split('T')[1].substring(0,5)}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 text-blue-800 p-5 rounded-2xl border border-blue-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><i className="fa-solid fa-circle-info"></i> Petunjuk Mutasi / Top-up</h4>
              <p className="text-[11px] leading-relaxed font-semibold opacity-90">Untuk melakukan perpindahan uang atau saldo antar dompet (misalnya: Setor tunai dari Laci Kasir ke BCA), Anda bisa menambahkannya melalui Form Transaksi di halaman Beranda dengan memilih kategori Pindah Saldo / Mutasi Antar Dompet.</p>
            </div>
          </div>
        )}

        {props.kasirRole === 'owner' && activeTab === 'kategori' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {editingCatId ? (
              /* EDIT KATEGORI CARD */
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-indigo-200 ring-2 ring-indigo-500/10">
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <i className="fa-solid fa-pen-to-square text-indigo-600"></i> Edit Kategori: {getWalletName(editingCatId, walletsFull)}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Kategori</label>
                    <input 
                      type="text" 
                      placeholder="Nama Kategori Baru" 
                      value={editCatNewName}
                      onChange={e => setEditCatNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEditCategory()}
                      disabled={walletsFull.find(w => w.id === editingCatId)?.isLocked}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {walletsFull.find(w => w.id === editingCatId)?.isLocked && (
                      <p className="text-[9px] font-bold text-amber-600 mt-1 px-1">Kategori utama tidak bisa diubah namanya.</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Pilihan Format Metode Penjualan</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setEditCatNewFormat('nominal_admin')} 
                        className={cn(
                          "border rounded-xl p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1", 
                          editCatNewFormat === 'nominal_admin' ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-102" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <p className="text-[10px] font-black uppercase">Format 1</p>
                        <p className="text-[8px] font-bold opacity-90 uppercase leading-normal">Nominal & Admin</p>
                      </button>

                      <button 
                        onClick={() => setEditCatNewFormat('modal_jual')} 
                        className={cn(
                          "border rounded-xl p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1", 
                          editCatNewFormat === 'modal_jual' ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-102" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <p className="text-[10px] font-black uppercase">Format 2</p>
                        <p className="text-[8px] font-bold opacity-90 uppercase leading-normal">Modal & Harga Jual</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingCatId(null)} 
                      className="flex-1 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSaveEditCategory} 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest shadow-md transition-colors"
                    >
                      Simpan Edit
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* DAFTAR KATEGORI CARD */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="font-black text-[12px] text-slate-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-tags text-indigo-600"></i> Daftar Kategori Saat Ini
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mb-4 px-1">Atur urutan penempatan atau edit kategori transaksi Anda.</p>
              
              <div className="space-y-2.5">
                {walletsFull.map((kat, idx) => {
                  const formatType = kat.format || 'nominal_admin'
                  return (
                    <div key={idx} className={cn("flex justify-between items-center bg-slate-50 hover:bg-slate-100/70 p-3 rounded-2xl border transition-colors", kat.isHidden ? "opacity-60 border-dashed border-slate-300" : "border-slate-200/60")}>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => handleMoveUpCategory(idx)} 
                            disabled={idx === 0}
                            className="text-slate-300 hover:text-indigo-600 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <i className="fa-solid fa-chevron-up text-xs"></i>
                          </button>
                          <button 
                            onClick={() => handleMoveDownCategory(idx)} 
                            disabled={idx === walletsFull.length - 1}
                            className="text-slate-300 hover:text-indigo-600 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                          </button>
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            {kat.name}
                            {kat.isHidden && <span className="ml-2 text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">TERSEMBUNYI</span>}
                          </span>
                          <p className="text-[9px] font-black text-indigo-600 uppercase mt-0.5 tracking-wider flex items-center gap-1">
                            <i className="fa-solid fa-circle-info text-[8px]"></i> Format: {formatType === 'modal_jual' ? 'Modal & Harga Jual' : 'Nominal & Admin'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleToggleHideWallet(kat.id, kat.isHidden)}
                          className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95", 
                            kat.isHidden ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          <i className={cn("fa-solid text-[10px]", kat.isHidden ? "fa-eye" : "fa-eye-slash")}></i>
                        </button>
                        <button 
                          onClick={() => {
                            setEditingCatId(kat.id);
                            setEditCatNewName(kat.name);
                            setEditCatNewFormat(formatType);
                          }}
                          className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 flex items-center justify-center transition-all active:scale-95"
                        >
                          <i className="fa-solid fa-pen text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {showSettingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setShowSettingModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="mb-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <i className="fa-solid fa-gear text-xl"></i>
              </div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Modal Pagi</h3>
              <p className="text-[11px] text-slate-500 font-bold tracking-widest">SET SALDO AWAL DOMPET</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-arrow-down-to-square"></i> Tujuan (Dompet)
                </label>
                <div className="relative">
                  <select
                    value={modTujuan}
                    onChange={(e) => setModTujuan(e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl px-4 py-3 text-xs font-bold outline-none appearance-none"
                  >
                    <option value="">- Pilih Dompet -</option>
                    {walletsFull.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-emerald-400 pointer-events-none"></i>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nominal Modal</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={modNominal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setModNominal(raw ? formatRupiah(parseInt(raw, 10)) : '');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveModalAwal}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-center flex justify-center items-center gap-2"
                >
                  {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>} Simpan Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOperShiftModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setShowOperShiftModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="mb-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <i className="fa-solid fa-people-arrows text-xl"></i>
              </div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Oper Shift</h3>
              <p className="text-[11px] text-slate-500 font-bold tracking-widest">OPER SHIFT SALDO</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-red-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Sumber Dana
                  </label>
                  <div className="relative">
                    <select
                      value={modSumber}
                      onChange={(e) => setModSumber(e.target.value)}
                      className="w-full bg-red-50 border border-red-100 text-red-900 rounded-xl px-3 py-3 text-[10px] font-bold outline-none appearance-none"
                    >
                      <option value="">- Pilih -</option>
                      {walletsFull.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-400 pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-down-to-square"></i> Tujuan Akhir
                  </label>
                  <div className="relative">
                    <select
                      value={modTujuan}
                      onChange={(e) => setModTujuan(e.target.value)}
                      className="w-full bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl px-3 py-3 text-[10px] font-bold outline-none appearance-none"
                    >
                      <option value="">- Pilih -</option>
                      {walletsFull.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 pointer-events-none"></i>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nominal Oper</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={modNominal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setModNominal(raw ? formatRupiah(parseInt(raw, 10)) : '');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveOperShift}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-center flex justify-center items-center gap-2"
                >
                  {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check-double"></i>} Proses Oper Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuntikModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setShowSuntikModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="mb-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <i className="fa-solid fa-hand-holding-dollar text-xl"></i>
              </div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Suntik Dana</h3>
              <p className="text-[11px] text-slate-500 font-bold tracking-widest text-center">TAMBAH SALDO BANK (INJECT)</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-arrow-down-to-square"></i> Tujuan (Dompet)
                </label>
                <div className="relative">
                  <select
                    value={modTujuan}
                    onChange={(e) => setModTujuan(e.target.value)}
                    className="w-full bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl px-4 py-3 text-xs font-bold outline-none appearance-none"
                  >
                    <option value="">- Pilih Dompet -</option>
                    {walletsFull.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-emerald-400 pointer-events-none"></i>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nominal Suntik</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={modNominal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setModNominal(raw ? formatRupiah(parseInt(raw, 10)) : '');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveSuntikDana}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-center flex justify-center items-center gap-2"
                >
                  {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>} Tambah Saldo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPindahSaldoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setShowPindahSaldoModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="mb-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <i className="fa-solid fa-arrow-right-arrow-left text-xl"></i>
              </div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Pindah Saldo</h3>
              <p className="text-[11px] text-slate-500 font-bold tracking-widest text-center">ANTAR KATEGORI ASET DIGITAL</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-red-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Sumber Asal
                  </label>
                  <div className="relative">
                    <select
                      value={modSumber}
                      onChange={(e) => setModSumber(e.target.value)}
                      className="w-full bg-red-50 border border-red-100 text-red-900 rounded-xl px-3 py-3 text-[10px] font-bold outline-none appearance-none"
                    >
                      <option value="">- Pilih -</option>
                      {walletsFull.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-400 pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-arrow-down-to-square"></i> Tujuan Akhir
                  </label>
                  <div className="relative">
                    <select
                      value={modTujuan}
                      onChange={(e) => setModTujuan(e.target.value)}
                      className="w-full bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl px-3 py-3 text-[10px] font-bold outline-none appearance-none"
                    >
                      <option value="">- Pilih -</option>
                      {walletsFull.filter(w => !w.isHidden).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 pointer-events-none"></i>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nominal Pindah</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={modNominal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setModNominal(raw ? formatRupiah(parseInt(raw, 10)) : '');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSavePindahSaldo}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-center flex justify-center items-center gap-2"
                >
                  {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check-double"></i>} Proses Pindah Saldo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && adjustWalletId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 relative border border-slate-100 dark:border-slate-700">
            <button 
              onClick={() => setShowAdjustModal(false)} 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200 active:scale-95 transition-all"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="mb-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <i className="fa-solid fa-scale-balanced text-xl"></i>
              </div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight text-center leading-none mb-1">Penyesuaian Saldo</h3>
              <p className="text-[10px] text-indigo-600 font-extrabold tracking-widest uppercase text-center">{getWalletName(adjustWalletId, walletsFull)}</p>
            </div>
            
            <div className="space-y-4">
              {/* Type selector (Plus or Minus) */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Aksi Penyesuaian</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjustType('tambah')}
                    className={cn(
                      "py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5",
                      adjustType === 'tambah'
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <i className="fa-solid fa-plus-circle text-[11px]"></i> Tambah (+)
                  </button>
                  <button
                    onClick={() => setAdjustType('kurang')}
                    className={cn(
                      "py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5",
                      adjustType === 'kurang'
                        ? "bg-rose-50 border-rose-300 text-rose-800 font-black shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <i className="fa-solid fa-minus-circle text-[11px]"></i> Kurang (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nominal Selisih</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 0"
                  value={adjustNominal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setAdjustNominal(raw ? formatRupiah(parseInt(raw, 10)) : '');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Keterangan / Alasan</label>
                <input 
                  type="text"
                  placeholder="Contoh: Penyesuaian selisih closing"
                  value={adjustKeterangan}
                  onChange={(e) => setAdjustKeterangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveAdjust}
                  disabled={isProcessing}
                  className={cn(
                    "w-full text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-center flex justify-center items-center gap-2",
                    adjustType === 'tambah' 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" 
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  )}
                >
                  {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-scale-balanced"></i>} Simpan Penyesuaian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default IsiSaldoView
