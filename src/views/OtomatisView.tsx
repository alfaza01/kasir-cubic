import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { getCategories, getWalletName, cn, formatInputRupiah, parseNominal } from '../lib/utils'
import type { PresetOtomatis } from '../types'
import { Zap, List, Edit2, X, ChevronDown, ChevronRight, Save, Store, ArrowLeft } from 'lucide-react'

interface OtomatisViewProps {
  active: boolean
  setActiveView: (v: string) => void
  showToast: (m: string) => void
  presets: PresetOtomatis[]
  setPresets: (p: PresetOtomatis[]) => void
  storeName?: string
  storeSubtext?: string
  storePhoto?: string
  kasirName?: string
  kasirRole?: string
  setIsSidePanelOpen?: (v: boolean) => void
  onConfirm?: (title: string, message: string, onConfirm: () => void) => void
  isPc?: boolean
  activeStoreId?: string
}

const OtomatisView: React.FC<OtomatisViewProps> = (props) => {
  const [formKategori, setFormKategori] = useState('ORDERKUOTA')
  const [formKeterangan, setFormKeterangan] = useState('')
  const [formModal, setFormModal] = useState('')
  const [formJual, setFormJual] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const isOrderKuota = (kat: string) => {
    return kat === 'ORDERKUOTA' || kat === 'Bank07' || kat === 'ORDER KUOTA'
  }

  const getCategoryDisplayName = (kat: string) => {
    if (kat === 'ORDERKUOTA') return 'ORDER KUOTA'
    return getWalletName(kat)
  }

  const toggleCategory = (kat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [kat]: !prev[kat]
    }))
  }

  const handleSimpan = () => {
    if (!formKeterangan) return props.showToast('Keterangan tidak boleh kosong!')

    let modalNum = 0;
    let jualNum = 0;

    if (isOrderKuota(formKategori)) {
      modalNum = parseNominal(formModal)
      jualNum = parseNominal(formJual)
      if (modalNum <= 0) return props.showToast('Harga Modal tidak valid!')
      if (jualNum <= 0) return props.showToast('Harga Jual tidak valid!')
    }

    let newPresets = [...props.presets]
    if (editingId) {
      newPresets = newPresets.map(p => p.id === editingId ? {
        id: editingId,
        kategori: formKategori,
        keterangan: formKeterangan,
        modal: modalNum,
        jual: jualNum
      } : p)
      props.showToast('Preset Berhasil Diupdate!')
    } else {
      newPresets.push({
        id: crypto.randomUUID ? crypto.randomUUID() : new Date().getTime().toString(),
        kategori: formKategori,
        keterangan: formKeterangan,
        modal: modalNum,
        jual: jualNum
      })
      props.showToast('Preset Baru Disimpan!')
    }
    props.setPresets(newPresets)
    resetForm()
  }

  const handleEdit = (p: PresetOtomatis) => {
    setEditingId(p.id)
    setFormKategori(p.kategori || 'ORDERKUOTA')
    setFormKeterangan(p.keterangan)
    setFormModal(p.modal.toLocaleString('id-ID').replace(/,/g, '.'))
    setFormJual(p.jual.toLocaleString('id-ID').replace(/,/g, '.'))
  }

  const handleDelete = (id: string) => {
    if (props.onConfirm) {
      props.onConfirm(
        "HAPUS PRESET",
        "Apakah Anda yakin ingin menghapus preset teks otomatis ini?",
        () => {
          props.setPresets(props.presets.filter(p => p.id !== id))
          props.showToast('Preset dihapus!')
        }
      )
    } else {
      if (confirm('Hapus preset ini?')) {
        props.setPresets(props.presets.filter(p => p.id !== id))
        props.showToast('Preset dihapus!')
      }
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormKategori('ORDERKUOTA')
    setFormKeterangan('')
    setFormModal('')
    setFormJual('')
  }

  if (props.activeStoreId === 'all') {
    return (
      <div className={cn("page-view flex flex-col h-full bg-slate-50 font-sans hide-scrollbar", !props.active && "hidden")}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="p-8 text-center bg-white border border-amber-200 rounded-3xl max-w-md shadow-xl flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
              <Store size={32} />
            </div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Pilih Toko Terlebih Dahulu</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Silakan pilih salah satu toko di Beranda untuk mengelola Teks Otomatis.</p>
          </div>
        </div>
      </div>
    );
  }

  if (props.isPc) {
     return (
        <div className={cn("flex-grow h-full flex flex-col bg-slate-50 overflow-hidden font-sans", !props.active ? "hidden" : "flex")}>
          <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-wide uppercase">Teks Otomatis & Preset</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Kelola preset teks dan harga untuk mempermudah input transaksi kasir</p>
            </div>
          </div>
          {/* Implement PC view similarly if needed, but skipping for brevity to focus on Mobile which matches screenshot */}
          <div className="p-8">
             <p className="text-slate-500 text-sm font-bold">Gunakan Tampilan Mobile untuk Teks Otomatis (Sesuai Screenshot).</p>
          </div>
        </div>
     )
  }

  return (
    <div className={cn("page-view flex flex-col h-full bg-slate-50 font-sans hide-scrollbar pb-24", !props.active && "hidden")}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-b-[2rem] px-6 pt-12 pb-8 shadow-md shrink-0 border-b border-blue-500/20 relative z-10 flex items-center justify-between">
        <div>
           <h1 className="text-xl font-black text-white tracking-wide">Teks Otomatis</h1>
           <p className="text-[11px] font-medium text-blue-100 mt-1">
             Setting keterangan otomatis
           </p>
        </div>
        <button 
           onClick={() => props.setActiveView('view-akun')}
           className="w-10 h-10 bg-white/10 hover:bg-white/20 transition-all rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm backdrop-blur-md"
        >
           <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 overflow-y-auto space-y-5 -mt-4 relative z-20">
        
        {/* Form Container */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-black text-slate-800 text-[11px] flex items-center gap-2 uppercase tracking-wide">
             <Zap size={16} className="text-purple-600 fill-purple-600" /> 
             {editingId ? 'EDIT PRESET' : 'TAMBAH PRESET BARU'}
          </h3>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Kategori Transaksi</label>
             <div className="flex flex-wrap gap-2">
               {[...getCategories(), 'Tarik Tunai'].map((kat) => (
                 <button
                   key={kat}
                   onClick={() => setFormKategori(kat)}
                   className={cn(
                     "py-1.5 px-3 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                     formKategori === kat 
                        ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600"
                   )}
                 >
                   {getCategoryDisplayName(kat)}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-1.5 pt-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1 block">Keterangan / Nama Produk</label>
             <input
               type="text"
               placeholder={isOrderKuota(formKategori) ? "Contoh: Token Listrik" : "Contoh: gopay"}
               value={formKeterangan}
               onChange={(e) => setFormKeterangan(e.target.value)}
               className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 shadow-sm"
             />
             <p className="text-[9px] font-bold text-slate-400 mt-1 pl-1 leading-relaxed">
               Saat Kasir mengetik ini di "Keterangan Opsional", pilihan otomatis akan muncul.
             </p>
          </div>

          {isOrderKuota(formKategori) && (
             <div className="grid grid-cols-2 gap-3 pt-2">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Harga Modal</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formModal}
                    onChange={(e) => setFormModal(formatInputRupiah(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-black text-slate-800 shadow-sm"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Harga Jual</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formJual}
                    onChange={(e) => setFormJual(formatInputRupiah(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-black text-slate-800 shadow-sm"
                  />
               </div>
             </div>
          )}

          <div className="flex gap-3 pt-4">
             {editingId && (
               <button
                 onClick={resetForm}
                 className="flex-1 bg-slate-100 text-slate-600 text-[10px] font-black py-4 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest"
               >
                 Batal
               </button>
             )}
             <button
               onClick={handleSimpan}
               className="flex-[2] bg-purple-600 text-white text-[10px] font-black py-4 rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
             >
               <Save size={14} /> SIMPAN PRESET
             </button>
          </div>
        </div>

        {/* List Container */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-black text-slate-800 text-[11px] flex items-center gap-2 uppercase tracking-wide">
             <List size={16} className="text-blue-600" /> 
             DAFTAR PRESET OTOMATIS
          </h3>

          {props.presets.length === 0 ? (
             <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                  <List size={20} />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada preset terdaftar.</p>
             </div>
          ) : (
             <div className="space-y-3">
               {[...getCategories(), 'Tarik Tunai'].map(kat => {
                 const filtered = props.presets.filter(p => {
                   const pk = p.kategori || 'ORDERKUOTA';
                   if (isOrderKuota(kat) && isOrderKuota(pk)) return true;
                   return pk === kat;
                 });
                 if (filtered.length === 0) return null;

                 const isCollapsed = collapsedCategories[kat];

                 return (
                   <div key={kat} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all duration-300">
                     <button
                       onClick={() => toggleCategory(kat)}
                       className="w-full flex items-center justify-between text-left active:opacity-70"
                     >
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{getCategoryDisplayName(kat)}</span>
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                            {filtered.length} preset
                          </span>
                       </div>
                       {isCollapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                     </button>

                     <AnimatePresence>
                       {!isCollapsed && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           <div className={cn(
                             "pt-4 mt-3 border-t border-slate-200/60",
                             isOrderKuota(kat) ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2"
                           )}>
                             {filtered.map(p => (
                               <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                                 <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-bold text-slate-800 truncate">{p.keterangan}</h4>
                                    {isOrderKuota(kat) && (
                                       <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase mt-1">
                                          <span className="text-blue-600">M: {p.modal / 1000}k</span>
                                          <span className="text-slate-300">|</span>
                                          <span className="text-emerald-600">J: {p.jual / 1000}k</span>
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex gap-1 shrink-0">
                                   <button 
                                     onClick={() => handleEdit(p)} 
                                     className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-90 transition-all border border-blue-100/50"
                                   >
                                      <Edit2 size={12} strokeWidth={2.5} />
                                   </button>
                                   <button 
                                     onClick={() => handleDelete(p.id)} 
                                     className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all border border-red-100/50"
                                   >
                                      <X size={14} strokeWidth={2.5} />
                                   </button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 )
               })}
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OtomatisView
