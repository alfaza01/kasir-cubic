import React, { useState, useEffect } from 'react'
import { formatRupiah, formatInputRupiah, cn, getCategories, getCategoriesConfig, getLocalDateString, getWallets, getWalletName, resolveWalletId, isDigitalPenjualan } from '../lib/utils'
import type { Transaction, WalletNode } from '../types'
import { getKasirAccounts, type KasirAccount } from '../components/LoginScreen'
import { CubaLogo } from '../components/CubaLogo'

interface AturSaldoViewProps {
  active: boolean
  isPc?: boolean
  setActiveView: (v: string) => void
  showToast: (m: string) => void
  handleCreateCustomTransaction: (kategori: string, sumber_dana: string, tujuan_dana: string, nominal: number, admin_fee: number, keterangan: string, kasirIdOverride?: string) => Promise<void>
  storeName?: string
  storeSubtext?: string
  storePhoto?: string
  kasirName?: string
  kasirRole?: string
  setIsSidePanelOpen?: (v: boolean) => void
  transactions: Transaction[]
  onTriggerSync?: () => void
  kasirList?: Record<string, KasirAccount>
  currentUsername?: string
  onConfirm?: (title: string, message: string, onConfirm: () => void) => void
  activeStoreId?: string
  saldoBank?: number
  saldoReal?: number
  onUpdateSaldoReal?: (nominal: number, keterangan: string) => void
  isSaving?: boolean
}

const AsetSaldoView: React.FC<AturSaldoViewProps> = (props) => {
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

  // Calculate Cumulative Balances
  const walletBalances: Record<string, number> = {};
  wallets.forEach(w => walletBalances[w] = 0);

  props.transactions.forEach(tx => {
    let sumber = tx.sumber_dana ? resolveWalletId(tx.sumber_dana) : null;
    let tujuan = tx.tujuan_dana ? resolveWalletId(tx.tujuan_dana) : null;

    if (!tx.sumber_dana && !tx.tujuan_dana) {
      if (tx.kategori === 'Isi Saldo Bank') tujuan = 'Bank01';
      else if (tx.kategori === 'Isi Modal Tunai Kasir') tujuan = 'Bank08';
      else if (isDigitalPenjualan(tx.kategori)) { sumber = 'Bank01'; tujuan = 'Bank08'; }
      else if (tx.kategori === 'Tarik Tunai') { sumber = 'Bank08'; tujuan = 'Bank09'; }
      else if (tx.kategori === 'Aksesoris') tujuan = 'Bank08';
    }

    if (sumber) {
      if (walletBalances[sumber] !== undefined) {
        walletBalances[sumber] -= tx.nominal;
      }
    }
    
    const ket = (tx.keterangan || '').toUpperCase();
    const isAksesorisTx = tx.kategori === 'Aksesoris';
    const isNonTunaiTx = ket.includes('[NON_TUNAI]') || (isAksesorisTx && (tx.tujuan_dana || '').toUpperCase().includes('PENAMPUNG'));
    const adminFee = tx.admin_fee || tx.adminFee || 0;

    if (tujuan) {
      if (walletBalances[tujuan] !== undefined) {
        walletBalances[tujuan] += tx.nominal;
      }
    }
    
    if (isNonTunaiTx) {
      if (walletBalances['Bank09'] !== undefined) {
        walletBalances['Bank09'] += adminFee;
      }
    } else {
      if (walletBalances['Bank08'] !== undefined) {
        walletBalances['Bank08'] += adminFee;
      }
    }
  });

  const totalBalance = Object.values(walletBalances).reduce((a, b) => a + b, 0);

  // Calculate cumulative real balance for each wallet
  const walletRealBalances: Record<string, number> = {};
  props.transactions.forEach(t => {
    const katLower = t.kategori.toLowerCase();
    if (t.kategori === 'Isi Saldo Real Aplikasi' || katLower === 'saldo real aplikasi') {
      const appName = (t.keterangan || '').trim().toUpperCase();
      if (appName) {
        walletRealBalances[appName] = (walletRealBalances[appName] || 0) + t.nominal;
      }
    }
  });
  wallets.forEach(w => {
    const wNameUpper = getWalletName(w, walletsFull).trim().toUpperCase();
    walletRealBalances[w] = walletRealBalances[wNameUpper] || 0;
  });

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
  const [kasirCanTambahSaldo, setKasirCanTambahSaldo] = useState(() => localStorage.getItem('alphaPro_kasir_tambah_saldo_access') === 'true')
  const [showSettingModal, setShowSettingModal] = useState(false)
  const [showSuntikModal, setShowSuntikModal] = useState(false)
  const [showOperShiftModal, setShowOperShiftModal] = useState(false)
  const [showPindahSaldoModal, setShowPindahSaldoModal] = useState(false)
  const [showRiwayatMutasi, setShowRiwayatMutasi] = useState(false)

  // Kirim Saldo ke Kasir Lain (Balance Handover)
  const [showKirimSaldoModal, setShowKirimSaldoModal] = useState(false)
  const [selectedSaldoTargetKasir, setSelectedSaldoTargetKasir] = useState('')
  const [isSendingSaldo, setIsSendingSaldo] = useState(false)
  
  const [targetKasir, setTargetKasir] = useState('')
  const [kasirList, setKasirList] = useState<(KasirAccount & { username: string })[]>([])

  const [activeTab, setActiveTab] = useState<'dompet' | 'kategori'>('dompet')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatNewName, setEditCatNewName] = useState('')
  const [editCatNewFormat, setEditCatNewFormat] = useState<'nominal_admin' | 'modal_jual'>('nominal_admin')

  const saveWalletsFull = (newW: typeof walletsFull) => {
    localStorage.setItem('alphaPro_wallets_v2', JSON.stringify(newW))
    setWalletsFull(newW)
    if (props.onTriggerSync) props.onTriggerSync()
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
      const accounts = props.kasirList && Object.keys(props.kasirList).length > 0 
        ? props.kasirList 
        : getKasirAccounts()
      const kasirArr = Object.entries(accounts)
        .map(([username, acc]) => ({ ...acc, username }))
        .filter(k => k.role === 'kasir' || k.role === 'owner')
      setKasirList(kasirArr as any)
    }
  }, [props.active, props.kasirList])

  const toggleKasirModalAccess = () => {
    const newVal = !kasirCanModal;
    setKasirCanModal(newVal);
    localStorage.setItem('alphaPro_kasir_modal_access', String(newVal));
    props.showToast(`Akses Modal Pagi untuk Kasir: ${newVal ? 'DI AKTIFKAN' : 'DI MATIKAN'}`);
  }

  const toggleKasirTambahSaldoAccess = () => {
    const newVal = !kasirCanTambahSaldo;
    setKasirCanTambahSaldo(newVal);
    localStorage.setItem('alphaPro_kasir_tambah_saldo_access', String(newVal));
    props.showToast(`Akses Tambah Saldo untuk Kasir: ${newVal ? 'DI AKTIFKAN' : 'DI MATIKAN'}`);
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
  const [showSaldoRealModal, setShowSaldoRealModal] = useState(false)
  const [inputSaldoReal, setInputSaldoReal] = useState('')
  const [inputSaldoRealKeterangan, setInputSaldoRealKeterangan] = useState('')

  const parseNominalStr = (val: string) => {
    return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0
  }

  const renderTargetKasirSelector = () => {
    if (props.kasirRole !== 'owner') return null;
    return (
      <div className="mb-4">
        <label className="block text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
          <i className="fa-solid fa-user-tie"></i> Target Kasir
        </label>
        <div className="relative">
          <select
            value={targetKasir}
            onChange={(e) => setTargetKasir(e.target.value)}
            className="w-full bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl px-4 py-3 text-xs font-bold outline-none appearance-none"
          >
            <option value="">- Pilih Kasir -</option>
            {kasirList.map(k => <option key={k.username} value={k.username}>{k.name} ({k.role})</option>)}
          </select>
          <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-400 pointer-events-none"></i>
        </div>
      </div>
    );
  };

  const handleSaveAdjust = async () => {
    if (props.kasirRole === 'owner' && !targetKasir) {
      props.showToast("Pilih Target Kasir terlebih dahulu!");
      return;
    }
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
        await props.handleCreateCustomTransaction('Penyesuaian Saldo', '', adjustWalletId, nom, 0, finalKeterangan, targetKasir || undefined);
      } else {
        await props.handleCreateCustomTransaction('Penyesuaian Saldo', adjustWalletId, '', nom, 0, finalKeterangan, targetKasir || undefined);
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
    if (props.kasirRole === 'owner' && !targetKasir) {
      props.showToast('Pilih Target Kasir terlebih dahulu!');
      return;
    }
    const nom = parseNominalStr(modNominal);
    if (!modSumber || !modTujuan || nom <= 0) {
      props.showToast('Lengkapi Sumber, Tujuan dan Nominal yang valid!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Operan Shift', modSumber, modTujuan, nom, 0, 'OPER SHIFT SALDO', targetKasir || undefined);
    setIsProcessing(false);
    setShowOperShiftModal(false);
    setModNominal('');
  }

  const handleSavePindahSaldo = async () => {
    if (props.kasirRole === 'owner' && !targetKasir) {
      props.showToast('Pilih Target Kasir terlebih dahulu!');
      return;
    }
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
    await props.handleCreateCustomTransaction('Pindah Saldo', modSumber, modTujuan, nom, 0, 'PINDAH SALDO ANTAR DOMPET', targetKasir || undefined);
    setIsProcessing(false);
    setShowPindahSaldoModal(false);
    setModNominal('');
  }

  const handleSaveModalAwal = async () => {
    if (props.kasirRole === 'owner' && !targetKasir) {
      props.showToast('Pilih Target Kasir terlebih dahulu!');
      return;
    }
    const nom = parseNominalStr(modNominal);
    if (!modTujuan || nom <= 0) {
      props.showToast('Lengkapi Dompet dan Nominal yang valid!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Modal Awal', '', modTujuan, nom, 0, 'SET MODAL AWAL', targetKasir || undefined);
    setIsProcessing(false);
    setShowSettingModal(false);
    setModNominal('');
  }

  const handleSaveSuntikDana = async () => {
    if (props.kasirRole === 'owner' && !targetKasir) {
      props.showToast('Pilih Target Kasir terlebih dahulu!');
      return;
    }
    const nom = parseNominalStr(modNominal);
    if (!modTujuan || nom <= 0) {
      props.showToast('Lengkapi Dompet dan Nominal yang valid!')
      return;
    }
    setIsProcessing(true);
    await props.handleCreateCustomTransaction('Inject Saldo', '', modTujuan, nom, 0, 'TAMBAH SALDO BANK', targetKasir || undefined);
    setIsProcessing(false);
    setShowSuntikModal(false);
    setModNominal('');
  }

  // Kirim Saldo ke Kasir Lain (Balance Handover)
  const handleKirimSaldo = async () => {
    if (!selectedSaldoTargetKasir) {
      props.showToast('Pilih kasir tujuan terlebih dahulu!')
      return
    }
    if (selectedSaldoTargetKasir === (props.currentUsername || '')) {
      props.showToast('Tidak bisa kirim ke diri sendiri!')
      return
    }

    const confirm = props.onConfirm || ((_, __, cb) => { if (window.confirm('Kirim data saldo ke kasir tujuan?')) cb() })

    confirm(
      'KIRIM SALDO KE KASIR',
      `Apakah Anda yakin ingin mengirim data saldo akhir kepada kasir ${(props.kasirList?.[selectedSaldoTargetKasir]?.name || selectedSaldoTargetKasir).toUpperCase()}?`,
      async () => {
        setIsSendingSaldo(true)
        try {
          const receiverName = (props.kasirList?.[selectedSaldoTargetKasir]?.name || selectedSaldoTargetKasir).toUpperCase()
          for (const walletId of wallets) {
            const bal = walletBalances[walletId] || 0
            if (bal > 0) {
              // 1. Kurangi dari pengirim
              await props.handleCreateCustomTransaction('Operan Shift', walletId, '', bal, 0, `KIRIM SALDO KE ${receiverName}`, props.currentUsername)
              // 2. Tambahkan ke penerima
              await props.handleCreateCustomTransaction('Operan Shift', '', walletId, bal, 0, `TERIMA SALDO DARI ${props.kasirName || 'PENGIRIM'}`, selectedSaldoTargetKasir)
            }
          }
          props.showToast(`✅ Saldo berhasil dikirim ke ${receiverName}!`)
          setShowKirimSaldoModal(false)
          setSelectedSaldoTargetKasir('')
          if (props.onTriggerSync) props.onTriggerSync()
        } catch (err: any) {
          console.error(err)
          props.showToast(`Gagal kirim saldo: ${err.message || err}`)
        } finally {
          setIsSendingSaldo(false)
        }
      }
    )
  }

  return (<>
    <div className={cn("page-view hide-scrollbar bg-gray-50/50 overflow-y-auto pb-24", !props.active && "hidden", props.isPc && "flex-grow h-full flex flex-col items-center")}>
      {/* HEADER IDENTIK BERANDA */}
      <div className={cn("relative bg-gradient-to-br from-blue-700 to-blue-800 rounded-b-[2rem] shadow-md w-full flex-shrink-0", props.isPc && "max-w-5xl rounded-b-3xl mb-8")} style={{ paddingBottom: '2.5rem' }}>
        <div className="px-5 pt-12 pb-4 flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {props.storePhoto ? (
                <img src={props.storePhoto} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-white/50 shadow-md" />
              ) : (
                <CubaLogo size={12} className="w-12 h-12" />
              )}
              <div>
                <h1 className="text-[13px] font-black text-white leading-tight uppercase tracking-widest">{props.storeName || 'Kasir Cuba'}</h1>
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
            
            {(props.kasirRole === 'owner' || kasirCanTambahSaldo) && (
              <button 
                onClick={() => { setShowSuntikModal(true); setModTujuan(wallets[0]); setModNominal(''); }}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-emerald-400 rounded-xl py-2.5 px-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all"
              >
                <i className="fa-solid fa-hand-holding-dollar text-[10px] sm:text-sm"></i>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Tambah Saldo</span>
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
            {props.kasirList && Object.keys(props.kasirList).filter(u => u !== props.currentUsername).length > 0 && (
              <button 
                onClick={() => { setShowKirimSaldoModal(true); setSelectedSaldoTargetKasir(''); }}
                className="bg-violet-500/80 hover:bg-violet-500 active:bg-violet-600 text-white rounded-xl py-2.5 px-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all border border-violet-400/50"
              >
                <i className="fa-solid fa-paper-plane text-[10px] sm:text-sm"></i>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">Kirim Saldo</span>
              </button>
            )}
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
                  <>
                  <button 
                    onClick={toggleKasirModalAccess}
                    className={cn("text-[9px] font-black px-2 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1", kasirCanModal ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}
                  >
                    <i className={cn("fa-solid", kasirCanModal ? "fa-toggle-on" : "fa-toggle-off")}></i>
                    KASIR MODAL: {kasirCanModal ? 'ON' : 'OFF'}
                  </button>
                  <button 
                    onClick={toggleKasirTambahSaldoAccess}
                    className={cn("text-[9px] font-black px-2 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1", kasirCanTambahSaldo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}
                  >
                    <i className={cn("fa-solid", kasirCanTambahSaldo ? "fa-toggle-on" : "fa-toggle-off")}></i>
                    TAMBAH SALDO: {kasirCanTambahSaldo ? 'ON' : 'OFF'}
                  </button>
                  </>
                )}
              </div>
            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wallets.map((wallet) => {
                const wName = getWalletName(wallet, walletsFull);
                const isDigitalWallet = wallet !== 'Bank08' && wallet !== 'Bank09';
                const hasReal = isDigitalWallet && walletRealBalances[wallet] !== undefined;
                const realVal = walletRealBalances[wallet] || 0;
                const bookVal = walletBalances[wallet] || 0;
                const diff = realVal - bookVal;

                return (
                  <div key={wallet} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between gap-3 group relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-inner">
                          <i className={cn("fa-solid text-base", getIconForWallet(wName))}></i>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 truncate">{wName}</h4>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{formatRupiah(bookVal)}</p>
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
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-indigo-950 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all active:scale-95 shrink-0 border border-slate-100 dark:border-slate-800"
                        title="Penyesuaian Saldo Buku"
                      >
                        <i className="fa-solid fa-scale-balanced text-xs"></i>
                      </button>
                    </div>

                    {isDigitalWallet && (
                      <div className="pt-2.5 border-t border-slate-100/70 dark:border-slate-700/50 flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black text-slate-400 uppercase">Saldo HP</span>
                          {props.onUpdateSaldoReal ? (
                            <button
                              onClick={() => {
                                setInputSaldoRealKeterangan(wName);
                                setInputSaldoReal('');
                                setShowSaldoRealModal(true);
                              }}
                              className="mt-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 dark:text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200/50 dark:border-emerald-800/30 cursor-pointer"
                            >
                              <i className="fa-solid fa-plus-circle"></i>
                              <span>{hasReal ? formatRupiah(realVal) : 'Isi Saldo HP'}</span>
                            </button>
                          ) : (
                            <span className="font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                              {hasReal ? formatRupiah(realVal) : 'Belum Input'}
                            </span>
                          )}
                        </div>
                        {hasReal && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg font-black uppercase text-[8px] tracking-wide",
                            diff === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                            diff > 0 ? "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" :
                            "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
                          )}>
                            {diff === 0 ? 'Klop' : diff > 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>



              {/* JURNAL PENYESUAIAN SALDO */}
              <div className="mt-6 mb-4">
                <div className="bg-white border-2 border-indigo-100/70 rounded-[1.8rem] p-4 shadow-xl shadow-indigo-500/5 hover:shadow-indigo-500/10 transition-shadow">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <h4 className="text-[13px] font-black text-indigo-800 tracking-widest uppercase flex items-center gap-1.5">
                      <i className="fa-solid fa-scale-balanced text-indigo-500 text-sm"></i> Jurnal Penyesuaian
                    </h4>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-xl font-black uppercase tracking-wider">Otomatis</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {/* ITEM 1: Total Saldo Masuk - menonjol dengan gradient oranye */}
                    <div className="flex flex-col gap-2 p-3.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl border border-orange-400 shadow-lg shadow-orange-500/25">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-wide drop-shadow-sm">1. Total Saldo Masuk Hari Ini</p>
                          <p className="text-[9px] text-orange-100 font-bold mt-0.5 whitespace-nowrap">Modal Pagi + Oper Shift + Suntik Saldo</p>
                        </div>
                        <span className="font-black text-[13px] text-orange-800 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-md">{(() => {
                          const totalMasuk = props.transactions.reduce((acc, t) => {
                            const kat = t.kategori || '';
                            const katLower = kat.toLowerCase();
                            const ket = (t.keterangan || '').toUpperCase();
                            
                            let val = 0;
                            if (kat === 'Isi Saldo Bank' || katLower === 'inject saldo' || (katLower.includes('modal awal') && t.tujuan_dana !== 'Bank08' && t.tujuan_dana !== 'Bank09')) {
                              val = t.nominal;
                            } else if (kat === 'Penarikan Saldo Bank' || (katLower.includes('modal awal') && t.sumber_dana && t.sumber_dana !== 'Bank08' && t.sumber_dana !== 'Bank09')) {
                              val = -t.nominal;
                            } else if (kat === 'Operan Shift' && ket.includes('TERIMA') && t.tujuan_dana !== 'Bank08' && t.tujuan_dana !== 'Bank09') {
                              val = t.nominal;
                            } else if (kat.startsWith('Tambah') && t.tujuan_dana !== 'Bank08' && t.tujuan_dana !== 'Bank09') {
                              val = t.nominal;
                            }
                            return acc + val;
                          }, 0);
                          return formatRupiah(totalMasuk);
                        })()}</span>
                      </div>
                    </div>

                    {/* ITEM 2: Sisa Aset Digital */}
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors">
                      <div>
                        <p className="text-[11px] font-black text-blue-700 uppercase tracking-wide">2. Sisa Aset Digital (Buku)</p>
                        <p className="text-[9px] text-blue-400 font-bold mt-0.5">Total Saldo Aset Digital Tersisa</p>
                      </div>
                      <span className="font-black text-[13px] text-blue-900 bg-white px-2.5 py-1 rounded-xl border border-blue-100 shadow-sm">{formatRupiah(props.saldoBank || 0)}</span>
                    </div>

                    <div className="flex flex-col gap-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wide">3. Aset Real App (HP)</p>
                          <p className="text-[9px] text-emerald-600/60 font-bold mt-0.5 whitespace-nowrap">Sisa dana di mobile banking / HP</p>
                        </div>
                        <span className="font-black text-[12px] text-emerald-900 bg-white px-2.5 py-1 rounded-xl border border-emerald-100 shadow-sm">{props.transactions.some(t => t.kategori.includes('Real Aplikasi')) ? formatRupiah(props.saldoReal || 0) : '-'}</span>
                      </div>
                      
                      {props.onUpdateSaldoReal && (
                        <button
                          onClick={() => {
                            setInputSaldoReal('');
                            setInputSaldoRealKeterangan('');
                            setShowSaldoRealModal(true);
                          }}
                          className="w-full border border-emerald-200 hover:border-emerald-400 bg-white rounded-xl p-2.5 flex items-center justify-between shadow-sm cursor-pointer transition-all active:scale-[0.98] group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </div>
                            <div className="text-left">
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">KLIK UNTUK UPDATE SALDO HP</p>
                              <p className="text-[11px] font-extrabold text-slate-700 leading-none truncate">
                                {(props.saldoReal || 0) > 0 ? "Revisi: " + formatRupiah(props.saldoReal || 0) : "Input Saldo Real Sekarang"}
                              </p>
                            </div>
                          </div>
                          <i className="fa-solid fa-chevron-right text-emerald-300 text-xs mr-2"></i>
                        </button>
                      )}
                    </div>

                    {/* Calculation Result block */}
                    {(() => {
                      const hasInputSaldoReal = props.transactions.some(t => t.kategori.includes('Real Aplikasi'));
                      const saldoBuku = props.saldoBank || 0;
                      const realToUse = hasInputSaldoReal ? (props.saldoReal || 0) : saldoBuku;
                      const selisih = realToUse - saldoBuku;
                      
                      return (
                        <div className={cn(
                          "mt-4 p-4 rounded-2xl flex justify-between items-center border-2 transition-all shadow-md",
                          !hasInputSaldoReal ? "bg-slate-50 border-slate-200 text-slate-500" :
                          selisih === 0 ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30" : 
                          selisih > 0 ? "bg-blue-600 border-blue-400 text-white shadow-blue-500/30" : "bg-rose-600 border-rose-400 text-white shadow-rose-500/30"
                        )}>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                              {!hasInputSaldoReal ? <><i className="fa-solid fa-circle-question opacity-70"></i> PERLU INPUT</> :
                               selisih === 0 ? <><i className="fa-solid fa-circle-check"></i> KLOP</> : 
                               selisih > 0 ? <><i className="fa-solid fa-circle-exclamation"></i> SURPLUS</> : 
                               <><i className="fa-solid fa-circle-xmark"></i> SELISIH</>}
                            </p>
                            <p className="text-[9px] opacity-90 font-bold mt-1">
                              {!hasInputSaldoReal ? 'Silakan input saldo real HP Anda' :
                               selisih === 0 ? 'Sisa saldo di HP pas dengan buku' : 
                               selisih > 0 ? 'Saldo di HP lebih dari catatan' : 'Uang di bank kurang dari catatan'}
                            </p>
                          </div>
                          <div className="text-right">
                            {!hasInputSaldoReal ? (
                              <span className="font-black text-[12px] block text-slate-400 uppercase tracking-wider">Tunggu Input</span>
                            ) : (
                              <>
                                <span className="font-black text-[15px] block leading-none">{selisih === 0 ? '✓ MATCH' : formatRupiah(selisih)}</span>
                                {selisih !== 0 && <span className="text-[8px] font-black opacity-80 uppercase tracking-widest mt-1 block">Cek Kembali</span>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
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
              {renderTargetKasirSelector()}
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
              {renderTargetKasirSelector()}
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
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Tambah Saldo</h3>
              <p className="text-[11px] text-slate-500 font-bold tracking-widest text-center">TAMBAH SALDO DOMPET/BANK</p>
            </div>
            
            <div className="space-y-4">
              {renderTargetKasirSelector()}
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
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nominal Saldo</label>
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
              {renderTargetKasirSelector()}
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

    {/* MODAL: KIRIM SALDO KE KASIR LAIN */}
    {showKirimSaldoModal && (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-br from-violet-600 to-purple-800 px-6 sm:px-8 pt-8 pb-6 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <i className="fa-solid fa-money-bill-transfer text-9xl"></i>
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg border border-white/20">
                  <i className="fa-solid fa-paper-plane text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-wide drop-shadow-md">Kirim Saldo ke Kasir</h3>
                  <p className="text-xs text-violet-200 font-semibold uppercase tracking-widest mt-1">Serah Terima Saldo Shift</p>
                </div>
              </div>
              <button onClick={() => setShowKirimSaldoModal(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-5 shadow-inner">
              <p className="text-[11px] font-black text-violet-800 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <i className="fa-solid fa-circle-info"></i> Cara Kerja
              </p>
              <p className="text-xs text-violet-700 font-semibold leading-relaxed">
                Data saldo dompet Anda saat ini akan dikirim ke kasir tujuan sebagai <strong>Transaksi Operan Shift</strong>, sehingga saldo mereka akan bertambah sesuai sisa saldo Anda.
              </p>
            </div>

            {/* Ringkasan Saldo */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-2.5">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Total Saldo Yang Akan Dikirim</p>
              {wallets.map(wId => {
                const bal = walletBalances[wId] || 0
                const wName = getWalletName(wId, walletsFull)
                if (bal <= 0) return null
                return (
                  <div key={wId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                      <i className="fa-solid fa-wallet text-slate-400"></i> {wName}
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">{formatRupiah(bal)}</span>
                  </div>
                )
              })}
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 block mb-3 border-b border-slate-100 pb-2">
                Pilih Kasir Tujuan (Penerima)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {props.kasirList && Object.entries(props.kasirList)
                  .filter(([uname]) => uname !== props.currentUsername)
                  .map(([uname, acc]) => (
                    <button
                      key={uname}
                      onClick={() => setSelectedSaldoTargetKasir(uname)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group",
                        selectedSaldoTargetKasir === uname
                          ? "border-violet-500 bg-violet-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-colors",
                        selectedSaldoTargetKasir === uname ? "bg-violet-600 text-white shadow-lg" : "bg-slate-100 text-slate-500 group-hover:bg-violet-200 group-hover:text-violet-700"
                      )}>
                        {(acc.name || uname).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black text-slate-800 uppercase tracking-wide truncate">{acc.name || uname}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{uname}</p>
                      </div>
                      {selectedSaldoTargetKasir === uname && (
                        <i className="fa-solid fa-circle-check text-xl text-violet-600 shrink-0"></i>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowKirimSaldoModal(false)}
              className="w-full sm:w-1/3 py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              BATAL
            </button>
            <button
              onClick={handleKirimSaldo}
              disabled={!selectedSaldoTargetKasir || isSendingSaldo}
              className="w-full sm:w-2/3 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              {isSendingSaldo ? (
                <><i className="fa-solid fa-spinner fa-spin text-lg"></i><span>MENGIRIM...</span></>
              ) : (
                <><i className="fa-solid fa-paper-plane text-lg"></i><span>KONFIRMASI & KIRIM SEKARANG</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL UPDATE SALDO REAL APLIKASI */}
    {showSaldoRealModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !props.isSaving && setShowSaldoRealModal(false)}></div>
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">Update Saldo Aplikasi</h3>
              <p className="text-[10px] text-emerald-100 font-medium mt-0.5">Bisa diinput berkali-kali</p>
            </div>
            <button 
              onClick={() => setShowSaldoRealModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              disabled={props.isSaving}
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            {inputSaldoRealKeterangan && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-2xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/50">
                Saldo HP {inputSaldoRealKeterangan} saat ini: <span className="font-black">{formatRupiah(walletRealBalances[inputSaldoRealKeterangan.trim().toUpperCase()] || 0)}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Keterangan Aplikasi</label>
              <div className="relative">
                <select 
                  value={inputSaldoRealKeterangan}
                  onChange={(e) => setInputSaldoRealKeterangan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Pilih Kategori Aktif...</option>
                  {wallets.filter(id => id !== 'Bank08' && id !== 'Bank09').map(id => {
                    const wName = getWalletName(id, walletsFull);
                    return (
                      <option key={id} value={wName}>{wName}</option>
                    );
                  })}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Nominal Saldo</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">Rp</span>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={inputSaldoReal}
                  onChange={(e) => setInputSaldoReal(formatInputRupiah(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const nominal = parseInt(inputSaldoReal.replace(/[^0-9]/g, ''), 10) || 0;
                if (nominal <= 0) {
                  props.showToast("Masukkan nominal saldo!");
                  return;
                }
                if (!inputSaldoRealKeterangan) {
                  props.showToast("Pilih Keterangan Aplikasi!");
                  return;
                }
                props.onUpdateSaldoReal?.(nominal, inputSaldoRealKeterangan);
                setInputSaldoReal('');
                setInputSaldoRealKeterangan('');
                setShowSaldoRealModal(false);
              }}
              disabled={props.isSaving || !inputSaldoReal || !inputSaldoRealKeterangan}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 flex justify-center items-center gap-2"
            >
              {props.isSaving ? <><i className="fa-solid fa-spinner fa-spin text-lg"></i> MEMPROSES...</> : <><i className="fa-solid fa-save text-lg"></i> SIMPAN SALDO HP</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default AsetSaldoView
