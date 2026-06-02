import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'
import type { Store } from '../types'
import { CubicLogo } from './CubicLogo'
import { Store as StoreIcon, Shield, Plus, LogOut, ChevronRight, User, ShieldCheck } from 'lucide-react'

interface SelectorScreenProps {
  googleUid: string
  googleEmail?: string
  onSelectRole: (role: 'owner' | 'kasir', storeId: string | 'all', store?: Store) => void
  onLogoutGoogle: () => void
}

export const SelectorScreen: React.FC<SelectorScreenProps> = ({
  googleUid,
  googleEmail,
  onSelectRole,
  onLogoutGoogle
}) => {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [newStoreName, setNewStoreName] = useState<string>('')
  const [newStoreSubtext, setNewStoreSubtext] = useState<string>('')
  
  const fetchStores = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', googleUid)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (data) setStores(data)
    } catch (err) {
      console.error('Error fetching stores:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (googleUid) {
      fetchStores()
    }
  }, [googleUid])

  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStoreName.trim()) return

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          user_id: googleUid,
          name: newStoreName.trim(),
          subtext: newStoreSubtext.trim() || 'Agen Brilink & Konter',
          photo_url: ''
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setStores(prev => [...prev, data])
        setIsCreateModalOpen(false)
        setNewStoreName('')
        setNewStoreSubtext('')
      }
    } catch (err) {
      console.error('Error creating store:', err)
      alert('Gagal mendaftarkan toko baru. Silakan coba kembali.')
    }
  }

  return (
    <div className="min-h-screen font-sans w-full bg-slate-50 flex items-center justify-center pt-8 pb-10 px-4 min-h-[100dvh] overflow-y-auto hide-scrollbar">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl relative border border-slate-100 flex-shrink-0 mb-8 mt-auto">
        <div className="p-8 pb-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <CubicLogo size={14} className="scale-100" />
            <div>
              <h1 className="text-2xl font-black flex items-center gap-1.5"><span className="text-slate-900 tracking-tight">CUBIC</span> <span className="text-blue-600 tracking-tight">Cloud</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">MULTI-STORE SWITCHER</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Owner Section */}
            <div className="space-y-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] block px-1">
                CENTRAL DASHBOARD
              </span>
              <button 
                onClick={() => onSelectRole('owner', 'all')}
                className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-left p-5 rounded-3xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-95 flex items-center gap-4 relative overflow-hidden group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 shrink-0 relative z-10 text-white group-hover:bg-white/10 transition-colors">
                  <ShieldCheck size={22} strokeWidth={2.5} />
                </div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                    <span>👑</span> PANEL OWNER UTAMA
                  </h3>
                  <p className="text-[10px] font-bold text-blue-100 mt-2 uppercase tracking-wide leading-relaxed pr-2">
                    PANTAU SEMUA TOKO, LIHAT LAPORAN GABUNGAN, KELOLA KASIR, DAN AUDIT.
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-[9px] text-white/70 font-black uppercase tracking-wider">
                    <Shield size={10} /> DILINDUNGI PIN
                  </div>
                </div>
                <ChevronRight className="text-white/50 shrink-0 relative z-10 group-hover:text-white transition-colors" size={20} />
                
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white flex rounded-full opacity-10 blur-2xl pointer-events-none -mr-16 -mt-16"></div>
              </button>
            </div>

            {/* Stores List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">
                  PILIH TOKO ({stores.length})
                </span>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest transition-colors"
                >
                  <Plus size={12} strokeWidth={3} /> TAMBAH TOKO
                </button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat...</p>
                  </div>
                ) : stores.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-2 bg-slate-50">
                    <p className="text-xs font-black text-slate-600 uppercase">BELUM ADA TOKO</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Silakan tambah toko terlebih dahulu</p>
                  </div>
                ) : (
                  stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => onSelectRole('kasir', store.id, store)}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-3xl transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] active:scale-95 flex items-center justify-between gap-3 text-left group"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          <StoreIcon size={20} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="text-[15px] font-black text-slate-800 leading-none uppercase truncate tracking-wide">{store.name}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 tracking-wider truncate">
                            {store.subtext || 'PEMBUKUAN AGEN BRILINK & KONTER'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-300 shrink-0 group-hover:text-blue-500 transition-colors" size={20} strokeWidth={2.5} />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* divider */}
            <div className="w-full h-px bg-slate-100 my-4"></div>

            {/* User Profile */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex items-center justify-between gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mx-0 mb-0.5">SIGNED IN AS OWNER</p>
                 <p className="text-[12px] font-bold text-slate-700 truncate">{googleEmail || 'loading...'}</p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full uppercase tracking-widest shrink-0 border border-emerald-200 shadow-sm">
                CONNECTED
              </div>
            </div>

            {/* Logout Option */}
            <button 
              onClick={onLogoutGoogle}
              className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-black text-[10px] tracking-widest uppercase rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
            >
              <LogOut size={14} strokeWidth={2.5} /> LOGOUT AKUN GOOGLE
            </button>
            
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-8">
              KASIR CUBIC &bull; CLOUD SYNC MULTI-TENANT
            </p>
          </div>
        </div>
      </div>

      {/* MODAL BUAT TOKO BARU */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                <StoreIcon size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                DAFTARKAN TOKO
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-6">
                Tambahkan cabang atau gerai toko baru Anda
              </p>

              <form onSubmit={handleRegisterStore} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-1">
                    Nama Toko / Agen
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: TOKO1"
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3.5 text-xs text-slate-800 uppercase font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-1">
                    Keterangan Layanan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PEMBUKUAN AGEN BRILINK & KONTER"
                    value={newStoreSubtext}
                    onChange={e => setNewStoreSubtext(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3.5 text-xs text-slate-800 uppercase font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="pt-4 flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                  >
                    DAFTAR SEKARANG
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
