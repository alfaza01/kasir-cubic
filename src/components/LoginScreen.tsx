import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { CubicLogo } from './CubicLogo'

export interface KasirAccount {
  name: string
  role: 'owner' | 'kasir'
  pin: string
}

export function getKasirAccounts(): Record<string, KasirAccount> {
  const data = localStorage.getItem('alphaPro_kasir_list')
  if (!data) return {}
  try {
    return JSON.parse(data)
  } catch (e) {
    return {}
  }
}

export function saveKasirAccounts(accounts: Record<string, KasirAccount>) {
  localStorage.setItem('alphaPro_kasir_list', JSON.stringify(accounts))
}

interface LoginScreenProps {
  onLogin: (username: string, account: KasirAccount) => void
  storeName?: string
  kasirListOverride?: Record<string, KasirAccount>
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  storeName,
  kasirListOverride = {}
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [pin, setPin] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Map of cashiers to display. ONLY CASHIERS, NO OWNER.
  const cashiers = kasirListOverride || {}
  const cashierIds = Object.keys(cashiers).filter(id => id !== 'owner' && cashiers[id].role !== 'owner')

  useEffect(() => {
    // If only one cashier is available, auto-select them
    if (cashierIds.length === 1 && !selectedUser) {
      setSelectedUser(cashierIds[0])
    }
  }, [cashierIds, selectedUser])

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!selectedUser) {
      setErrorMsg('Pilih profil kasir terlebih dahulu!')
      return
    }

    const account = cashiers[selectedUser]
    if (!account) {
      setErrorMsg('Profil kasir tidak ditemukan!')
      return
    }

    // Validate PIN (if PIN is set)
    if (account.pin && pin !== account.pin) {
      setErrorMsg('PIN yang Anda masukkan salah!')
      setPin('')
      return
    }

    // Successfully authenticated
    onLogin(selectedUser, account)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col items-center"
      >
        {/* App Title/Logo Header */}
        <CubicLogo size={18} className="mb-6 scale-110" />
        
        <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase leading-none mb-2">
          {storeName || 'TOKO'}
        </h2>
        <p className="text-sm font-bold text-slate-500 mb-8">
          Login Kasir
        </p>

        <form onSubmit={handleLoginSubmit} className="w-full space-y-5">
          {/* PROFILE SELECTOR LIST */}
          <div className="w-full">
            <label className="text-sm font-bold text-slate-800 block mb-2 px-1">
              Pilih Pengguna
            </label>

            <div className="relative">
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value)
                  setErrorMsg('')
                  setPin('')
                }}
                className="w-full appearance-none bg-white border border-blue-200 text-slate-800 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              >
                <option value="" disabled className="text-slate-400">Pilih Pengguna</option>
                {cashierIds.map(id => (
                  <option key={id} value={id}>
                    {cashiers[id]?.name || id}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={20} />
              </div>
            </div>

            {cashierIds.length === 0 && (
              <p className="text-[10px] mt-2 font-bold text-amber-600 px-1 bg-amber-50 p-2 rounded-xl border border-amber-200">
                Belum ada kasir terdaftar. Login owner untuk daftar kasir.
              </p>
            )}
          </div>

          {/* PIN DISPLAY */}
          <div className="w-full">
            <label className="text-sm font-bold text-slate-800 block mb-2 px-1">
              PIN
            </label>
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="Masukkan PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setErrorMsg('')
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:font-normal placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {errorMsg && (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full overflow-hidden"
              >
                <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm tracking-widest uppercase rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              MASUK
            </button>
          </div>
        </form>

        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10">
          KASIR CUBIC v1.0
        </p>
      </motion.div>
    </div>
  )
}

export default LoginScreen
