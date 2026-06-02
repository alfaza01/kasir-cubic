import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Smartphone, Tablet, Monitor, Contrast, Fingerprint, Store, User } from 'lucide-react'

interface SidePanelProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  theme: string
  setTheme: (theme: string) => void
  screenSize: string
  setScreenSize: (screenSize: string) => void
  jamAbsen: string
  kasirName: string
  storeName: string
  storeSubtext: string
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  setIsOpen,
  theme,
  setTheme,
  screenSize,
  setScreenSize,
  jamAbsen,
  kasirName,
  storeName,
  storeSubtext
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[1010] w-full max-w-sm bg-slate-900 border-l border-slate-800 text-white flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <i className="fa-solid fa-sliders text-sm"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-400">
                    Mode & Tema
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Pengaturan Aplikasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Section: Info Toko & Kasir */}
              <div className="space-y-3">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                  Informasi Sesi Aktif
                </span>
                
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 text-slate-400">
                      <Store size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Toko</p>
                      <p className="text-xs font-black text-white leading-tight uppercase truncate">{storeName || 'APLIKASI CUBIC'}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider truncate">{storeSubtext || 'Agen Brilink & Konter'}</p>
                    </div>
                  </div>

                  <hr className="border-slate-800/50" />

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 text-slate-400">
                      <User size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Kasir Aktif</p>
                      <p className="text-xs font-black text-white leading-tight uppercase truncate">{kasirName || 'Owner'}</p>
                    </div>
                  </div>

                  <hr className="border-slate-800/50" />

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center shrink-0 text-emerald-400 animate-pulse">
                      <Fingerprint size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Mulai Kerja</p>
                      <p className="text-xs font-black text-emerald-400 leading-tight truncate">{jamAbsen || '--:--:--'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Mode Layar */}
              <div className="space-y-3">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                  Mode Tampilan
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'hp', label: 'HP', icon: Smartphone },
                    { id: 'tablet', label: 'Tablet', icon: Tablet },
                    { id: 'pc', label: 'Komputer PC', icon: Monitor }
                  ].map((mode) => {
                    const isActive = screenSize === mode.id
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setScreenSize(mode.id)}
                        className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 border text-center transition-all duration-250 active:scale-95 group ${
                          isActive
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 font-black'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <mode.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{mode.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section: Tema Warna */}
              <div className="space-y-3">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                  Tema Aplikasi
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Classic Putih', colorClass: 'bg-white border-slate-300', icon: Contrast },
                    { id: 'dark', label: 'Gelap Charcoal', colorClass: 'bg-slate-800 border-slate-600', icon: Contrast },
                    { id: 'blue', label: 'Biru Ocean', colorClass: 'bg-blue-900 border-cyan-400', icon: Contrast }
                  ].map((themeOpt) => {
                    const isActive = theme === themeOpt.id
                    return (
                      <button
                        key={themeOpt.id}
                        onClick={() => setTheme(themeOpt.id)}
                        className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 border text-center transition-all duration-250 active:scale-95 group ${
                          isActive
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 font-black'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${themeOpt.colorClass} shadow-md shrink-0`}>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{themeOpt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/30 text-center">
              <p className="text-[7px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">
                Cubic Mobile v1.0.0
              </p>
              <p className="text-[6px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                Made for Alfaza Cell
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SidePanel
