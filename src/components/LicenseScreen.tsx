import React, { useState } from 'react'
import { motion } from 'motion/react'
import { KeyRound, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'

interface LicenseScreenProps {
  onValid: () => void
}

const LicenseScreen: React.FC<LicenseScreenProps> = ({ onValid }) => {
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic key validation: e.g. CUBIC-XXXX-XXXX-XXXX
    const cleanedKey = licenseKey.trim().toUpperCase()
    if (!cleanedKey) {
      setError('HARAP MASUKKAN KUNCI LISENSI!')
      return
    }

    if (cleanedKey === 'CUBIC-TRIAL-2026' || cleanedKey.startsWith('CUBIC-')) {
      setSuccess(true)
      const mockLicense = {
        key: cleanedKey,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
      }
      localStorage.setItem('cubic_license_active', JSON.stringify(mockLicense))
      
      setTimeout(() => {
        onValid()
      }, 1500)
    } else {
      setError('KUNCI LISENSI TIDAK VALID ATAU KADALUARSA!')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans select-none relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl text-white text-center flex flex-col items-center"
      >
        <div className="w-14 h-14 bg-amber-600/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <KeyRound size={24} className="stroke-[2.5]" />
        </div>

        <h2 className="text-sm font-black tracking-widest text-amber-400 uppercase leading-none">
          CUBIC LICENSE ACTIVATION
        </h2>
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 mb-6">
          SISTEM KEAMANAN LISENSI CUBIC
        </p>

        {success ? (
          <div className="space-y-4 py-4 w-full">
            <div className="text-emerald-400 flex flex-col items-center gap-2">
              <CheckCircle2 size={36} className="animate-bounce" />
              <p className="text-xs font-black uppercase tracking-wider">AKTIVASI BERHASIL!</p>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Lisensi terdeteksi aktif. Halaman akan dimuat ulang...
            </p>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="w-full space-y-4">
            {error && (
              <div className="px-3 py-2.5 bg-red-950/40 border border-red-900/30 text-red-400 text-[9px] font-extrabold uppercase rounded-xl flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span className="text-left leading-tight">{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 block">
                Kunci Lisensi Anda
              </label>
              <input
                type="text"
                placeholder="Contoh: CUBIC-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3.5 text-xs text-center font-extrabold focus:outline-none focus:ring-1 focus:ring-amber-500 text-white uppercase placeholder-slate-700 tracking-wider"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] tracking-widest uppercase rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/10 active:scale-95 transition-all"
            >
              <Sparkles size={13} className="stroke-[2.5]" />
              <span>Aktivasi Sekarang</span>
            </button>

            <div className="p-3 border border-slate-800/40 rounded-2xl bg-slate-950/20 text-[8px] text-slate-500 font-semibold uppercase leading-relaxed text-center">
              Belum punya lisensi? Gunakan lisensi percobaan trial key: <br />
              <span className="font-extrabold text-blue-400">CUBIC-TRIAL-2026</span>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default LicenseScreen
