import React, { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import { Shield, Database, RefreshCw, Trash2, ArrowLeft, Terminal, CheckCircle } from 'lucide-react'

interface AdminViewProps {
  active: boolean
  isPc: boolean
  setActiveView: (view: string) => void
}

const AdminView: React.FC<AdminViewProps> = ({ active, isPc, setActiveView }) => {
  const [logs, setLogs] = useState<string[]>([
    'System initialization successful.',
    'Offline database engine: LOCALSTORAGE synced.',
    'Vite Dev proxy active.',
    'Supabase integration active.'
  ])
  const [loading, setLoading] = useState(false)

  if (!active) return null

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])
  }

  const handleClearLocalStorage = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data LocalStorage? Tindakan ini tidak dapat dibatalkan.')) {
      setLoading(true)
      setTimeout(() => {
        const keeps = ['alphaPro_categories', 'alphaPro_categories_config']
        const saved: Record<string, string | null> = {}
        keeps.forEach(k => { saved[k] = localStorage.getItem(k) })
        localStorage.clear()
        keeps.forEach(k => { if (saved[k]) localStorage.setItem(k, saved[k]!) })
        
        addLog('LocalStorage cleared (preserved system configs).')
        setLoading(false)
        alert('LocalStorage dibersihkan!')
      }, 800)
    }
  }

  const handleResetApp = () => {
    if (confirm('RESET APLIKASI SEPENUHNYA? Semua data session dan cabang akan dihapus dari browser.')) {
      localStorage.clear()
      addLog('Hard reset complete.')
      alert('Reset Selesai! Halaman akan direfresh.')
      window.location.reload()
    }
  }

  return (
    <div className={cn(`flex-1 flex flex-col h-full overflow-hidden bg-slate-950 font-sans text-white ${isPc ? 'p-6' : 'p-4'}`, !active && "hidden")}>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('view-beranda')}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 className="font-extrabold text-[11px] text-blue-400 uppercase tracking-widest leading-none">
              Developer Panel
            </h3>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              System Admin & Diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-900/30 px-3 py-1.5 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-wider">
          <Shield size={10} />
          <span>Root Access</span>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto space-y-6 hide-scrollbar pb-10">
        {/* Diagnostics Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Database size={12} className="text-blue-500" />
              <span>Database & Storage Diagnostics</span>
            </h4>

            <p className="text-[9px] text-slate-400 leading-relaxed font-semibold uppercase">
              Gunakan fungsi diagnostik di bawah untuk memeriksa, mengosongkan cache browser, maupun me-reset status login secara paksa apabila terjadi kendala sistem sinkronisasi.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleClearLocalStorage}
                disabled={loading}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-850 hover:border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                <Trash2 size={12} className="text-red-500" />
                <span>Kosongkan Cache Storage Lokal</span>
              </button>

              <button
                onClick={handleResetApp}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-950 hover:border-red-900/60 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                <RefreshCw size={12} className="text-red-500" />
                <span>Hard Reset Aplikasi</span>
              </button>
            </div>
          </div>

          {/* Console / Terminal simulation for logs */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-64 md:h-auto">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3 shrink-0">
              <Terminal size={12} className="text-blue-500" />
              <span>Realtime Debug Console</span>
            </h4>

            <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-850 font-mono text-[8px] text-slate-400 overflow-y-auto space-y-1.5 scrollbar-thin">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-blue-500 select-none">&gt;</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Metadata Grid */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-500" />
            <span>Platform Capabilities</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Environment', value: 'Production Web v1.1' },
              { label: 'Capacitor', value: 'Active / Core v8' },
              { label: 'Supabase Sync', value: 'Active / Schema-v2' },
              { label: 'Theme Framework', value: 'Tailwind v4' }
            ].map((meta, i) => (
              <div key={i} className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl">
                <span className="text-[7px] text-slate-500 font-extrabold uppercase tracking-widest block leading-none mb-1.5">{meta.label}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{meta.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminView
