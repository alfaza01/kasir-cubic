import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Plus, Trash2, CheckCircle2, DollarSign, User, Calendar, FileText } from 'lucide-react'
import { formatRupiah, parseNominal, formatInputRupiah, cn } from '../lib/utils'

interface KasbonViewProps {
  active: boolean
  isPc: boolean
  setActiveView: (view: string) => void
  kasirName: string
  showToast: (msg: string) => void
  onConfirm: (title: string, message: string, onConfirm: () => void) => void
  activeStoreId: string
}

interface KasbonEntry {
  id: string
  name: string
  nominal: number
  tanggal: string
  keterangan: string
  status: 'BELUM LUNAS' | 'LUNAS'
  created_at: string
  kasirName?: string
}

export const KasbonView: React.FC<KasbonViewProps> = (props) => {
  const [kasbonList, setKasbonList] = useState<KasbonEntry[]>([])
  
  // Form State
  const [name, setName] = useState('')
  const [nominalStr, setNominalStr] = useState('')
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split('T')[0])
  const [keterangan, setKeterangan] = useState('')

  useEffect(() => {
    if (props.active) {
      const stored = localStorage.getItem(`alphaPro_${props.activeStoreId}_kasbon_list`)
      if (stored) {
        try {
          setKasbonList(JSON.parse(stored))
        } catch (e) {
          setKasbonList([])
        }
      } else {
        setKasbonList([])
      }
    }
  }, [props.active, props.activeStoreId])

  const saveList = (list: KasbonEntry[]) => {
    setKasbonList(list)
    localStorage.setItem(`alphaPro_${props.activeStoreId}_kasbon_list`, JSON.stringify(list))
    
    // Attempt background sync to store settings in cloud database
    // The App.tsx download/upload handles settings, sync can also be manual
  }

  const handleAddKasbon = (e: React.FormEvent) => {
    e.preventDefault()
    const nominal = parseNominal(nominalStr)
    if (!name.trim() || nominal <= 0) {
      props.showToast('HARAP ISI NAMA & NOMINAL YANG VALID!')
      return
    }

    const newEntry: KasbonEntry = {
      id: 'kasbon_' + Date.now(),
      name: name.trim().toUpperCase(),
      nominal,
      tanggal,
      keterangan: keterangan.trim() || '-',
      status: 'BELUM LUNAS',
      created_at: new Date().toISOString(),
      kasirName: props.kasirName
    }

    const updated = [newEntry, ...kasbonList]
    saveList(updated)
    props.showToast('KASBON BERHASIL DITAMBAHKAN!')
    
    // Clear Form
    setName('')
    setNominalStr('')
    setKeterangan('')
  }

  const handleToggleLunas = (id: string, currentStatus: string) => {
    const updated = kasbonList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: (currentStatus === 'BELUM LUNAS' ? 'LUNAS' : 'BELUM LUNAS') as 'LUNAS' | 'BELUM LUNAS'
        }
      }
      return item
    })
    saveList(updated)
    props.showToast(`KASBON DISET SEBAGAI ${currentStatus === 'BELUM LUNAS' ? 'LUNAS' : 'BELUM LUNAS'}!`)
  }

  const handleDelete = (id: string, itemAndName: string) => {
    props.onConfirm('HAPUS DATA KASBON', `Hapus kasbon ${itemAndName}?`, () => {
      const updated = kasbonList.filter(item => item.id !== id)
      saveList(updated)
      props.showToast('KASBON BERHASIL DIHAPUS!')
    })
  }

  // Statistics
  const totalBelumLunas = kasbonList
    .filter(k => k.status === 'BELUM LUNAS')
    .reduce((sum, item) => sum + item.nominal, 0)

  return (
    <div className={cn(`flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 ${props.isPc ? 'h-full overflow-hidden p-6' : 'overflow-y-auto p-4 pb-24'}`, !props.active && 'hidden')}>
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 shrink-0">
        <button
          onClick={() => props.setActiveView('view-beranda')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm transition-all active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h3 className="font-extrabold text-[11px] text-blue-600 uppercase tracking-widest leading-none">
            Catatan Kasbon & Piutang
          </h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Daftar Piutang Pelanggan & Karyawan
          </p>
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className={cn("flex-1 grid gap-6", props.isPc ? "grid-cols-3 overflow-hidden pb-14" : "grid-cols-1 pb-6")}>
        
        {/* Form Column */}
        <div className={cn("bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4 h-fit", props.isPc && "col-span-1")}>
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Plus size={12} className="text-blue-500" />
            <span>Tambah Piutang Kasbon</span>
          </h4>

          <form onSubmit={handleAddKasbon} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Nama Debitur</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="text"
                  required
                  placeholder="CONTOH: BUDI / KARYAWAN A"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 uppercase placeholder-slate-400 font-extrabold focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Nominal Pinjaman</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-black text-[10px]">RP.</span>
                <input
                  type="text"
                  required
                  placeholder="50.000"
                  value={nominalStr}
                  onChange={e => setNominalStr(formatInputRupiah(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-12 pr-4 py-2.5 text-xs font-black text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Tanggal Transaksi</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Keterangan / Item</label>
              <div className="relative">
                <FileText size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="text"
                  placeholder="Contoh: Pinjaman kasir / Beli pulsa"
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>Simpan Kasbon</span>
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className={cn("flex flex-col", props.isPc ? "col-span-2 overflow-hidden h-full" : "h-auto")}>
          {/* Summary Box */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[7px] font-black text-red-600 tracking-widest uppercase leading-none mb-1">TOTAL BELUM DIBAYAR</p>
              <h4 className="text-lg font-black text-slate-800">{formatRupiah(totalBelumLunas)}</h4>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <DollarSign size={16} />
            </div>
          </div>

          {/* List Content */}
          <div className={cn("bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col", props.isPc ? "flex-1 min-h-0" : "h-[400px]")}>
            <div className="p-3.5 bg-slate-50/50 border-b border-slate-100 font-black text-[8px] uppercase tracking-wider text-slate-500 select-none">
              Daftar Catatan Piutang
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 hide-scrollbar">
              {kasbonList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 py-10 text-center">
                  <FileText size={20} className="text-slate-300" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Tidak ada catatan kasbon</p>
                </div>
              ) : (
                kasbonList.map(item => (
                  <div key={item.id} className={cn("p-4 flex gap-3", props.isPc ? "items-center justify-between" : "flex-col items-start")}>
                    <div className="min-w-0 flex-1 w-full text-left">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-800 tracking-wider uppercase break-words">{item.name}</span>
                        <span className={`text-[6px] px-1.5 py-0.5 rounded-md font-black tracking-widest shrink-0 ${
                          item.status === 'LUNAS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-550/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs font-black text-blue-500">{formatRupiah(item.nominal)}</p>
                      <div className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 tracking-wider space-y-0.5">
                        <div>📅 {item.tanggal}</div>
                        <div>📝 {item.keterangan}</div>
                        {item.kasirName && <div>👤 By: {item.kasirName}</div>}
                      </div>
                    </div>

                    <div className={cn("flex gap-2 shrink-0", !props.isPc && "w-full justify-end pt-2 border-t border-slate-100")}>
                      <button
                        onClick={() => handleToggleLunas(item.id, item.status)}
                        className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                          item.status === 'LUNAS'
                            ? 'bg-amber-950/30 border-amber-900/30 text-amber-500 hover:bg-slate-850'
                            : 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400 hover:bg-slate-800'
                        }`}
                        title={item.status === 'LUNAS' ? 'Set Belum Lunas' : 'Tandai Lunas'}
                      >
                        <CheckCircle2 size={13} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id, `${item.name} (${formatRupiah(item.nominal)})`)}
                        className="w-7.5 h-7.5 rounded-lg bg-red-950/30 border border-red-900/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all active:scale-95"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default KasbonView
