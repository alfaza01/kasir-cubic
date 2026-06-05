import React, { useState } from 'react';
import { getOwnerWa, setOwnerWa } from '../lib/supabase';
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import { Shield, Database, RefreshCw, Trash2, ArrowLeft, Terminal, CheckCircle, Key, Copy } from 'lucide-react'
import { generateLicenseCode, LICENSE_PACKAGES } from '../lib/license'

interface AdminViewProps {
  active: boolean
  isPc: boolean
  setActiveView: (view: string) => void
  showToast?: (msg: string) => void
}

const AdminView: React.FC<AdminViewProps> = ({ active, isPc, setActiveView, showToast }) => {
  const [logs, setLogs] = useState<string[]>([
    'System initialization successful.',
    'Offline database engine: LOCALSTORAGE synced.',
    'Vite Dev proxy active.',
    'Supabase integration active.'
  ])
  const [loading, setLoading] = useState(false)
  const [genDeviceId, setGenDeviceId] = useState('')
  const [genPackage, setGenPackage] = useState<keyof typeof LICENSE_PACKAGES>('PEMULA')
  const [generatedCode, setGeneratedCode] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [waNumber, setWaNumber] = useState('6287824889706')
  const [genCustomerName, setGenCustomerName] = useState('')
  const [clientRegistry, setClientRegistry] = useState<any[]>([])
  const [adminTab, setAdminTab] = useState<'lisensi' | 'properti'>('lisensi')
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([])

  // Fetch owner WA from Supabase on mount
  React.useEffect(() => {
    if (active) {
      // Load current WA number from remote config
      getOwnerWa()
        .then((wa) => setWaNumber(wa))
        .catch(() => {
          // fallback to default if remote fetch fails
          const savedWa = localStorage.getItem('cubic_owner_wa');
          if (savedWa) setWaNumber(savedWa);
        });
      const savedReg = localStorage.getItem('cubic_client_registry');
      if (savedReg) {
        try { setClientRegistry(JSON.parse(savedReg)) } catch(e){}
      }
      const savedFb = localStorage.getItem('cubic_user_feedbacks');
      if (savedFb) {
        try { setUserFeedbacks(JSON.parse(savedFb)) } catch(e){}
      }
    }
  }, [active]);

  // Save WA number to Supabase (and also keep a local copy for offline fallback)
  const handleSaveWa = async () => {
    try {
      await setOwnerWa(waNumber);
      localStorage.setItem('cubic_owner_wa', waNumber);
      showToast?.('✅ Nomor WA tersimpan secara global!');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan nomor WA ke server');
    }
  };

  if (!active) return null

  if (!isAuthenticated) {
    return (
      <div className={cn(`flex flex-col items-center justify-center bg-slate-950 font-sans text-white ${isPc ? 'flex-1 h-full p-6' : 'fixed inset-0 z-[200] p-4'}`, !active && "hidden")}>
        <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Shield size={24} />
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest mb-1 text-center">Developer Access</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-6">Restricted System Area</p>
          
          <input 
            type="password"
            placeholder="ENTER AUTHORIZATION KEY"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (authPassword === 'Umbui123@') setIsAuthenticated(true)
                else alert('Akses Ditolak')
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3.5 text-xs text-center text-white font-black tracking-[0.2em] focus:outline-none mb-4"
          />
          <button 
            onClick={() => {
              if (authPassword === 'Umbui123@') setIsAuthenticated(true)
              else alert('Akses Ditolak')
            }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all mb-4"
          >
            AUTHORIZE
          </button>
          <button onClick={() => setActiveView('view-beranda')} className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
            KEMBALI KE BERANDA
          </button>
        </div>
      </div>
    )
  }

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
    <div className={cn(`flex flex-col overflow-hidden bg-slate-950 font-sans text-white ${isPc ? 'flex-1 h-full p-6' : 'fixed inset-0 z-[200] p-4'}`, !active && "hidden")}>
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

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 shrink-0">
        <button 
          onClick={() => setAdminTab('lisensi')}
          className={cn("flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", adminTab === 'lisensi' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800')}
        >
          Akses Lisensi
        </button>
        <button 
          onClick={() => setAdminTab('properti')}
          className={cn("flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", adminTab === 'properti' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800')}
        >
          Properti Admin
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto space-y-6 hide-scrollbar pb-32">
        {adminTab === 'properti' && (
          <>
            {/* User Suggestions */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={12} className="text-blue-500" />
                  <span>Pesan & Saran Pengguna</span>
                </h4>
                <button
                  onClick={() => {
                    if (confirm('Bersihkan semua riwayat pesan?')) {
                      localStorage.removeItem('cubic_user_feedbacks');
                      setUserFeedbacks([]);
                    }
                  }}
                  className="text-[8px] bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white px-2 py-1.5 rounded-md transition-all font-bold uppercase"
                >
                  Bersihkan
                </button>
              </div>
              
              <div className="space-y-3">
                {userFeedbacks.length > 0 ? (
                  userFeedbacks.map((fb: any) => (
                    <div key={fb.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded uppercase">{fb.user}</span>
                        <span className="text-[9px] text-slate-500 font-semibold">{new Date(fb.date).toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">{fb.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs font-bold bg-slate-950/50 rounded-xl border border-slate-800/50">
                    Belum ada pesan atau saran dari pengguna.
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostics Card */}
            <div className={cn("grid gap-4", isPc ? "grid-cols-2" : "grid-cols-1")}>
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

          {/* Settings & Configuration Card */}
          <div className={cn("bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col", isPc ? "h-auto" : "h-64")}>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3 shrink-0">
              <Terminal size={12} className="text-blue-500" />
              <span>Sistem & Konfigurasi</span>
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono mb-1.5">Nomor WhatsApp Owner (Aktivasi Lisensi)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={waNumber}
                    onChange={e => setWaNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="628..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      localStorage.setItem('cubic_owner_wa', waNumber);
                      showToast?.('✅ Nomor WA tersimpan di perangkat ini!');
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Simpan
                  </button>
                </div>
                <div className="mt-2 p-2 bg-blue-950/40 border border-blue-800/40 rounded-lg">
                  <p className="text-[8px] text-blue-400 font-bold">📡 Update Online: Edit file <span className="text-white font-mono">public/config.json</span> di GitHub → semua pengguna otomatis baca nomor baru saat online.</p>
                  <p className="text-[8px] text-slate-500 mt-1">Format: 628XXXXXXXXX (kode negara 62)</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-850 font-mono text-[8px] text-slate-400 overflow-y-auto space-y-1.5 scrollbar-thin mt-4">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-blue-500 select-none">&gt;</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
        )}

        {adminTab === 'lisensi' && (
          <>
            {/* License Generator Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Key size={12} className="text-amber-500" />
            <span>License Generator (Offline)</span>
          </h4>
          
          <div className={cn("grid gap-4", isPc ? "grid-cols-3" : "grid-cols-1")}>
            <div className={cn("space-y-3", isPc && "col-span-2")}>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono mb-1.5">Nama Toko / Pembeli</label>
                <input 
                  type="text" 
                  value={genCustomerName}
                  onChange={e => setGenCustomerName(e.target.value)}
                  placeholder="Misal: Alfaza Cell (Kasir 1)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono mb-1.5">Customer Device ID</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={genDeviceId}
                      onChange={e => setGenDeviceId(e.target.value.toUpperCase())}
                      placeholder="ID-..."
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-5 text-xs text-white uppercase font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                        setGenDeviceId(newId);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(genDeviceId);
                        showToast?.('✅ Device ID copied!');
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                      title="Copy Device ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono mb-1.5">Package Type</label>
                  <select 
                    value={genPackage}
                    onChange={e => setGenPackage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-bold focus:outline-none"
                  >
                    <option value="PEMULA">PEMULA (1 Bulan)</option>
                    <option value="PAKET_2">PAKET 2 (4 Bulan)</option>
                    <option value="PAKET_3">PAKET 3 (1 Tahun)</option>
                    <option value="LIFETIME">LIFETIME (Selamanya)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  if(!genCustomerName.trim()) return alert('Masukkan Nama Pembeli');
                  if(!genDeviceId.trim()) return alert('Masukkan Device ID');
                  const code = generateLicenseCode(genDeviceId.trim(), genPackage);
                  setGeneratedCode(code);
                  
                  const newEntry = {
                    id: Date.now(),
                    name: genCustomerName.trim(),
                    deviceId: genDeviceId.trim(),
                    packageType: genPackage,
                    code: code,
                    date: new Date().toISOString()
                  };
                  const newRegistry = [newEntry, ...clientRegistry];
                  setClientRegistry(newRegistry);
                  localStorage.setItem('cubic_client_registry', JSON.stringify(newRegistry));
                  
                  addLog(`Generated ${genPackage} license for ${genCustomerName.trim()}`);
                  setGenCustomerName('');
                  setGenDeviceId('');
                }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl shadow-lg active:scale-95 transition-all"
              >
                Generate Kode Aktivasi
              </button>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Kode 16-Digit</p>
              {generatedCode ? (
                <>
                  <p className="font-mono text-lg font-black text-amber-400 tracking-wider mb-4 break-all px-2">{generatedCode}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      alert('Kode dicopy ke clipboard!');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Copy Kode
                  </button>
                </>
              ) : (
                <p className="text-xs font-bold text-slate-600">- Belum ada kode -</p>
              )}
            </div>
          </div>
        </div>

        {/* Client Registry Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Database size={12} className="text-blue-500" />
              <span>Client Registry (Riwayat License)</span>
            </h4>
            <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full font-bold">Total: {clientRegistry.length}</span>
          </div>
          
          <div className="space-y-3">
            {clientRegistry.length > 0 ? (
              clientRegistry.map((client) => (
                <div key={client.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black text-white mb-0.5">{client.name}</h5>
                    <div className="flex gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      <span><span className="text-slate-600">ID:</span> {client.deviceId}</span>
                      <span><span className="text-slate-600">PKG:</span> {client.packageType}</span>
                      <span>{new Date(client.date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-amber-500 font-bold bg-amber-950/30 px-2 py-1 rounded">{client.code}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(client.code);
                        showToast && showToast("Kode dicopy!");
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                      title="Copy Kode"
                    >
                      <Key size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs font-bold bg-slate-950/50 rounded-xl border border-slate-800/50">
                Belum ada riwayat pembuatan lisensi.
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {adminTab === 'properti' && (
        <>
          {/* Diagnostic Metadata Grid */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500" />
              <span>Platform Capabilities</span>
            </h4>

            <div className={cn("grid gap-3", isPc ? "grid-cols-4" : "grid-cols-2")}>
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
        </>
      )}
      </div>
    </div>
  )
}

export default AdminView
