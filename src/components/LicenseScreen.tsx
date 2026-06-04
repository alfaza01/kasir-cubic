import React, { useState } from 'react'
import { motion } from 'motion/react'
import { KeyRound, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'
import { validateLicenseCode } from '../lib/license'

interface LicenseScreenProps {
  onSecretTap: () => void;
  onValid: () => void
}

const LicenseScreen: React.FC<LicenseScreenProps> = ({ onValid, onSecretTap }) => {
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'aktivasi' | 'beli'>('aktivasi')
  const [secretTapCount, setSecretTapCount] = useState(0)
  const deviceId = localStorage.getItem('cubic_device_id') || 'ID-UNKNOWN'
  const waNumber = localStorage.getItem('cubic_owner_wa') || '6281234567890'

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanedKey = licenseKey.trim().toUpperCase()
    if (!cleanedKey) {
      setError('HARAP MASUKKAN KODE AKTIVASI!')
      return
    }

    const res = validateLicenseCode(deviceId, cleanedKey)
    if (res.valid && res.days) {
      const now = new Date()
      const expires = new Date()
      expires.setDate(now.getDate() + res.days)
      
      const licData = {
        code: cleanedKey,
        packageType: res.packageType,
        activatedAt: now.toISOString(),
        expiresAt: expires.toISOString()
      }
      localStorage.setItem('cubic_license_info', JSON.stringify(licData))
      setSuccess(true)
      
      setTimeout(() => {
        onValid()
      }, 1500)
    } else {
      setError(res.error || 'KODE LISENSI TIDAK VALID ATAU KADALUARSA!')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans select-none relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl text-white text-center flex flex-col items-center z-10"
      >
        <div className="w-14 h-14 bg-amber-600/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <KeyRound size={24} className="stroke-[2.5]" />
        </div>

        <h2 
          className="text-sm font-black tracking-widest text-amber-400 uppercase leading-none select-none cursor-pointer"
          onClick={() => {
            const newCount = secretTapCount + 1;
            if (newCount >= 7) {
              const pw = prompt('Developer Access Password:');
              if (pw === 'Umbui123@') {
                onSecretTap();
              }
              setSecretTapCount(0);
            } else {
              setSecretTapCount(newCount);
            }
          }}
        >
          SYSTEM LOCKED
        </h2>
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 mb-6">
          Masa aktif aplikasi telah berakhir
        </p>

        {success ? (
          <div className="space-y-4 py-4 w-full">
            <div className="text-emerald-400 flex flex-col items-center gap-2">
              <CheckCircle2 size={36} className="animate-bounce" />
              <p className="text-xs font-black uppercase tracking-wider">AKTIVASI BERHASIL!</p>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Lisensi terdeteksi aktif. Memuat ulang sistem...
            </p>
          </div>
        ) : mode === 'aktivasi' ? (
          <form onSubmit={handleActivate} className="w-full space-y-4">
            {error && (
              <div className="px-3 py-2.5 bg-red-950/40 border border-red-900/30 text-red-400 text-[9px] font-extrabold uppercase rounded-xl flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span className="text-left leading-tight">{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 block">
                Kode Aktivasi (16-Digit)
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3.5 text-xs text-center font-extrabold focus:outline-none focus:ring-1 focus:ring-amber-500 text-white uppercase tracking-wider"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] tracking-widest uppercase rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/10 active:scale-95 transition-all"
            >
              <Sparkles size={13} className="stroke-[2.5]" />
              <span>Aktivasi Sekarang</span>
            </button>

            <div className="pt-2">
              <p className="text-[9px] font-medium text-slate-500 mb-1">Belum punya lisensi?</p>
              <button 
                type="button"
                onClick={() => setMode('beli')} 
                className="text-xs font-black text-blue-400 hover:text-blue-300"
              >
                Beli Lisensi Di Sini
              </button>
            </div>
            
            <div className="border-t border-slate-800 pt-4 mt-2">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                DEVICE ID: {deviceId}
              </p>
            </div>
          </form>
        ) : (
          <div className="w-full text-left space-y-4">
            <h3 className="text-sm font-black text-white text-center mb-4">PILIH PAKET LISENSI</h3>
            
            <div className="max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {[
                { name: 'STARTER', desc: '1 Bulan', price: 'Rp 10.000' },
                { name: 'BRONZE', desc: '5 Bulan', price: 'Rp 40.000' },
                { name: 'GOLD', desc: '1 Tahun', price: 'Rp 80.000' },
                { name: 'DIAMOND', desc: 'Lifetime', price: 'Rp 350.000' }
              ].map(pkg => (
                <div key={pkg.name} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-white">{pkg.name} <span className="text-slate-500 font-medium">({pkg.desc})</span></p>
                    <p className="text-[10px] font-bold text-amber-500">{pkg.price}</p>
                  </div>
                  <button 
                    onClick={() => window.open(`https://wa.me/${waNumber}?text=Halo%20Admin,%20saya%20ingin%20beli%20lisensi%20Paket%20${pkg.name}.%20Device%20ID:%20${deviceId}`, '_blank')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black tracking-wider uppercase active:scale-95"
                  >
                    Beli
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setMode('aktivasi')}
              className="w-full py-2 text-[10px] font-black text-slate-500 hover:text-slate-400 mt-2 uppercase tracking-widest"
            >
              KEMBALI KE AKTIVASI
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default LicenseScreen
