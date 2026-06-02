import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export const GoogleAuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      const redirectTo = Capacitor.isNativePlatform() 
        ? 'com.aplikasicubic.cubic://login' 
        : window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Capacitor.isNativePlatform(),
        }
      })

      if (error) throw error;

      // Jika di native, buka browser secara manual agar state terjaga
      if (Capacitor.isNativePlatform() && data?.url) {
        await Browser.open({ url: data.url });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card fade-in">
        <div className="mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-200">
            <i className="fa-solid fa-cloud-bolt text-3xl text-white"></i>
          </div>
          <h1 className="login-title">
            CUBIC <span className="login-title-accent">Cloud</span>
          </h1>
          <span className="login-subtitle">Enterprise Data Solutions</span>
          
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fa-solid fa-shield-check text-[10px] text-blue-600"></i>
              </div>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Data Isolation Protocol
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium pl-9">
              Your business intelligence is protected by bank-grade encryption and isolated per-tenant architecture.
            </p>
          </div>
        </div>

        {error && (
          <div className="login-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="btn-google group"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch fa-spin text-blue-600 text-lg"></i>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loading ? 'MEMPROSES...' : 'Login with Google'}</span>
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OR</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <button 
            onClick={() => {
              localStorage.setItem('alphaPro_bypass', 'true')
              window.location.reload()
            }}
            className="btn-demo"
          >
            <i className="fa-solid fa-bolt-lightning text-amber-400"></i>
            <span>Continue as Guest</span>
          </button>
        </div>

        <p className="mt-12 text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em]">Powered by Supabase Engine</p>
      </div>
    </div>
  )
}
