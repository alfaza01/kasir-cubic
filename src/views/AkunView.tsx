import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, CloudLightning, MessageSquare, KeyRound, Save, RefreshCw, LogOut, Sliders, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface AkunViewProps {
  active: boolean
  isPc: boolean
  setActiveView: (view: string) => void
  kasirName: string
  kasirRole: string
  googleEmail?: string
  googleUid: string
  onLogout: () => void
  onUploadToCloud: () => void
  onDownloadFromCloud: () => void
  onRequestLogout: () => void
  runningTexts: string[]
  mainAnnouncement: string
  onSaveRunningTexts: (texts: string[]) => void
  onSaveMainAnnouncement: (text: string) => void
  storeName: string
  storeSubtext: string
  storePhoto?: string
  onSaveStoreName: (name: string) => void
  onSaveStoreSubtext: (subtext: string) => void
  onSaveStorePhoto: (photo: string) => void
  setIsSidePanelOpen: (open: boolean) => void
  onConfirm: (title: string, message: string, onConfirm: () => void) => void
  currentUsername: string
  kasirList: Record<string, any>
  onSaveCashierSelf: (username: string, account: { name: string, pin: string }) => Promise<void>
  activeStoreId: string
  transactions: any[]
}

const AkunView: React.FC<AkunViewProps> = (props) => {
  const [storeNameInput, setStoreNameInput] = useState(props.storeName)
  const [storeSubtextInput, setStoreSubtextInput] = useState(props.storeSubtext)
  const [storePhotoInput, setStorePhotoInput] = useState(props.storePhoto || '')
  
  const [selfName, setSelfName] = useState(props.kasirName || '')
  const [selfPin, setSelfPin] = useState('')

  const [announcementInput, setAnnouncementInput] = useState(props.mainAnnouncement)
  const [textsInput, setTextsInput] = useState<string[]>(props.runningTexts || Array(15).fill(''))

  const [openSection, setOpenSection] = useState<string | null>(null)

  if (!props.active) return null

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const handleSaveStoreIdentity = async () => {
    if (!storeNameInput.trim()) return
    await props.onSaveStoreName(storeNameInput.trim())
    await props.onSaveStoreSubtext(storeSubtextInput.trim())
    await props.onSaveStorePhoto(storePhotoInput.trim())
    alert('Identitas Toko Berhasil Disimpan!')
  }

  const handleUpdateSelf = async () => {
    if (!selfName.trim()) return
    try {
      await props.onSaveCashierSelf(props.currentUsername, {
        name: selfName.trim(),
        pin: selfPin.trim() || (props.kasirList[props.currentUsername]?.pin || '')
      })
      alert('Profil Anda Berhasil Disimpan!')
      setSelfPin('')
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan profil.')
    }
  }

  const handleSaveAnnouncements = () => {
    props.onSaveMainAnnouncement(announcementInput)
    props.onSaveRunningTexts(textsInput)
    alert('Pengumuman Berhasil Disimpan!')
  }

  return (
    <div className={cn("page-view flex flex-col h-full bg-slate-50 font-sans hide-scrollbar pb-24", !props.active && "hidden")}>
      {/* Header Panel */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-b-[2rem] p-6 shadow-md shrink-0 border-b border-blue-500/20">
        <div className="flex items-center justify-between mb-4 mt-2">
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">Pengaturan Akun</h1>
            <p className="text-[11px] font-medium text-blue-100 mt-1">
              Kelola profil dan keamanan
            </p>
          </div>
          <button 
            onClick={() => props.setIsSidePanelOpen(true)}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 transition-all rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm"
          >
            <User size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Accordions */}
        <div className="space-y-4">
          
          {/* IDENTITAS TOKO - OWNER ONLY */}
          {props.kasirRole === 'owner' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleSection('toko')}
                className="w-full flex items-center justify-between p-4 text-left active:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                    <Sliders size={18} />
                  </div>
                  <span className="font-black text-xs text-slate-800 uppercase tracking-widest">IDENTITAS TOKO</span>
                </div>
                {openSection === 'toko' ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
              </button>
              <AnimatePresence>
                {openSection === 'toko' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-5 space-y-3 bg-slate-50">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Nama Toko</label>
                        <input
                          type="text"
                          value={storeNameInput}
                          onChange={e => setStoreNameInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Subtext / Tagline</label>
                        <input
                          type="text"
                          value={storeSubtextInput}
                          onChange={e => setStoreSubtextInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                        />
                      </div>
                      <button 
                        onClick={handleSaveStoreIdentity}
                        className="w-full py-3.5 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl mt-2 active:scale-95 transition-all"
                      >
                        SIMPAN TOKO
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* SINKRONISASI CLOUD */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleSection('cloud')}
              className="w-full flex items-center justify-between p-4 text-left active:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
                  <CloudLightning size={18} fill="currentColor" className="text-purple-300" />
                </div>
                <div>
                  <span className="font-black text-xs text-slate-800 uppercase tracking-widest block">SINKRONISASI CLOUD</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Backup data & samakan setelan dengan perangkat lain</span>
                </div>
              </div>
              {openSection === 'cloud' ? <ChevronDown size={20} className="text-slate-400 shrink-0" /> : <ChevronDown size={20} className="text-slate-400 -rotate-90 shrink-0" />}
            </button>
            <AnimatePresence>
              {openSection === 'cloud' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="p-5 space-y-4 bg-slate-50">
                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 space-y-1.5 font-bold uppercase text-[9px] leading-relaxed">
                      <p className="text-slate-800 text-[10px] mb-1">Email: {props.googleEmail}</p>
                      <p>Koneksi: <span className="text-green-600">Terhubung</span></p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={props.onUploadToCloud}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/20"
                      >
                        <Save size={14} />
                        <span>Upload Data (Backup)</span>
                      </button>
                      <button
                        onClick={props.onDownloadFromCloud}
                        className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        <RefreshCw size={14} className="text-blue-600" />
                        <span>Download (Restore)</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TEKS OTOMATIS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              onClick={() => props.setActiveView('view-otomatis')}
              className="w-full flex items-center justify-between p-4 text-left active:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
                  <CloudLightning size={18} fill="currentColor" className="text-indigo-300" />
                </div>
                <div>
                  <span className="font-black text-xs text-slate-800 uppercase tracking-widest block">TEKS OTOMATIS</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Setting keterangan otomatis</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400 shrink-0" />
            </button>
          </div>

          {/* PIN & NAMA KASIR */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleSection('pin')}
              className="w-full flex items-center justify-between p-4 text-left active:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <User size={18} fill="currentColor" className="text-blue-300" />
                </div>
                <div>
                  <span className="font-black text-xs text-slate-800 uppercase tracking-widest block">PIN & NAMA KASIR</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Edit nama dan PIN kasir Anda</span>
                </div>
              </div>
              {openSection === 'pin' ? <ChevronDown size={20} className="text-slate-400 shrink-0" /> : <ChevronDown size={20} className="text-slate-400 -rotate-90 shrink-0" />}
            </button>
            <AnimatePresence>
              {openSection === 'pin' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="p-5 space-y-3 bg-slate-50">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Nama Kasir</label>
                      <input
                        type="text"
                        value={selfName}
                        onChange={e => setSelfName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">PIN Baru (Kosongkan bila sama)</label>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={selfPin}
                        onChange={e => setSelfPin(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 tracking-widest"
                      />
                    </div>
                    <button 
                      onClick={handleUpdateSelf}
                      className="w-full py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl mt-2 active:scale-95 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> SIMPAN PERUBAHAN
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">MENU AKUN</h3>
            
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-px bg-slate-100">
              <button className="w-full flex items-center justify-between p-4 bg-white active:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <HelpCircle size={16} fill="currentColor" className="text-blue-300" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Bantuan & Support</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
              <button 
                onClick={() => toggleSection('pengumuman')}
                className="w-full flex items-center justify-between p-4 bg-white active:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare size={16} fill="currentColor" className="text-emerald-300" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Saran & Kritik</span>
                </div>
                {openSection === 'pengumuman' ? <ChevronDown size={18} className="text-slate-300" /> : <ChevronRight size={18} className="text-slate-300" />}
              </button>
            </div>
            
             <AnimatePresence>
                {openSection === 'pengumuman' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Pengumuman Terbatas</label>
                        <input
                          type="text"
                          value={announcementInput}
                          onChange={e => setAnnouncementInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1 block">Teks Berjalan Utama</label>
                        <div className="grid grid-cols-2 gap-2">
                          {textsInput.map((txt, index) => (
                            <input
                              key={index}
                              type="text"
                              placeholder={`Info ${index + 1}`}
                              value={txt}
                              onChange={e => {
                                const updated = [...textsInput]
                                updated[index] = e.target.value
                                setTextsInput(updated)
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-[10px] text-slate-800"
                            />
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={handleSaveAnnouncements}
                        className="w-full py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Save size={16} /> SIMPAN PERUBAHAN
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

          <div className="pt-2 pb-6 space-y-4">
            <button
               onClick={props.onLogout}
               className="w-full py-4 bg-slate-900 border border-transparent text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
            >
              <Save size={16} /> SIMPAN PERUBAHAN
            </button>
            <button
               onClick={props.onRequestLogout}
               className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogOut size={16} strokeWidth={2.5} /> Keluar Aplikasi
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AkunView
